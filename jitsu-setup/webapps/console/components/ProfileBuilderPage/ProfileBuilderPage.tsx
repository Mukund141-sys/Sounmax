import { WorkspacePageLayout } from "../PageLayout/WorkspacePageLayout";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import {
  Badge,
  Button,
  Descriptions,
  DescriptionsProps,
  Input,
  Popover,
  Splitter,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  Bug,
  Code2,
  OctagonAlert,
  Play,
  Save,
  Settings,
  Terminal,
  Lock,
  Hammer,
  ThumbsUp,
  LoaderCircle,
  Braces,
  RefreshCw,
  History,
  Parentheses,
  SearchCode,
  Rocket,
} from "lucide-react";
import { CodeEditor } from "../CodeEditor/CodeEditor";
import { ButtonLabel } from "../ButtonLabel/ButtonLabel";
import { copyTextToClipboard, feedbackError, feedbackSuccess, PropsWithChildrenClassname } from "../../lib/ui";
import classNames from "classnames";
import styles from "./ProfileBuilderPage.module.css";
import FieldListEditorLayout from "../FieldListEditorLayout/FieldListEditorLayout";
import Link from "next/link";
import { useBilling } from "../Billing/BillingProvider";
import { useWorkspace } from "../../lib/context";
import { ErrorCard } from "../GlobalError/GlobalError";
import type { PresetColorType, PresetStatusColorType } from "antd/es/_util/colors";
import { get, getConfigApi } from "../../lib/useApi";
import { useConfigObjectList, useStoreReload } from "../../lib/store";
import { DestinationSelector } from "../Selectors/DestinationSelector";
import { NumberEditor } from "../ConfigObjectEditor/Editors";
import { isEqual, rpc } from "juava";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import { JitsuButton } from "../JitsuButton/JitsuButton";
import { useAntdModal } from "../../lib/modal";
import { testDataExample } from "./example";
import { logType } from "@jitsu/core-functions";
import { FunctionLogs } from "../FunctionsDebugger/FunctionLogs";
import { FunctionResult } from "../FunctionsDebugger/FunctionResult";
import { FunctionVariables } from "../FunctionsDebugger/FunctionVariables";
import omit from "lodash/omit";
import { WLink } from "../Workspace/WLink";
import { getCoreDestinationTypeNonStrict } from "../../lib/schema/destinations";
import { FunctionsSelector } from "../FunctionsSelector/FunctionsSelector";
import { ButtonGroup, ButtonProps } from "../ButtonGroup/ButtonGroup";
import PriorityQueueBar from "../PriorityQueueBar/PriorityQueueBar";

dayjs.extend(utc);
dayjs.extend(relativeTime);

export const defaultProfileBuilderFunction = `export default async function(events, user, context) {
  context.log.info("Profile userId: " + user.id)
  const profile = {}
  profile.anonId = user.anonymousId
  return {
    traits: profile
  }
};`;

const statuses: Record<
  ProfileBuilderStatus | "loading" | "locked",
  {
    title: React.ReactNode;
    documentation: React.ReactNode;
    icon: React.ReactNode;
    color: PresetColorType | PresetStatusColorType;
  }
> = {
  incomplete: {
    color: "lime",
    title: "INCOMPLETE",
    documentation: <>Profile builder is not fully configured. Go to settings section to finish configuration</>,
    icon: <OctagonAlert className="full" />,
  },
  locked: {
    color: "blue",
    title: "LOCKED",
    documentation: (
      <>
        Profile builder is not enabled for your account. You still can define profiles with JavaScript function, and run
        test. To enable profile builder for your account please <WLink href={"/support"}>contact support</WLink>
      </>
    ),
    icon: <Lock className="full" />,
  },
  building: {
    color: "yellow",
    title: "BUILDING",
    documentation: (
      <>
        Profile builder is building initial profiles. In can happen after the first configuration, or after a change has
        been made in the code. You can monitor the progress in the progress section
      </>
    ),
    icon: <Hammer className="full" />,
  },
  ready: {
    color: "green",
    title: "READY",
    documentation: <>Profile builder is ready to use. You can query profiles, from a configured destination</>,
    icon: <ThumbsUp className="full" />,
  },
  loading: {
    color: "processing",
    title: "LOADING",
    documentation: <>Settings are being loaded, please wait</>,
    icon: <LoaderCircle className="full animate-spin" />,
  },
};

const Header: React.FC<{ status: ProfileBuilderStatus | "loading"; pbEnabled: boolean }> = ({ status, pbEnabled }) => {
  let statusDetails = statuses[status];
  if (status !== "loading" && !pbEnabled) {
    statusDetails = statuses["locked"];
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-3xl">Profile Builder</h3>
      <Tag className="h-6 text-2xl" color={"blue"} rootClassName="cursor-pointer">
        <Tooltip title={statusDetails.documentation}>
          <div className="flex justify-between gap-2 items-center">
            <div className="w-4 h-4">{statusDetails.icon}</div>
            <div className="text-lg">{statusDetails.title}</div>
          </div>
        </Tooltip>
      </Tag>
    </div>
  );
};

export function Dot() {
  return (
    <svg
      className={"w-1.5 h-1.5"}
      width={"100%"}
      height={"100%"}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill={"#5d70cc"} />
    </svg>
  );
}

const SettingsTab: React.FC<{ profileBuilder: ProfileBuilderData; dispatch: React.Dispatch<PBDataAction> }> = ({
  profileBuilder,
  dispatch,
}) => {
  const settings = profileBuilder.settings;

  const destinations = useConfigObjectList("destination").filter(d => {
    const dest = getCoreDestinationTypeNonStrict(d.destinationType);
    return dest?.usesBulker;
  });

  useEffect(() => {
    if (destinations.length && !settings.destinationId) {
      dispatch({ type: "settings", value: { ...settings, destinationId: destinations[0].id } });
    }
  }, [destinations, dispatch, settings]);

  return (
    <div className={styles.settingsTable}>
      <FieldListEditorLayout
        noBorder={true}
        items={[
          {
            key: "id",
            name: "Profile Builder Id",
            component: (
              <div
                onClick={() => {
                  copyTextToClipboard(profileBuilder.id);
                  feedbackSuccess("Profile Builder Id copied to clipboard");
                }}
                className={"w-80 border rounded-md py-1 px-2.5 cursor-pointer  text-textLight"}
              >
                {profileBuilder.id}
              </div>
            ),
          },
          {
            key: "storage",
            name: "Storage",
            documentation: (
              <>
                The host name of the profile storage. To make changes, please{" "}
                <WLink href={"/support"}>contact support</WLink>
              </>
            ),
            component: (
              <div className={"max-w-80"}>
                <Input disabled={true} />
              </div>
            ),
          },
          {
            key: "destination",
            name: "Default Destination",
            documentation: (
              <>
                Select the destination database where the profiles will be stored. Destination can be assigned in{" "}
                <b>Profile Function</b>:<br />
                <br />
                <div className={"whitespace-pre-wrap font-mono text-xs"}>
                  {`return {
  destinationId: "cm79123abc"
  traits: profile
}`}
                </div>
              </>
            ),
            component: (
              <DestinationSelector
                selected={settings.destinationId || destinations[0]?.id}
                items={destinations}
                enabled={true}
                onSelect={d => dispatch({ type: "settings", value: { ...settings, destinationId: d } })}
              />
            ),
          },
          {
            key: "table-name",
            name: "Default Table Name",
            documentation: (
              <>
                The name of the table where the profiles will be stored. Table Name can be assigned in{" "}
                <b>Profile Function</b>:<br />
                <br />
                <div className={"whitespace-pre-wrap font-mono text-xs"}>
                  {`return {
  tableName: "my_profiles"
  traits: profile
}`}
                </div>
              </>
            ),
            component: (
              <div className={"max-w-80"}>
                <Input
                  value={settings.tableName || "profiles"}
                  onChange={e => dispatch({ type: "settings", value: { ...settings, tableName: e.target.value } })}
                />
              </div>
            ),
          },
          {
            key: "window-days",
            name: "Profile Window",
            documentation: (
              <>The time window, in days, for querying user activity history during profile generation..</>
            ),
            component: (
              <div className={"max-w-80"}>
                <NumberEditor
                  max={365}
                  min={7}
                  value={settings.profileWindow || 365}
                  onChange={n => dispatch({ type: "settings", value: { ...settings, profileWindow: n } })}
                />
              </div>
            ),
          },
        ]}
      />
      {/*<div className="flex justify-end pr-2">*/}
      {/*  <Button*/}
      {/*    onClick={() => {*/}
      {/*      modal.confirm({*/}
      {/*        title: "Publish Profile Builder?",*/}
      {/*        content:*/}
      {/*          status === "incomplete" ? (*/}
      {/*            <>*/}
      {/*              Saving the settings will lead to publishing the first version of profile builder.*/}
      {/*              <br />*/}
      {/*              <br />*/}
      {/*              Are you sure you want to proceed?*/}
      {/*            </>*/}
      {/*          ) : (*/}
      {/*            <>*/}
      {/*              Saving the settings will lead to publishing the new version of profile builder and rebuilding all*/}
      {/*              customers profiles.*/}
      {/*              <br />*/}
      {/*              <br />*/}
      {/*              Are you sure you want to proceed?*/}
      {/*            </>*/}
      {/*          ),*/}
      {/*        okText: status === "incomplete" ? "Publish the first version" : "Publish",*/}
      {/*        okType: "primary",*/}
      {/*        cancelText: "Cancel",*/}
      {/*        onOk: () => {},*/}
      {/*      });*/}
      {/*    }}*/}
      {/*    type="primary"*/}
      {/*    className="mt-2"*/}
      {/*    size={"large"}*/}
      {/*  >*/}
      {/*    Save*/}
      {/*  </Button>*/}
      {/*</div>*/}
    </div>
  );
};

type ProfileBuilderState = {
  status: "ready" | "building" | "unknown" | "error";
  error?: string;
  updatedAt?: Date;
  fullRebuildInfo?: any;
  queuesInfo?: any;
  metrics?: any;
};

const BuildProgress: React.FC<{
  profileBuilder: ProfileBuilderData;
  state?: ProfileBuilderState;
  loading?: boolean;
  refreshTrigger: () => void;
}> = ({ profileBuilder, state, refreshTrigger, loading }) => {
  let status = state?.status;
  if (!status || status === "unknown") {
    status = "building";
  }
  let mappedStatus: PresetStatusColorType = "default";
  switch (status) {
    case "ready":
      mappedStatus = "success";
      break;
    case "building":
      mappedStatus = "processing";
      break;
    case "error":
      mappedStatus = "error";
  }
  const items: DescriptionsProps["items"] = [
    {
      key: "status",
      label: "Status",
      children: (
        <div>
          <Badge status={mappedStatus} text={status.toUpperCase()} />
          <JitsuButton
            size={"small"}
            onClick={refreshTrigger}
            type={"link"}
            icon={<RefreshCw className={`w-3 h-3${loading ? " animate-spin" : ""}`} />}
          />
        </div>
      ),
    },
  ];
  if (status === "error") {
    items.push({
      key: "error",
      label: "Error",
      children: <div>{state?.error}</div>,
    });
  }
  if (status === "building" || status === "ready") {
    items.push({
      key: "version",
      label: "Version",
      children: <div>{profileBuilder.version}</div>,
    });
    items.push({
      key: "published",
      label: "Published",
      children: <div>{new Date(profileBuilder.updatedAt!).toLocaleString()}</div>,
    });
    if (state?.fullRebuildInfo?.timestamp) {
      items.push({
        key: "rebuilt",
        label: "Full Rebuild - Date",
        children: <div>{new Date(state?.fullRebuildInfo?.timestamp!).toLocaleString()}</div>,
      });
      items.push({
        key: "rebuilt",
        label: "Full Rebuild - Version",
        children: <div>{state?.fullRebuildInfo?.version ?? "-"}</div>,
      });
      items.push({
        key: "total",
        label: "Full Rebuild - Total Users",
        children:
          typeof state?.fullRebuildInfo?.profilesCount !== "undefined" ? (
            <Statistic valueStyle={{ fontSize: "1em" }} value={state?.fullRebuildInfo?.profilesCount} />
          ) : (
            <div>Initiating...</div>
          ),
      });
    }
  }
  items.push({
    key: "queue",
    label: "Queue Size",
    children: (
      <PriorityQueueBar
        maxTotalSize={state?.fullRebuildInfo?.profilesCount}
        queueSizes={Object.values(state?.queuesInfo.queues)
          .sort((a: any, b: any) => a.priority - b.priority)
          .map((q: any) => q.size)}
      />
    ),
  });
  if (state?.queuesInfo.intervalSec) {
    items.push({
      key: "speed",
      label: "Processing Speed",
      children: (
        <div>
          {(
            (Object.values(state?.queuesInfo.queues)
              .map((q: any) => q.processed)
              .reduce((a: any, b: any) => a + b, 0) || 0) / state?.queuesInfo.intervalSec
          ).toLocaleString()}{" "}
          events/sec
        </div>
      ),
    });
  }

  return (
    <div className={styles.settingsTable}>
      <Descriptions size={"small"} bordered labelStyle={{ width: 300 }} column={1} items={items} />
    </div>
  );
};

const TabContent: React.FC<PropsWithChildrenClassname> = ({ children, className }) => {
  return (
    <div
      className={`h-full flex flex-col overflow-auto border-l border-r border-b px-2 py-4 ${className ?? ""}`}
      style={{ minHeight: "100%" }}
    >
      {children}
    </div>
  );
};

type ProfileBuilderStatus = "incomplete" | "building" | "ready";
type ProfileBuilderData = {
  status: ProfileBuilderStatus;
  id: string | undefined;
  name: string;
  functionId: string | undefined;
  draft: string | undefined;
  draftUpdatedAt: Date | undefined;
  code: string | undefined;
  cli: boolean | undefined;
  version: number | undefined;
  settings: {
    storage?: string;
    destinationId?: string;
    tableName?: string;
    profileWindow?: number;
    variables: any;
    functions?: { functionId: string; functionOptions?: any }[];
  };
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
};

const defaultProfileBuilderData: ProfileBuilderData = {
  id: undefined,
  version: 0,
  status: "incomplete",
  name: "Profile Builder",
  functionId: undefined,
  code: undefined,
  cli: undefined,
  draft: undefined,
  draftUpdatedAt: undefined,
  settings: {
    variables: {},
  },
  createdAt: undefined,
  updatedAt: undefined,
};

type PBDataAction =
  | {
      [K in keyof ProfileBuilderData]: {
        type: K;
        value: ProfileBuilderData[K];
      };
    }[keyof ProfileBuilderData]
  | { type: "replace"; value: ProfileBuilderData };

function pbDataReducer(state: ProfileBuilderData, action: PBDataAction) {
  if (action.type === "replace") {
    return action.value;
  }
  return {
    ...state,
    [action.type]: action?.value,
  };
}

function useProfileBuilderState(
  profileBuilder: ProfileBuilderData,
  pbEnabled: boolean,
  refreshDate: Date
): { isLoading: boolean; error?: Error; data?: ProfileBuilderState } {
  const workspace = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfileBuilderState | undefined>();

  useEffect(() => {
    if (pbEnabled) {
      setLoading(true);
      get(`/api/${workspace.id}/profile-builder/state?profileBuilderId=${profileBuilder.id}`)
        .then(res => {
          setData(res);
        })
        .catch(e => setData({ status: "error", error: e.message }))
        .finally(() => setLoading(false));
    }
  }, [profileBuilder, refreshDate, workspace.id, pbEnabled]);
  return { isLoading: loading, data } as any;
}

function useProfileBuilderData(
  refreshDate: Date
):
  | { isLoading: true; error?: never; data?: never; enabled: boolean }
  | { isLoading: false; error: Error; data?: never; enabled: boolean }
  | { isLoading: false; error?: never; data: ProfileBuilderData; enabled: boolean } {
  const workspace = useWorkspace();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [data, setData] = useState<ProfileBuilderData | undefined>();
  const billing = useBilling();
  useEffect(() => {
    if (billing.enabled && billing.loading) {
      setLoading(true);
      return;
    }
    (async () => {
      get(`/api/${workspace.id}/config/profile-builder?init=true`)
        .then(res => res.profileBuilders)
        .then(profileBuilders => {
          let status: ProfileBuilderStatus = "incomplete";
          if (billing.enabled) {
            if (billing.settings?.profileBuilderEnabled) {
              setEnabled(true);
            }
          }
          if (profileBuilders?.length) {
            const pb = profileBuilders[0];
            if (pb.version > 0 && pb.destinationId) {
              status = "ready";
            }
            setData({
              status: status,
              id: pb.id,
              name: pb.name,
              version: pb.version,
              functionId: pb.functions?.length ? pb.functions[0].functionId : undefined,
              draft: pb.functions?.length ? pb.functions[0].function.config.draft : defaultProfileBuilderFunction,
              draftUpdatedAt: pb.functions?.length ? pb.functions[0].function.updatedAt : undefined,
              code: pb.functions?.length ? pb.functions[0].function.config.code : defaultProfileBuilderFunction,
              cli: pb.functions?.length ? !!pb.functions[0].function.config.slug : undefined,
              settings: {
                storage: pb.intermediateStorageCredentials,
                destinationId: pb.destinationId,
                tableName: pb.connectionOptions?.tableName,
                variables: pb.connectionOptions?.variables,
                functions: pb.connectionOptions?.functions,
                profileWindow: pb.connectionOptions?.profileWindow,
              },
              createdAt: pb.createdAt,
              updatedAt: pb.updatedAt,
            });
            return;
          } else {
            setData({
              ...defaultProfileBuilderData,
              draft: defaultProfileBuilderFunction,
            });
          }
        })
        .catch(e => setError(e))
        .finally(() => setLoading(false));
    })();
  }, [billing.enabled, billing.loading, workspace, billing.settings, refreshDate]);
  return { isLoading: loading, error, data, enabled } as any;
}

const UserIdDialog: React.FC<{ profileBuilderId: string; setter: (v: string) => void; hideCallback: () => void }> = ({
  profileBuilderId,
  setter,
  hideCallback,
}) => {
  const workspace = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const load = useCallback(
    (userId: string) => {
      setLoading(true);
      get(`/api/${workspace.id}/profile-builder/events?profileBuilderId=${profileBuilderId}&userId=${userId}`)
        .then(res => {
          if (res.status === "ok") {
            setter(JSON.stringify(res.events, null, 2));
          } else {
            setter(res.error);
          }
        })
        .catch(e => setter(e.message))
        .finally(() => {
          setLoading(false);
          hideCallback();
        });
    },
    [setter, hideCallback, workspace.id, profileBuilderId]
  );

  return (
    <div className={"w-96"}>
      Please enter the <code>profileId</code> or <code>userId</code> of the user you want to test the profile builder
      for:
      <div className={"flex flex-row gap-2 mt-2"}>
        <Input onChange={e => setUserId(e.target.value)} />
        <Button loading={loading} type={"primary"} onClick={() => load(userId)}>
          Load
        </Button>
      </div>
    </div>
  );
};

const Overlay: React.FC<{ children?: React.ReactNode; visible: boolean; className?: string }> = ({
  children,
  visible,
  className,
}) => {
  if (!visible) {
    return <></>;
  }
  return <div className={classNames("absolute top-0 left- w-full h-full z-10", className)}>{children || ""}</div>;
};

export function ProfileBuilderPage() {
  const workspace = useWorkspace();
  const functions = useConfigObjectList("function").filter(f => f.kind !== "profile");
  const [pbRefreshDate, setPbRefreshDate] = useState(new Date());
  const [stateRefreshDate, setStateRefreshDate] = useState(new Date());
  const { data: initialData, error: globalError, isLoading, enabled } = useProfileBuilderData(pbRefreshDate);
  const { data: pbState, isLoading: stateLoading } = useProfileBuilderState(initialData!, enabled, stateRefreshDate);
  const [saving, setSaving] = useState(false);
  const [obj, dispatch] = useReducer(pbDataReducer, defaultProfileBuilderData);
  const [editorShown, setEditorShown] = useState(false);

  const [activePrimaryTab, setActivePrimaryTab] = useState("code");
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("test");
  const [testData, setTestData] = useState<string>(testDataExample);
  const [userIdDialogOpen, setUserIdDialogOpen] = useState(false);
  const modal = useAntdModal();
  const [result, setResult] = useState<any>({});
  const [resultType, setResultType] = useState<"ok" | "drop" | "error">("ok");
  const [logs, setLogs] = useState<logType[]>([]);
  const [unreadErrorLogs, setUnreadErrorLogs] = useState(0);
  const [unreadLogs, setUnreadLogs] = useState(0);
  const [running, setRunning] = useState(false);

  const codeChanged = obj.draft !== initialData?.draft;
  const hasUnpublishedDraft = obj.code !== obj.draft;
  const hasUnpublishedEnvs = !isEqual(obj.settings.variables ?? {}, initialData?.settings.variables ?? {});
  const hasUnpublishedFuncs = !isEqual(obj.settings.functions ?? {}, initialData?.settings.functions ?? {});
  const hasUnpublishedSettings = !isEqual(
    omit(obj.settings ?? {}, "variables", "functions"),
    omit(initialData?.settings ?? {}, "variables", "functions")
  );
  const hasUnpublishedChanges = hasUnpublishedDraft || !isEqual(obj, initialData);
  const reloadStore = useStoreReload();

  function handleTabChange(key: string) {
    setActiveSecondaryTab(key);
    if (key === "logs") {
      setUnreadLogs(0);
      setUnreadErrorLogs(0);
    }
  }

  useEffect(() => {
    if (initialData) {
      dispatch({ type: "replace", value: initialData });
      setEditorShown(!initialData.cli);
    }
  }, [initialData, isLoading]);

  const publish = useCallback(async () => {
    if (!obj.settings?.destinationId) {
      modal.confirm({
        title: "Destination not selected",
        content: (
          <>
            Please select a destination where the profiles will be stored.
            <br />
            You can do this in the Settings
          </>
        ),
        okText: "Go to Settings",
        okType: "primary",
        cancelText: "Cancel",
        onOk: () => {
          setActivePrimaryTab("settings");
        },
      });
    } else {
      setSaving(true);
      rpc(`/api/${workspace.id}/config/profile-builder`, {
        body: {
          profileBuilder: {
            id: obj.id,
            name: obj.name,
            workspaceId: workspace.id,
            version: enabled ? (obj.version ?? 0) + 1 : obj.version ?? 0,
            destinationId: obj.settings.destinationId,
            intermediateStorageCredentials: obj.settings.storage || {},
            connectionOptions: {
              tableName: obj.settings.tableName,
              profileWindow: obj.settings.profileWindow,
              variables: obj.settings.variables,
              functions: obj.settings.functions,
            },
            createdAt: obj.createdAt || new Date(),
            updatedAt: new Date(),
          },
          code: obj.draft,
        },
      })
        .then(() => {
          setPbRefreshDate(new Date());
        })
        .then(async () => reloadStore())
        .catch(e => {})
        .finally(() => setSaving(false));
    }
  }, [
    obj.settings.destinationId,
    obj.settings.storage,
    obj.settings.tableName,
    obj.settings.profileWindow,
    obj.settings.variables,
    obj.settings.functions,
    obj.id,
    obj.name,
    obj.version,
    obj.createdAt,
    obj.draft,
    modal,
    workspace.id,
    enabled,
    reloadStore,
  ]);
  const save = useCallback(async () => {
    setSaving(true);
    getConfigApi(workspace.id, "function")
      .update(obj.functionId!, {
        draft: obj.draft,
        type: "function",
      })
      .then(() => {
        setPbRefreshDate(new Date());
      })
      .catch(e => {})
      .finally(() => setSaving(false));
  }, [obj, workspace.id]);

  const rebuild = useCallback(async () => {
    get(`/api/${workspace.id}/profile-builder/state?profileBuilderId=${obj.id}`, {
      method: "POST",
    })
      .then(() => {
        feedbackSuccess("Full rebuild is triggered");
      })
      .catch(e => {
        feedbackError("Failed to trigger full rebuild of profile builder", { error: e });
      });
  }, [obj.id, workspace.id]);

  const rollback = useCallback(async () => {
    setSaving(true);
    getConfigApi(workspace.id, "function")
      .update(obj.functionId!, {
        draft: obj.code,
        type: "function",
      })
      .then(() => {
        setPbRefreshDate(new Date());
      })
      .catch(e => {})
      .finally(() => setSaving(false));
  }, [obj, workspace.id]);

  const runFunction = useCallback(async () => {
    setRunning(true);
    let body = {};
    try {
      body = {
        id: obj.id,
        name: obj.name,
        version: obj.version,
        settings: obj.settings,
        code: obj.draft,
        events: JSON.parse(testData),
        store: {},
        userAgent: navigator.userAgent,
      };
    } catch (e) {
      feedbackError("Invalid JSON", { error: e });
      setRunning(false);
      return;
    }
    try {
      const res = await rpc(`/api/${workspace.id}/profile-builder/run`, {
        method: "POST",
        body,
      });
      if (res.error) {
        setResult(res.error);
        setResultType("error");
        setLogs([
          ...res.logs,
          {
            level: "error",
            type: "log",
            message: `${res.error.name}: ${res.error.message}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setResult(res.result);
        setResultType(res.dropped ? "drop" : "ok");
        if (res.dropped) {
          setLogs([
            ...res.logs,
            {
              level: "info",
              type: "log",
              message: `Further processing will be SKIPPED. Function returned: ${JSON.stringify(res.result)}`,
              timestamp: new Date(),
            },
          ]);
        } else {
          setLogs(res.logs);
        }
      }

      if (activeSecondaryTab !== "logs") {
        setUnreadLogs(res.logs.length);
        setUnreadErrorLogs(res.logs.filter(l => l.level === "error").length);
      }
    } catch (e: any) {
      const errorText = "Error while calling Function API. Please contact support.";
      setLogs([
        {
          level: "error",
          type: "log",
          message: errorText,
          timestamp: new Date(),
        },
      ]);
      setResult({
        name: "Error",
        message: errorText,
      });
      if (activeSecondaryTab !== "logs") {
        setUnreadLogs(1);
        setUnreadErrorLogs(1);
      }
      setResultType("error");
    } finally {
      if (activeSecondaryTab !== "logs" && activeSecondaryTab !== "result") {
        setActiveSecondaryTab("result");
      }
      setRunning(false);
    }
  }, [obj.id, obj.name, obj.version, obj.settings, obj.draft, testData, workspace.id, activeSecondaryTab]);

  const items: ButtonProps[] = [];
  if (activePrimaryTab === "code") {
    items.push({
      icon: <History className="w-3.5 h-3.5" />,
      label: "Rollback Draft",
      requiredPermission: "editEntities",
      onClick: rollback,
      disabled: isLoading || !!globalError || !hasUnpublishedDraft,
      loading: isLoading,
      collapsed: true,
    });
  }
  if (obj?.version) {
    items.push({
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      label: "Full Rebuild",
      requiredPermission: "editEntities",
      onClick: rebuild,
      disabled: isLoading || !!globalError,
      loading: isLoading,
      collapsed: true,
    });
  }

  return (
    <WorkspacePageLayout screen={true} contentClassName={"!py-6"}>
      <div className="relative flex flex-col h-full">
        <Overlay
          visible={isLoading}
          className="bg-white bg-opacity-40 backdrop-blur-xs flex flex-col gap-4  items-center justify-center text-lg text-text"
        >
          <LoaderCircle className="animate-spin w-12 h-12" />
          <div className="text-center">Configuration loading, please wait...</div>
        </Overlay>
        <Overlay
          visible={!!globalError}
          className="bg-white pt-12 flex flex-col gap-4 items-center justify-start text-lg text-text"
        >
          <ErrorCard error={new Error(globalError?.message)} />
        </Overlay>
        <Header
          status={
            isLoading
              ? "loading"
              : pbState?.status === "building" || pbState?.status === "unknown"
              ? "building"
              : obj.status
          }
          pbEnabled={enabled}
        />
        <Splitter layout="vertical" className={`flex-auto flex-grow overflow-auto gap-1 ${styles.splitterFix}`}>
          <Splitter.Panel className={"flex flex-col"}>
            <Tabs
              className={classNames(styles.tabsHeightFix)}
              key={"code"}
              rootClassName={"flex-auto"}
              onChange={setActivePrimaryTab}
              tabBarExtraContent={
                <div className="flex items-center gap-2">
                  {enabled && activePrimaryTab === "code" && (
                    <>
                      <div className={"text-xs text-textLight"}>Draft saved: {dayjs(obj.draftUpdatedAt).fromNow()}</div>
                      <JitsuButton
                        requiredPermission={"editEntities"}
                        type="text"
                        onClick={save}
                        disabled={isLoading || !!globalError || !codeChanged}
                      >
                        <ButtonLabel
                          icon={
                            saving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          Save Draft
                        </ButtonLabel>
                      </JitsuButton>
                    </>
                  )}

                  <JitsuButton
                    requiredPermission={"editEntities"}
                    type="text"
                    onClick={publish}
                    disabled={isLoading || !!globalError || !hasUnpublishedChanges}
                  >
                    {enabled ? (
                      <ButtonLabel icon={<Rocket className="w-4 h-4" />}>Publish</ButtonLabel>
                    ) : (
                      <ButtonLabel icon={<Save className="w-4 h-4" />}>Save</ButtonLabel>
                    )}
                  </JitsuButton>
                  {enabled && (
                    <ButtonGroup items={items} dotsButtonProps={{ type: "text" }} dotsOrientation={"horizontal"} />
                  )}
                </div>
              }
              type={"card"}
              activeKey={activePrimaryTab}
              size={"small"}
              tabBarStyle={{ marginBottom: 0 }}
              items={[
                {
                  disabled: isLoading || !!globalError,
                  key: "code",
                  style: { height: "100%" },
                  label: (
                    <ButtonLabel icon={<Code2 className="w-3.5 h-3.5" />}>
                      <div className={"flex gap-2 items-center"}>
                        <span>Profile Function</span>
                        {enabled && hasUnpublishedDraft && <Dot />}
                        {!enabled && codeChanged && <Dot />}
                      </div>
                    </ButtonLabel>
                  ),
                  children: (
                    <TabContent>
                      {!isEqual(obj, defaultProfileBuilderData) &&
                        (!editorShown ? (
                          <div className="px-2">
                            <div className="mb-2">
                              The function is compiled and deployed with{" "}
                              <Link href="https://docs.jitsu.com/functions/sdk">
                                <code>jitsu-cli</code>
                              </Link>{" "}
                              it is recommended to use the CLI to edit the function code.
                              <br />
                              However, you can still run it with different events and see the results below.
                            </div>
                            <button className="text-primary" onClick={() => setEditorShown(true)}>
                              {"Enable code editor"}
                            </button>
                          </div>
                        ) : (
                          <CodeEditor
                            value={obj.draft || ""}
                            language={"javascript"}
                            onChange={c => dispatch({ type: "draft", value: c })}
                          />
                        ))}
                    </TabContent>
                  ),
                },
                {
                  disabled: isLoading || !!globalError,
                  style: { height: "100%" },
                  key: "transform",
                  label: (
                    <ButtonLabel icon={<Code2 className="w-3.5 h-3.5" />}>
                      <div className={"flex gap-2 items-center"}>
                        <span>Transformation</span>
                        {hasUnpublishedFuncs && <Dot />}
                      </div>{" "}
                    </ButtonLabel>
                  ),
                  children: (
                    <TabContent>
                      <div className={"px-4"}>
                        <FunctionsSelector
                          split={"vertical"}
                          functions={functions}
                          selectedFunctions={obj.settings?.functions}
                          onChange={enabledFunctions => {
                            const enabledF = enabledFunctions.map(f => ({ functionId: `udf.${f.id}` }));
                            dispatch({ type: "settings", value: { ...obj.settings, functions: enabledF } });
                          }}
                        />
                      </div>
                    </TabContent>
                  ),
                },
                {
                  disabled: isLoading || !!globalError,
                  key: "variables",
                  style: { height: "100%" },
                  label: (
                    <ButtonLabel icon={<Parentheses className="w-3.5 h-3.5" />}>
                      <div className={"flex gap-2 items-center"}>
                        <span>Environment Variables</span>
                        {hasUnpublishedEnvs && <Dot />}
                      </div>
                    </ButtonLabel>
                  ),
                  children: (
                    <TabContent>
                      <div style={{ minWidth: 500, maxWidth: "60%" }}>
                        <FunctionVariables
                          value={obj.settings?.variables ?? {}}
                          onChange={c => dispatch({ type: "settings", value: { ...obj.settings, variables: c } })}
                        />
                      </div>
                    </TabContent>
                  ),
                },
                {
                  disabled: isLoading || !!globalError,
                  style: { height: "100%" },
                  key: "settings",
                  label: (
                    <ButtonLabel icon={<Settings className="w-3.5 h-3.5" />}>
                      <div className={"flex gap-2 items-center"}>
                        <span>Settings</span>
                        {hasUnpublishedSettings && <Dot />}
                      </div>{" "}
                    </ButtonLabel>
                  ),
                  children: (
                    <TabContent>
                      <SettingsTab profileBuilder={obj} dispatch={dispatch} />
                    </TabContent>
                  ),
                },
                {
                  disabled: isLoading || !!globalError || !enabled || obj.status === "incomplete",
                  style: { height: "100%" },
                  key: "build",
                  label: <ButtonLabel icon={<Hammer className="w-3.5 h-3.5" />}>Build Progress</ButtonLabel>,
                  children: (
                    <TabContent>
                      <BuildProgress
                        profileBuilder={obj}
                        state={pbState}
                        loading={stateLoading}
                        refreshTrigger={() => setStateRefreshDate(new Date())}
                      />
                    </TabContent>
                  ),
                },
              ]}
            />
          </Splitter.Panel>
          <Splitter.Panel>
            <Tabs
              className={classNames(styles.tabsHeightFix)}
              onChange={handleTabChange}
              tabBarExtraContent={
                <div className="flex items-center gap-2">
                  <>
                    {obj.status !== "incomplete" && enabled && activeSecondaryTab === "test" && (
                      <Popover
                        content={
                          <UserIdDialog
                            profileBuilderId={obj.id!}
                            setter={setTestData}
                            hideCallback={() => {
                              setUserIdDialogOpen(false);
                            }}
                          />
                        }
                        title="Enter UserId"
                        open={userIdDialogOpen}
                        onOpenChange={(newOpen: boolean) => {
                          setUserIdDialogOpen(newOpen);
                        }}
                        trigger="click"
                      >
                        <Button type="text" disabled={isLoading || !!globalError}>
                          <ButtonLabel icon={<SearchCode className="w-4 h-4" />}>Load Test Data</ButtonLabel>
                        </Button>
                      </Popover>
                    )}
                    <Button onClick={runFunction} type="text" disabled={isLoading || !!globalError}>
                      <ButtonLabel
                        icon={
                          running ? (
                            <RefreshCw className={"w-3.5 h-3.5 animate-spin"} />
                          ) : (
                            <Play
                              className="w-3.5 h-3.5"
                              fill={isLoading || !!globalError ? "gray" : "green"}
                              stroke={isLoading || !!globalError ? "gray" : "green"}
                            />
                          )
                        }
                      >
                        Run
                      </ButtonLabel>
                    </Button>
                  </>
                </div>
              }
              type={"card"}
              defaultActiveKey="1"
              size={"small"}
              tabBarStyle={{ marginBottom: 0 }}
              activeKey={activeSecondaryTab}
              items={[
                {
                  style: { height: "100%" },
                  disabled: isLoading || !!globalError,
                  key: "test",
                  label: <ButtonLabel icon={<Bug className="w-3.5 h-3.5" />}>Test Data</ButtonLabel>,
                  children: (
                    <TabContent>
                      <CodeEditor
                        monacoOptions={{ folding: true, lineDecorationsWidth: 8 }}
                        foldLevel={3}
                        value={testData}
                        language="javascript"
                        onChange={setTestData}
                      />
                    </TabContent>
                  ),
                },
                {
                  style: { height: "100%" },
                  key: "result",
                  disabled: isLoading || !!globalError,
                  label: <ButtonLabel icon={<Braces className="w-3.5 h-3.5" />}>Last Run Result</ButtonLabel>,
                  children: (
                    <TabContent>
                      <FunctionResult resultType={resultType} result={result} />
                    </TabContent>
                  ),
                },
                {
                  style: { height: "100%" },
                  key: "logs",
                  disabled: isLoading || !!globalError,
                  label: (
                    <Badge
                      offset={[16, 0]}
                      count={unreadErrorLogs ? unreadErrorLogs : unreadLogs}
                      color={unreadErrorLogs ? "#ff0000" : "#4f46e5"}
                    >
                      <ButtonLabel icon={<Terminal className="w-3.5 h-3.5" />}>Logs</ButtonLabel>
                    </Badge>
                  ),
                  children: (
                    <TabContent className={"px-0"}>
                      <FunctionLogs logs={logs} className={"border-y"} showDate />
                    </TabContent>
                  ),
                },
              ]}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    </WorkspacePageLayout>
  );
}
