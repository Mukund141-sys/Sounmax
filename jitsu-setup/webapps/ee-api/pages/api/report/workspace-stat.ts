import type { NextApiRequest, NextApiResponse } from "next";
import {
  assertDefined,
  assertTrue,
  getErrorMessage,
  getLog,
  namedParameters,
  requireDefined,
  SqlQueryParameters,
} from "juava";
import { withErrorHandler } from "../../../lib/route-helpers";
import { auth } from "../../../lib/auth";
import { clickhouse, pg, store } from "../../../lib/services";
import * as PG from "pg";
import { getServerLog } from "../../../lib/log";
import { listAllSubscriptions, stripe, stripeDataTable } from "../../../lib/stripe";
import Stripe from "stripe";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const log = getServerLog("/api/report");

const workspaceStatSql = require("../../../lib/sql/workspace-info.sql").default;

export type ISODate = string;

export type WorkspaceReportRow = {
  period: ISODate;
  workspaceId: string;
  events: number;
  syncs: number;
};

export type ReportParams = {
  workspaceId?: string;
  start: ISODate;
  end: ISODate;
  granularity: "day";
};

function removeUndefined<T>(obj: Record<string, T | undefined>): Record<string, T> {
  const res: Record<string, T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      res[key] = value;
    }
  }
  return res;
}

function isoDateTOClickhouse(date: ISODate): string {
  return date.replace("T", " ").replace("Z", "").split(".")[0];
}

async function getSyncs() {
  return await query(
    pg,
    `select
                "workspaceId",
                date_trunc('day', started_at) as period,

                count(distinct sync."fromId" || sync."toId") as "activeSyncs"
            from newjitsu.source_task task
                 join newjitsu."ConfigurationObjectLink" sync on task.sync_id = sync."id"
            where (task.status = 'SUCCESS' OR task.status = 'PARTIAL')
              and started_at > now() - interval '120 days'
            group by "workspaceId", period
            order by period desc , "workspaceId";`
  );
}

export async function getEventsReportFromCache({
  start,
  end,
  workspaceId,
}: ReportParams): Promise<WorkspaceReportRow[]> {
  const sql = `select 
      period, "workspaceId", events 
      from newjitsuee.stat_cache 
      where period >= :start and period <= :end
      ${workspaceId ? 'and "workspaceId" = {workspaceId:String}' : ""} 
      order by period;`;
  log.atInfo().log(`Getting events report from cache for [${start}, ${end}]. Workspace: ${workspaceId || "all"}`);
  return (
    (await query(pg, sql, {
      start,
      end,
      workspaceId,
    })) as any
  ).map(({ events, ...rest }) => ({ events: Number(events), ...rest }));
}

export async function getEventsReport({
  granularity,
  start,
  end,
  workspaceId,
}: ReportParams): Promise<WorkspaceReportRow[]> {
  const timer = Date.now();
  const metricsSchema = process.env.CLICKHOUSE_METRICS_SCHEMA || process.env.CLICKHOUSE_DATABASE || "newjitsu_metrics";
  const query = `select
                   date_trunc('${granularity}', timestamp) as period,
                   workspaceId as "workspaceId",
                   sum(count) as events
                 from ${metricsSchema}.active_incoming_agg_view
                 where
                   timestamp >= toDateTime('2023-07-28 00:00:00', 'UTC') and
                   timestamp >= toDateTime({start :String}, 'UTC') and
                   timestamp < toDateTime({end :String}, 'UTC') ${
                     workspaceId ? "and workspaceId = {workspaceId:String}" : ""
                   }
                 group by period, workspaceId
                 order by period desc, workspaceId desc;
  `;
  const queryParams = removeUndefined({
    start: isoDateTOClickhouse(dayjs(start).utc().startOf("day").toISOString()),
    end: isoDateTOClickhouse(dayjs(end).utc().endOf("day").toISOString()),
    granularity,
    workspaceId,
  });
  getLog()
    .atDebug()
    .log(`Running Clickhouse query with ${JSON.stringify(queryParams)} : ${query}`);
  log.atInfo().log(`Running Clickhouse events report for [${start}, ${end}]. Workspace: ${workspaceId || "all"}`);
  try {
    const resultSet = await clickhouse.query({
      query,
      clickhouse_settings: {
        wait_end_of_query: 1,
        max_execution_time: 600,
        timeout_overflow_mode: "throw",
      },
      query_params: queryParams,
    });
    const rows: any[] = ((await resultSet.json()) as any).data;
    log.atInfo().log(`Clickhouse query took ${Date.now() - timer}ms. Rows in result: ${rows.length}`);

    return rows.map(({ events, period, ...rest }) => ({
      events: Number(events),
      period: period.replace(" ", "T") + ".000Z",
      ...rest,
    }));
  } catch (e) {
    log
      .atError()
      .withCause(e)
      .log(`Error running Clickhouse query for [${start}, ${end}]: ${getErrorMessage(e)}\n Query:\n${query}`);
    throw e;
  }
}

function getDate(param: string | undefined, defaultVal?: string): Date {
  return param ? new Date(param) : defaultVal ? new Date(defaultVal) : new Date();
}

export async function query(pg: PG.Pool, sql: string, params: SqlQueryParameters = []): Promise<Record<string, any>[]> {
  const { query, values } = namedParameters(sql, params);
  //log.atInfo().log(`Querying: ${unrollParams(query, values)}`);
  return await pg.query({ text: query, values }).then(res => {
    return res.rows;
  });
}

function minusDays(d, days) {
  return new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
}

type WorkspaceInfo = {
  id: string;
  slug: string;
  name: string;
  domains?: string[];
};

type ExtendedWorkspaceReportRow = WorkspaceReportRow & WorkspaceInfo;

export async function buildWorkspaceReport({
  start,
  end,
  granularity,
  workspaceId,
  useCache = false,
}: ReportParams & { useCache?: boolean }): Promise<WorkspaceReportRow[]> {
  const [eventsReport, syncs] = await Promise.all([
    useCache
      ? getEventsReportFromCache({ start, end, granularity, workspaceId })
      : getEventsReport({ start, end, granularity, workspaceId }),
    getSyncs(),
  ]);
  const report = new Map<string, WorkspaceReportRow>();
  eventsReport.forEach(row =>
    report.set(row.workspaceId + "_" + row.period, {
      workspaceId: row.workspaceId,
      period: row.period,
      events: 0,
      syncs: 0,
    })
  );
  syncs.forEach(row =>
    report.set(row.workspaceId + "_" + row.period.toISOString(), {
      workspaceId: row.workspaceId,
      period: row.period.toISOString(),
      events: 0,
      syncs: 0,
    })
  );
  eventsReport.forEach(row => (report.get(row.workspaceId + "_" + row.period)!.events = row.events));
  syncs.forEach(row => (report.get(row.workspaceId + "_" + row.period.toISOString())!.syncs = row.activeSyncs));
  return [...report.values()];
}

async function extend(reportResult: WorkspaceReportRow[]): Promise<ExtendedWorkspaceReportRow[]> {
  const workspaceInfo = await query(pg, workspaceStatSql);
  const workspaceInfoMap = workspaceInfo.reduce((acc, w) => {
    acc[w.workspaceId] = w;
    return acc;
  }, {});
  return reportResult.map(r => ({ ...r, ...workspaceInfoMap[r.workspaceId] }));
}

const handler = async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type, baggage, sentry-trace");
  if (req.method === "OPTIONS") {
    //allowing requests from everywhere since our tokens are short-lived
    //and can't be hijacked
    res.status(200).end();
    return;
  }
  const claims = await auth(req, res);
  if (!claims) {
    res.status(401).end();
    return;
  }
  const workspaceId = claims.type === "user" ? claims.workspaceId : (req.query.workspaceId as string) || undefined;
  const extended = req.query.extended === "true";
  const start = getDate(req.query.start as string, minusDays(new Date(), 32).toISOString()).toISOString();
  const end = getDate(req.query.end as string, new Date().toISOString()).toISOString();
  const granularity = "day"; // = ((req.query.granularity as string) || "day").toLowerCase();
  const timer = Date.now();
  log.atInfo().log("Building workspace report");
  const reportResult = await buildWorkspaceReport({
    start,
    end,
    granularity,
    workspaceId,
    useCache: req.query.cache === "true",
  });
  log.atInfo().log(`Workspace report built in ${Date.now() - timer}ms. Rows in result: ${reportResult.length}`);
  let records = extended ? await extend(reportResult) : reportResult;
  if (req.query.billing === "true") {
    const allWorkspaces = workspaceId
      ? [
          {
            id: workspaceId,
            obj: await store.getTable(stripeDataTable).get(workspaceId),
          },
        ]
      : await store.getTable(stripeDataTable).list();

    const subscriptions: Record<string, Stripe.Subscription[]> = (await listAllSubscriptions()).reduce((acc, sub) => {
      let customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      acc[customerId] = [...(acc[customerId] || []), sub];
      return acc;
    }, {});

    const sub2product = new Map<string, Stripe.Product>();
    for (const sub of Object.values(subscriptions).flat()) {
      const productId = sub.items.data[0].price.product;
      assertDefined(productId, `Can't get product from subscription ${sub.id}`);
      assertTrue(typeof productId === "string", `Subscription ${sub.id} should have a string product id`);
      const product = await stripe.products.retrieve(productId as string);
      assertDefined(product, `Can't get product ${productId} from subscription ${sub.id}. Product doesn't exist`);
      sub2product.set(sub.id, product);
    }
    const workspacePlans: Record<string, string> = {};

    for (const { id: workspaceId, obj } of allWorkspaces) {
      const { stripeCustomerId, customBilling } = obj;
      if (customBilling) {
        workspacePlans[workspaceId] = "enterprise";
        continue;
      }

      const customerSubscriptions = subscriptions[stripeCustomerId];
      if (!customerSubscriptions) {
        continue;
      }
      const products = customerSubscriptions.map(sub =>
        requireDefined(sub2product.get(sub.id), `Can't find product for subscription ${sub.id}`)
      );
      const product = products.find(p => !!p.metadata.jitsu_plan_id);
      if (product) {
        if (customerSubscriptions.find(sub => sub.status === "active" && !sub.cancel_at_period_end)) {
          workspacePlans[workspaceId] = "paying";
        } else if (customerSubscriptions.find(sub => sub.status === "active" || sub.cancel_at_period_end)) {
          workspacePlans[workspaceId] = "cancelling";
        } else {
          workspacePlans[workspaceId] = "free";
        }
        records = records.map(r => ({ ...r, billingStatus: workspacePlans[r.workspaceId] || "free" }));
      }
    }
  }
  res.send(req.query.format === "array" ? records : { data: records });
};

export const config = {
  maxDuration: 120,
};

export default withErrorHandler(handler);
