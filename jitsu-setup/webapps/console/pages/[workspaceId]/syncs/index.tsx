import { WorkspacePageLayout } from "../../../components/PageLayout/WorkspacePageLayout";
import { useAppConfig, useWorkspace, WorkspaceContext } from "../../../lib/context";
import { get } from "../../../lib/useApi";
import { DestinationConfig, ServiceConfig } from "../../../lib/schema";
import { ConfigurationObjectLinkDbModel } from "../../../prisma/schema";
import { z } from "zod";
import { Table, Tooltip } from "antd";
import { confirmOp, feedbackError, feedbackSuccess } from "../../../lib/ui";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaExternalLinkAlt, FaPlay, FaPlus, FaTrash } from "react-icons/fa";
import { getLog, index, rpc } from "juava";
import { useRouter } from "next/router";
import { jsonSerializationBase64, useQueryStringState } from "../../../lib/useQueryStringState";
import { TableProps } from "antd/es/table/InternalTable";
import { ColumnType, SortOrder } from "antd/es/table/interface";
import {
  AlertTriangle,
  Edit3,
  ExternalLink,
  Inbox,
  ListMinusIcon,
  Loader2,
  RefreshCw,
  WrenchIcon,
  XCircle,
} from "lucide-react";
import { PlusOutlined } from "@ant-design/icons";
import { JitsuButton, WJitsuButton } from "../../../components/JitsuButton/JitsuButton";
import { ErrorCard } from "../../../components/GlobalError/GlobalError";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import { ServiceTitle } from "../services";
import { DestinationTitle } from "../destinations";
import JSON5 from "json5";
import { ButtonGroup, ButtonProps } from "../../../components/ButtonGroup/ButtonGroup";
import { Overlay } from "../../../components/Overlay/Overlay";
import { CodeBlock } from "../../../components/CodeBlock/CodeBlock";
import { processTaskStatus, TaskStatus } from "./tasks";
import omit from "lodash/omit";
import { toURL } from "../../../lib/shared/url";
import { useConfigObjectLinks, useConfigObjectList, useStoreReload } from "../../../lib/store";
import { getCoreDestinationTypeNonStrict } from "../../../lib/schema/destinations";
import { FaRegFloppyDisk } from "react-icons/fa6";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const formatDate = (date: string | Date) =>
  dayjs(date, "YYYY-MM-DDTHH:mm:ss.SSSZ").utc().format("YYYY-MM-DD HH:mm:ss");
export const formatDateOnly = (date: string | Date) =>
  dayjs(date, "YYYY-MM-DDTHH:mm:ss.SSSZ").utc().format("YYYY-MM-DD");
export const formatTime = (date: string | Date) => dayjs(date, "YYYY-MM-DDTHH:mm:ss.SSSZ").utc().format("HH:mm:ss");

function EmptyLinks() {
  const workspace = useWorkspace();
  return (
    <div>
      <div className="flex flex-col items-center">
        <div className="text-xl text-textLight mb-3">
          {" "}
          You don't have any links between <Link href={`/${workspace.slugOrId}/services`}>services</Link> and{" "}
          <Link href={`/${workspace.slugOrId}/destinations`}>destinations</Link>
        </div>

        <WJitsuButton href={`/syncs/edit`} type="link">
          <span className="text-lg">Create your first sync</span>
        </WJitsuButton>
      </div>
    </div>
  );
}

type SyncDbModel = z.infer<typeof ConfigurationObjectLinkDbModel>;

type RemoteEntitiesProps = {
  services: ServiceConfig[];
  destinations: DestinationConfig[];
  links: Omit<SyncDbModel, "data">[];
};

type SortingSettings = {
  columns: { order: SortOrder; field: string }[];
};

export function displayTaskRunError(workspace: WorkspaceContext, error: { error: string; errorType?: string }) {
  if (error.errorType === "quota_exceeded") {
    feedbackError(
      <div className="flex flex-col">
        <div className="text-red-500 font-bold mb-2">Quota exceeded</div>
        <div className="text-sm my-2">{error.error}</div>
        <Link href={`/${workspace.slugOrId}/settings/billing`} className="flex items-center space-x-2 underline">
          Please, update your plan here <ExternalLink className="w-4 h-4" />{" "}
        </Link>
      </div>,
      { placement: "top" }
    );
  } else {
    feedbackError(error.error, { placement: "top" });
  }
}

export const NotFound: React.FC<{ id: string; type: string }> = ({ id, type }) => {
  return (
    <Tooltip
      overlay={
        <div>
          <span className="capitalize">{type}</span> with id <code>{id}</code> not found. It might happen if you deleted
          it.
        </div>
      }
    >
      <div className="flex items-center jusify-left w-fit cursor-pointer">
        <AlertTriangle className="w-4 h-4 text-warning mr-2" />
        <div className="capitalize text">{type} not found</div>
      </div>
    </Tooltip>
  );
};

function SyncsTable({ links, services, destinations }: RemoteEntitiesProps) {
  const servicesById = index(services, "id");
  const destinationsById = index(destinations, "id");
  const linksById = index(links, "id");
  const workspace = useWorkspace();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [tasksLoading, setTasksLoading] = React.useState(true);

  const [sorting, setSorting] = useQueryStringState<SortingSettings>("sorting", {
    defaultValue: { columns: [] },
    ...jsonSerializationBase64,
  });
  const [tasks, setTasks] = useState<{ data?: any; error?: any }>({ data: {} });
  const [runPressed, setRunPressed] = useState<string | undefined>(undefined);

  const [refresh, setRefresh] = useState(0);
  const reloadStore = useStoreReload();

  const [apiDocs, setShowAPIDocs] = useQueryStringState<string | undefined>("schedule");
  //useEffect update tasksData every 10 seconds
  useEffect(() => {
    (async () => {
      try {
        setTasksLoading(true);
        const data = await rpc(`/api/${workspace.id}/sources/tasks`, { body: links.map(l => l.id) });
        setTasks({ data });
      } catch (e) {
        setTasks({ data: {}, error: e });
      } finally {
        setTasksLoading(false);
      }
    })();
  }, [links, workspace.id, refresh]);

  const deleteSync = async (link: Omit<SyncDbModel, "data">) => {
    if (await confirmOp("Are you sure you want to unlink this service from this destination?")) {
      setLoading(true);
      try {
        await get(`/api/${workspace.id}/config/link`, {
          method: "DELETE",
          query: { id: link.id },
        });
        await reloadStore();
        feedbackSuccess("Successfully unliked");
      } catch (e) {
        feedbackError("Failed to unlink service and destination", { error: e });
      } finally {
        setLoading(false);
      }
    }
  };
  getLog()
    .atDebug()
    .log(
      `<SyncsTable /> sorter: ${sorting.columns.map(({ field, order }) => `${field}/${order}`).join(", ")}`,
      sorting
    );
  const onChange: TableProps<any>["onChange"] = (pagination, filters, sorter, { currentDataSource }) => {
    const sortArray = Array.isArray(sorter) ? sorter : [sorter];
    const columns = sortArray
      .filter(s => !!s.column?.title && !!s.order)
      .map(s => ({ field: s.column?.title, order: s.order }));
    const newVal = {
      columns: columns as any,
    };
    setSorting(newVal);
  };
  const columns: ColumnType<any>[] = [
    {
      title: "From",
      width: "35%",
      sortOrder: sorting.columns?.find(s => s.field === "From")?.order,
      sorter: (a, b) => {
        const serviceA = servicesById[a.fromId];
        const serviceB = servicesById[b.fromId];
        return (serviceA?.name || "").localeCompare(serviceB?.name || "");
      },
      render: (text, link) => {
        const service = servicesById[link.fromId];
        return service ? <ServiceTitle service={service} link /> : <NotFound id={link.fromId} type={"service"} />;
      },
    },
    {
      title: "To",
      width: "35%",
      sortOrder: sorting.columns?.find(s => s.field === "To")?.order,
      sorter: (a, b) => {
        const destinationA = destinations[a.toId];
        const destinationB = destinations[b.toId];
        return (destinationA?.name || "").localeCompare(destinationB?.name || "");
      },
      render: (text, link) => {
        const destination = destinationsById[link.toId];
        return destination ? <DestinationTitle destination={destination} link /> : "Not Found";
      },
    },
    {
      title: (
        <div className={"whitespace-nowrap content-end"}>
          Last Status
          <JitsuButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${tasksLoading && refresh > 0 && "animate-spin"}`} />}
            type="link"
            size="small"
            rootClassName={"top-0.5"}
            onClick={() => {
              setRefresh(refresh + 1);
            }}
          ></JitsuButton>
        </div>
      ),
      className: "text-right whitespace-nowrap",
      width: "4%",
      render: (text, link) => {
        if (tasks.error) {
          return <div style={{ height: 41 }}>error</div>;
        }
        const t = tasks.data.tasks?.[link.id];
        return <TaskStatus task={processTaskStatus(t)} loading={tasksLoading} />;
      },
    },
    {
      title: <div className={"whitespace-nowrap text-right"}>Started (UTC)</div>,
      width: "12%",
      render: (text, link) => {
        if (tasks.error) {
          return undefined;
        }
        const t = tasks.data.tasks?.[link.id];
        return (
          t && (
            <div className={"flex flex-col items-end"}>
              <span className={"whitespace-nowrap"}>{`${dayjs(t.started_at).fromNow(true)} ago`}</span>
              <div className={"text-xxs whitespace-nowrap text-gray-500"}>{t ? formatDate(t.started_at) : ""}</div>
            </div>
          )
        );
      },
    },
    {
      title: <div className={"text-right"}>Actions</div>,
      render: (text, link) => {
        const toTasks = async () =>
          router.push(
            `/${workspace.slugOrId}/syncs/tasks?query=${encodeURIComponent(
              JSON5.stringify({
                syncId: link.id,
                notification: "Sync Started",
              })
            )}`
          );
        const t = tasks?.data?.tasks?.[link.id];
        const items: ButtonProps[] = [
          {
            disabled: t?.status === "RUNNING" || !!runPressed,
            tooltip: t?.status === "RUNNING" ? "Sync is already runPressed" : undefined,
            icon:
              runPressed == link.id ? (
                <Loader2 className="animate-spin w-3.5 h-3.5" />
              ) : (
                <FaPlay className="w-3.5 h-3.5" />
              ),
            onClick: async () => {
              if (!!runPressed) {
                return;
              }
              setRunPressed(link.id);
              try {
                const data = await rpc(`/api/${workspace.id}/sources/tasks`, { body: links.map(l => l.id) });
                setTasks({ data });
                if (data.tasks?.[link.id]?.status === "RUNNING") {
                  toTasks();
                  return;
                }
              } catch (e) {}
              try {
                const runStatus = await rpc(`/api/${workspace.id}/sources/run?syncId=${link.id}`);
                if (runStatus?.error) {
                  displayTaskRunError(workspace, runStatus);
                } else {
                  router.push(
                    `/${workspace.slugOrId}/syncs/tasks?query=${encodeURIComponent(
                      JSON5.stringify({
                        syncId: link.id,
                        notification: "Sync Started",
                      })
                    )}`
                  );
                }
              } catch (e) {
                feedbackError("Failed to run sync", { error: e, placement: "top" });
              } finally {
                setRunPressed(undefined);
              }
            },
            label: "Run",
          },
          {
            icon: <ListMinusIcon className={"w-5 h-5"} />,
            label: "Logs",
            href: `/syncs/tasks?query=${JSON5.stringify({ syncId: link.id })}`,
          },
          {
            icon: <Edit3 className={"w-4 h-4"} />,
            label: "Edit",
            href: `/syncs/edit?id=${link.id}`,
            requiredPermission: "editEntities",
          },
          {
            disabled: t?.status === "RUNNING" || !!runPressed,
            tooltip: t?.status === "RUNNING" ? "Sync is already running" : undefined,
            icon:
              runPressed == link.id ? (
                <Loader2 className="animate-spin w-3.5 h-3.5" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              ),
            onClick: async () => {
              if (!!runPressed) {
                return;
              }
              setRunPressed(link.id);
              try {
                const data = await rpc(`/api/${workspace.id}/sources/tasks`, { body: links.map(l => l.id) });
                setTasks({ data });
                if (data.tasks?.[link.id]?.status === "RUNNING") {
                  toTasks();
                  return;
                }
              } catch (e) {}
              try {
                const runStatus = await rpc(`/api/${workspace.id}/sources/run?syncId=${link.id}&fullSync=true`);
                if (runStatus?.error) {
                  displayTaskRunError(workspace, runStatus);
                } else {
                  toTasks();
                }
              } catch (e) {
                feedbackError("Failed to run sync", { error: e, placement: "top" });
              } finally {
                setRunPressed(undefined);
              }
            },
            label: "Full Sync",
            collapsed: true,
          },
          {
            icon: <WrenchIcon className={"w-4 h-4"} />,
            onClick: async () => {
              setShowAPIDocs(link.id);
            },
            label: "API",
            collapsed: true,
          },
          {
            icon: <FaRegFloppyDisk className={"w-4 h-4"} />,
            label: "Saved State",
            href: `/syncs/state?id=${link.id}`,
            collapsed: true,
          },
          {
            icon: <FaTrash />,
            onClick: async () => {
              deleteSync(link);
            },
            danger: true,
            label: "Delete",
            collapsed: true,
            requiredPermission: "deleteEntities",
          },
        ];
        return <ButtonGroup items={items} />;
      },
    },
  ];
  return (
    <div>
      <Table
        rowKey={"id"}
        dataSource={links}
        sortDirections={["ascend", "descend"]}
        columns={columns}
        className="border border-backgroundDark rounded-lg"
        pagination={false}
        // expandable={{
        //   expandedRowRender: link => {
        //     console.log("link", link);
        //     const task = processTaskStatus(tasks.data.tasks?.[link.id]);
        //     console.log("task", task);
        //     return (
        //       <TaskStatusResultTable
        //         error={task.error ?? ""}
        //         stats={Object.entries(task.stats).reduce((arr, v) => {
        //           const o = { key: v[0], stream: v[0], ...(v[1] as any) };
        //           arr.push(o);
        //           return arr;
        //         }, [] as any[])}
        //       />
        //     );
        //   },
        //   rowExpandable: link => {
        //     const t = tasks.data.tasks?.[link.id];
        //     return !!t && t.status !== "SKIPPED";
        //   },
        //   // expandIcon: () => undefined,
        // }}
        loading={loading}
        onChange={onChange}
      />
      {apiDocs && (
        <ScheduleDocumentation
          syncId={apiDocs}
          service={servicesById[linksById[apiDocs].fromId]}
          destination={destinationsById[linksById[apiDocs].toId]}
          onCancel={() => {
            setShowAPIDocs(undefined);
          }}
        />
      )}
    </div>
  );
}

function Syncs(props: RemoteEntitiesProps) {
  const { services, destinations, links } = props;
  const router = useRouter();
  const destinationFilter = router.query.destination as string | undefined;
  const srcFilter = router.query.source as string | undefined;
  const workspace = useWorkspace();
  const bulkerDsts = destinations.filter(d => {
    const dest = getCoreDestinationTypeNonStrict(d.destinationType);
    return dest && (dest.usesBulker || dest.syncs);
  });

  if (services.length == 0 || bulkerDsts.length == 0) {
    return (
      <div className="flex flex-col justify-center items-center ">
        <Inbox className="w-16 h-16 text-textDisabled" />
        <div className="text-center mt-12 text text-textLight max-w-4xl">
          In order to create a sync please create at least one connector and destination of <b>data warehouse</b> or{" "}
          <b>cloud storage</b> type. Currently, you have{" "}
          <Link href={`/${workspace.slugOrId}/destinations`} className="underline">
            {bulkerDsts.length} destination{bulkerDsts.length === 1 ? "" : "s"}
          </Link>{" "}
          and{" "}
          <Link href={`/${workspace.slugOrId}/services`} className="underline">
            {services.length} connector{services.length === 1 ? "" : "s"}
          </Link>{" "}
          configured
        </div>
        <div className="flex space-x-4 items-center mt-4">
          <WJitsuButton href={"/services"} type="default" icon={<PlusOutlined />} requiredPermission="createEntities">
            Create Connector
          </WJitsuButton>
          <WJitsuButton
            href={"/destinations"}
            type="default"
            icon={<PlusOutlined />}
            requiredPermission="createEntities"
          >
            Create Destination
          </WJitsuButton>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between pb-6">
        <div className="flex items-center">
          <div className="text-3xl">Syncs</div>
          {destinationFilter && (
            <div className="mt-1 ml-4 rounded-full bg-textDisabled/50 px-4 py-1 flex flex-nowrap items-center">
              <DestinationTitle size="small" destination={destinations.find(d => d.id === destinationFilter)} />
              <Link className={"ml-1"} prefetch={false} href={toURL(router.route, omit(router.query, ["destination"]))}>
                <XCircle className="w-4 h-4 text-textLight" />
              </Link>
            </div>
          )}
          {srcFilter && (
            <div className="mt-1 ml-4 rounded-full bg-textDisabled/50 px-4 py-1 flex flex-nowrap items-center">
              <ServiceTitle size="small" service={services.find(d => d.id === srcFilter)} />
              <Link className={"ml-1"} prefetch={false} href={toURL(router.route, omit(router.query, ["source"]))}>
                <XCircle className="w-4 h-4 text-textLight" />
              </Link>
            </div>
          )}
        </div>

        <div>
          <WJitsuButton
            href={`/syncs/edit`}
            type="primary"
            size="large"
            icon={<FaPlus className="anticon" />}
            requiredPermission="createEntities"
          >
            Connect service and destination
          </WJitsuButton>
        </div>
      </div>
      <div>
        {links.length === 0 && <EmptyLinks />}
        {links.length > 0 && (
          <SyncsTable
            links={links
              .filter(l => !destinationFilter || l.toId === destinationFilter)
              .filter(l => !srcFilter || l.fromId === srcFilter)}
            services={services}
            destinations={destinations}
          />
        )}
      </div>
    </div>
  );
}

function SyncsLoader(props: { reloadCallback: () => void }) {
  const workspace = useWorkspace();
  const appconfig = useAppConfig();

  const services = useConfigObjectList("service");
  const destinations = useConfigObjectList("destination");
  const links = useConfigObjectLinks({ withData: true, type: "sync" });

  if (!(appconfig.syncs.enabled || workspace.featuresEnabled.includes("syncs"))) {
    return (
      <ErrorCard
        title={"Feature is not enabled"}
        error={{ message: "'Sources Sync' feature is not enabled for current project." }}
        hideActions={true}
      />
    );
  }

  return <Syncs services={services} destinations={destinations} links={links} />;
}

export const SyncTitle: React.FC<{
  syncId: string;
  service: ServiceConfig;
  destination: DestinationConfig;
  size?: "small" | "medium" | "large";
  className?: string;
  showLink?: boolean;
}> = ({ syncId, service, size = "small", destination, showLink, className = false }) => {
  return (
    <div className={`flex flex-row whitespace-nowrap gap-1.5 ${className ?? ""}`}>
      <div className="flex flex-row items-center flex-nowrap">
        <ServiceTitle size={size === "medium" ? "default" : size} service={service} link={showLink} />
      </div>
      {"→"}
      <div className="flex flex-row items-center flex-nowrap">
        <DestinationTitle size={size === "medium" ? "default" : size} destination={destination} />
        {showLink && (
          <WJitsuButton
            href={`/syncs/edit?id=${syncId}`}
            type="link"
            className="link"
            size="small"
            icon={<FaExternalLinkAlt className="w-2.5 h-2.5" />}
          />
        )}
      </div>
    </div>
  );
};

const ScheduleDocumentation: React.FC<{
  syncId: string;
  service: ServiceConfig;
  destination: DestinationConfig;
  onCancel: () => void;
}> = ({ syncId, service, destination, onCancel }) => {
  const appConfig = useAppConfig();
  const workspace = useWorkspace();

  const displayDomain =
    appConfig.publicEndpoints.protocol +
    "://" +
    appConfig.publicEndpoints.host +
    ([80, 443].includes(appConfig.publicEndpoints.port ?? 80) ? "" : ":" + appConfig.publicEndpoints.port);
  return (
    <Overlay onClose={onCancel} className="px-6 py-6">
      <div className={"flex flex-row gap-2 border-b pb-2 mb-4"} style={{ minWidth: 900 }}>
        <SyncTitle syncId={syncId} service={service} destination={destination} />
      </div>
      <div className="flex flex-row">
        <div className={"flex-shrink prose-sm max-w-none overflow-auto"}>
          <h2 id={"trigger"}>Trigger Sync</h2>
          <h3>Endpoint</h3>
          <CodeBlock>{`${displayDomain}/api/${workspace.id}/sources/run?syncId=${syncId}`}</CodeBlock>
          <ul>
            <li>
              <b>syncId</b> - id of Sync object
            </li>
            <li>
              <b>fullSync</b> - optional, boolean, if true - saved state will be deleted and full sync will be performed
              replacing all source data in destination
            </li>
          </ul>
          <h3>Authorization</h3>
          Use <b>Authorization</b> header with <b>Bearer</b> token. You can obtain token in{" "}
          <Link href={"/user"}>Settings</Link> page.
          <h3>Example</h3>
          <CodeBlock lang={"bash"}>
            {`curl -H "Authorization: bearer abc:123" \\
"${displayDomain}/api/${workspace.id}/sources/run?syncId=${syncId}"`}
          </CodeBlock>
          <h3>Response</h3>
          Successful response:
          <CodeBlock lang={"json"}>{`{
    "ok": true,
    "taskId": "358877ad-7ad5-431f-bd7b-05badd29c6aa",
    "status": "${displayDomain}/api/${workspace.id}/sources/tasks?taskId=358877ad-7ad5-431f-bd7b-05badd29c6aa&syncId=${syncId}",
    "logs": "${displayDomain}/api/${workspace.id}/sources/logs?taskId=358877ad-7ad5-431f-bd7b-05badd29c6aa&syncId=${syncId}"
}`}</CodeBlock>
          * You can use <b>status</b> and <b>logs</b> links to check sync status and logs.
          <br />
          <br /> Error response:
          <CodeBlock lang={"json"}>{`{
    "ok": false,
    "error": "Sync is already running",
    "runningTask": {
        "taskId":"452110c3-26fc-43f0-b079-406af0c90047",
        "status":"${displayDomain}/api/${workspace.id}/sources/tasks?taskId=452110c3-26fc-43f0-b079-406af0c90047&syncId=${syncId}",
        "logs":"${displayDomain}/api/${workspace.id}/sources/logs?taskId=452110c3-26fc-43f0-b079-406af0c90047&syncId=${syncId}"
    }
}`}</CodeBlock>
          <h2 id={"status"}>Sync Status</h2>
          <h3>Endpoint</h3>
          <CodeBlock>{`${displayDomain}/api/${workspace.id}/sources/tasks?taskId={task id}&syncId=${syncId}`}</CodeBlock>
          <ul>
            <li>
              <b>syncId</b> - id of Sync object
            </li>
            <li>
              <b>taskId</b> - id of task returned in response of <b>Trigger sync</b> endpoint
            </li>
          </ul>
          <h3>Authorization</h3>
          Use <b>Authorization</b> header with <b>Bearer</b> token. You can obtain token in{" "}
          <Link href={"/user"}>Settings</Link> page.
          <h3>Example</h3>
          <CodeBlock lang={"bash"}>
            {`curl -H "Authorization: bearer abc:123" \\
"${displayDomain}/api/${workspace.id}/sources/tasks?taskId=452110c3-26fc-43f0-b079-406af0c90047&syncId=${syncId}"`}
          </CodeBlock>
          <h3>Response</h3>
          Successful response:
          <CodeBlock lang={"json"}>{`{
    "ok": true,
    "task": {
        "sync_id":"${syncId}",
        "task_id":"452110c3-26fc-43f0-b079-406af0c90047",
        "package":"${service.package}",
        "version":"${service.version}",
        "started_at":"2023-07-07T08:20:59.000Z",
        "updated_at":"2023-07-07T08:21:07.706Z",
        "status":"RUNNING",
        "description":"CREATED: "
    },
    "logs":"${displayDomain}/api/${workspace.id}/sources/logs?taskId=358877ad-7ad5-431f-bd7b-05badd29c6aa&syncId=${syncId}"
}`}</CodeBlock>
          * You can use <b>logs</b> link to check sync logs.
          <br />
          <br /> Error response:
          <CodeBlock lang={"json"}>{`{
    "ok":false,
    "error":"Task 452110c3-26fc-43f0-b079-406af0c90047 not found"
}`}</CodeBlock>
          <h2 id={"logs"}>Sync Logs</h2>
          <h3>Endpoint</h3>
          <CodeBlock>{`${displayDomain}/api/${workspace.id}/sources/logs?taskId={task id}&syncId=${syncId}`}</CodeBlock>
          <ul>
            <li>
              <b>syncId</b> - id of Sync object
            </li>
            <li>
              <b>taskId</b> - id of task returned in response of <b>Trigger sync</b> endpoint
            </li>
          </ul>
          <h3>Authorization</h3>
          Use <b>Authorization</b> header with <b>Bearer</b> token. You can obtain token in{" "}
          <Link href={"/user"}>Settings</Link> page.
          <h3>Example</h3>
          <CodeBlock lang={"bash"}>
            {`curl -H "Authorization: bearer abc:123" \\
"${displayDomain}/api/${workspace.id}/sources/logs?taskId=452110c3-26fc-43f0-b079-406af0c90047&syncId=${syncId}"`}
          </CodeBlock>
          <h3>Response</h3>
          Successful response:
          <CodeBlock
            lang={"plaintext"}
          >{`2023-07-07 08:21:05.737 INFO [jitsu] Sidecar. syncId: ${syncId}, taskId: 452110c3-26fc-43f0-b079-406af0c90047, package: ${service.package}:${service.version} startedAt: 2023-07-07T12:20:59+04:00
2023-07-07 08:21:05.832 INFO [jitsu] Catalog loaded. 36 streams selected
2023-07-07 08:21:05.833 INFO [jitsu] State loaded: {}
2023-07-07 08:21:06.573 INFO [${service.package}] Starting syncing...`}</CodeBlock>
          <br /> Error response:
          <CodeBlock
            lang={"plaintext"}
          >{`Error loading logs for task id 452110c3-26fc-43f0-b079-406af0c90047...`}</CodeBlock>
        </div>
        <div className={"ml-6 pt-2 px-6 hidden lg:block w-60 border-l flex-shrink-0"}>
          <div className="flex whitespace-nowrap fixed   flex-col space-y-3  ">
            <Link href="#trigger">Trigger Sync</Link>
            <Link href="#status">Sync Status</Link>
            <Link href="#logs">Sync Logs</Link>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

const SyncsPage = () => {
  const [refresh, setRefresh] = useState(new Date());
  return (
    <WorkspacePageLayout>
      <SyncsLoader
        key={refresh.toISOString()}
        reloadCallback={() => {
          setRefresh(new Date());
        }}
      />
    </WorkspacePageLayout>
  );
};

export default SyncsPage;
