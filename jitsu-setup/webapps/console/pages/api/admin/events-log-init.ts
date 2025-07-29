import { createRoute, getUser, verifyAdmin } from "../../../lib/api";
import { checkRawToken } from "juava";
import { clickhouse } from "../../../lib/server/clickhouse";
import { z } from "zod";
import { getServerLog } from "../../../lib/server/log";

const log = getServerLog("events-log-init");

export default createRoute()
  .GET({
    query: z.object({
      token: z.string().optional(),
    }),
  })
  .handler(async ({ req, res, query }) => {
    let initTokenUsed = false;
    if (process.env.CONSOLE_INIT_TOKEN && query.token) {
      if (checkRawToken(process.env.CONSOLE_INIT_TOKEN, query.token)) {
        process.env.CONSOLE_INIT_TOKEN = undefined;
        initTokenUsed = true;
      }
    }
    if (!initTokenUsed) {
      const user = await getUser(res, req);
      if (!user) {
        res.status(401).send({ error: "Authorization Required" });
        return;
      }
      await verifyAdmin(user);
    }
    log.atInfo().log(`Init events log`);
    const metricsSchema =
      process.env.CLICKHOUSE_METRICS_SCHEMA || process.env.CLICKHOUSE_DATABASE || "newjitsu_metrics";
    const metricsCluster = process.env.CLICKHOUSE_METRICS_CLUSTER || process.env.CLICKHOUSE_CLUSTER;
    const onCluster = metricsCluster ? ` ON CLUSTER ${metricsCluster}` : "";
    const createDbQuery: string = `create database IF NOT EXISTS ${metricsSchema}${onCluster}`;
    try {
      await clickhouse.command({
        query: createDbQuery,
      });
      log.atInfo().log(`Database ${metricsSchema} created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema} database.`);
      throw new Error(`Failed to create ${metricsSchema} database.`);
    }
    const errors: Error[] = [];
    const createEventsLogTableQuery: string = `create table IF NOT EXISTS ${metricsSchema}.events_log ${onCluster}
         (
           timestamp DateTime64(3),
           actorId LowCardinality(String),
           type LowCardinality(String),
           level LowCardinality(String),
           message   String
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/events_log', '{replica}')"
             : "MergeTree()"
         } 
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (actorId, type, timestamp)`;

    try {
      await clickhouse.command({
        query: createEventsLogTableQuery,
      });
      log.atInfo().log(`Table ${metricsSchema}.events_log created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.events_log table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.events_log table.`));
    }
    const createTaskLogTableQuery: string = `create table IF NOT EXISTS ${metricsSchema}.task_log ${onCluster}
         (
           task_id String,
           sync_id LowCardinality(String),
           timestamp DateTime64(3),
           level LowCardinality(String),
           logger LowCardinality(String),
           message   String
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/task_log', '{replica}')"
             : "MergeTree()"
         } 
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (task_id, sync_id, timestamp)
        TTL toDateTime(timestamp) + INTERVAL 3 MONTH DELETE`;

    try {
      await clickhouse.command({
        query: createTaskLogTableQuery,
      });
      log.atInfo().log(`Table ${metricsSchema}.task_log created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.task_log table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.task_log table.`));
    }
    // --- New Event Tables ---
    const createPageViewsTableQuery = `create table IF NOT EXISTS ${metricsSchema}.page_views ${onCluster}
         (
           event_time      DateTime,
           session_id      String,
           user_id         Nullable(String),
           page_url        String,
           referrer        Nullable(String),
           user_agent      Nullable(String),
           device_type     Nullable(String),
           country         Nullable(String),
           city            Nullable(String),
           additional_data Nullable(String)
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/page_views', '{replica}')"
             : "MergeTree()"
         }
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (event_time, session_id)`;
    try {
      await clickhouse.command({ query: createPageViewsTableQuery });
      log.atInfo().log(`Table ${metricsSchema}.page_views created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.page_views table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.page_views table.`));
    }

    const createProductViewsTableQuery = `create table IF NOT EXISTS ${metricsSchema}.product_views ${onCluster}
         (
           event_time      DateTime,
           session_id      String,
           user_id         Nullable(String),
           product_id      String,
           product_name    Nullable(String),
           price           Nullable(Float64),
           category        Nullable(String),
           page_url        String,
           referrer        Nullable(String),
           additional_data Nullable(String)
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/product_views', '{replica}')"
             : "MergeTree()"
         }
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (event_time, product_id, session_id)`;
    try {
      await clickhouse.command({ query: createProductViewsTableQuery });
      log.atInfo().log(`Table ${metricsSchema}.product_views created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.product_views table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.product_views table.`));
    }

    const createAddToCartTableQuery = `create table IF NOT EXISTS ${metricsSchema}.add_to_cart ${onCluster}
         (
           event_time      DateTime,
           session_id      String,
           user_id         Nullable(String),
           product_id      String,
           product_name    Nullable(String),
           price           Nullable(Float64),
           quantity        UInt32,
           page_url        String,
           referrer        Nullable(String),
           additional_data Nullable(String)
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/add_to_cart', '{replica}')"
             : "MergeTree()"
         }
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (event_time, product_id, session_id)`;
    try {
      await clickhouse.command({ query: createAddToCartTableQuery });
      log.atInfo().log(`Table ${metricsSchema}.add_to_cart created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.add_to_cart table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.add_to_cart table.`));
    }

    const createPurchasesTableQuery = `create table IF NOT EXISTS ${metricsSchema}.purchases ${onCluster}
         (
           event_time      DateTime,
           session_id      String,
           user_id         Nullable(String),
           order_id        String,
           product_id      String,
           product_name    Nullable(String),
           price           Float64,
           quantity        UInt32,
           total_amount    Float64,
           payment_method  Nullable(String),
           page_url        String,
           referrer        Nullable(String),
           additional_data Nullable(String)
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/purchases', '{replica}')"
             : "MergeTree()"
         }
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (event_time, order_id, product_id)`;
    try {
      await clickhouse.command({ query: createPurchasesTableQuery });
      log.atInfo().log(`Table ${metricsSchema}.purchases created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.purchases table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.purchases table.`));
    }

    const createCustomEventsTableQuery = `create table IF NOT EXISTS ${metricsSchema}.custom_events ${onCluster}
         (
           event_time      DateTime,
           session_id      String,
           user_id         Nullable(String),
           event_type      String,
           event_name      String,
           page_url        String,
           referrer        Nullable(String),
           event_data      Nullable(String),
           additional_data Nullable(String)
         )
         engine = ${
           metricsCluster
             ? "ReplicatedMergeTree('/clickhouse/tables/{shard}/" + metricsSchema + "/custom_events', '{replica}')"
             : "MergeTree()"
         }
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (event_time, event_type, session_id)`;
    try {
      await clickhouse.command({ query: createCustomEventsTableQuery });
      log.atInfo().log(`Table ${metricsSchema}.custom_events created or already exists`);
    } catch (e: any) {
      log.atError().withCause(e).log(`Failed to create ${metricsSchema}.custom_events table.`);
      errors.push(new Error(`Failed to create ${metricsSchema}.custom_events table.`));
    }
    if (errors.length > 0) {
      throw new Error("Failed to initialize tables: " + errors.map(e => e.message).join(", "));
    }
  })
  .toNextApiHandler();
