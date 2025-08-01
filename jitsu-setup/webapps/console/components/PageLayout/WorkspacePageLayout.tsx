import React, { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { branding } from "../../lib/branding";
import { HiSelector } from "react-icons/hi";
import { FaDocker, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { Button, Drawer, Dropdown, Menu, MenuProps } from "antd";
import MenuItem from "antd/lib/menu/MenuItem";
import { ButtonLabel } from "../ButtonLabel/ButtonLabel";
import styles from "./WorkspacePageLayout.module.css";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BellIcon,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  FilePlus,
  FolderKanban,
  Folders,
  FunctionSquare,
  Globe,
  Hammer,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Loader2,
  PackageOpen,
  PlugZap,
  ScrollText,
  SearchCode,
  Server,
  ServerCog,
  Settings,
  Share2,
  ShieldAlert,
  Terminal,
  User,
  UserRoundPen,
  X,
  Zap,
} from "lucide-react";

import { NextRouter, useRouter } from "next/router";
import Link from "next/link";
import { getDomains, useAppConfig, useUser, useUserSessionControls, useWorkspace } from "../../lib/context";
import { get, useApi } from "../../lib/useApi";

import { Overlay } from "../Overlay/Overlay";
import { WorkspaceNameAndSlugEditor } from "../WorkspaceNameAndSlugEditor/WorkspaceNameAndSlugEditor";
import { assertDefined, assertTrue, getLog } from "juava";
import classNames from "classnames";
import { BillingBlockingDialog } from "../Billing/BillingBlockingDialog";
import { feedbackError } from "../../lib/ui";
import { useJitsu } from "@jitsu/jitsu-react";
import { useSearchParams } from "next/navigation";
import omit from "lodash/omit";
import { useBilling, UseBillingResult } from "../Billing/BillingProvider";
import { useEventsUsage, UseUsageRes } from "../Billing/use-events-usage";
import { MenuItemType } from "antd/lib/menu/interface";
import { FaGear } from "react-icons/fa6";

export type PageLayoutProps = {
  fullscreen?: boolean;
  screen?: boolean;
  onClose?: () => void;
  contentClassName?: string;
  className?: string;
  doNotBlockIfUsageExceeded?: boolean;
};

export type WorkspaceSelectorProps = {
  currentTitle: ReactNode;
};

export const WorkspaceMenu: React.FC<{ closeMenu: () => void; classicProject?: string; classicToken?: string }> = ({
  classicToken,
}) => {
  const appConfig = useAppConfig();
  return (
    <div className="bg-backgroundLight rounded shadow">
      <div className="border-t border-textDisabled px-4 py-2 flex flex-col">
        {classicToken && (
          <Link
            key={"classic"}
            href={`${appConfig.jitsuClassicUrl}/?token=${classicToken}`}
            target={"_blank"}
            rel={"noopener noreferrer"}
            className="cursor-pointer"
          >
            <Button
              type={"dashed"}
              className={"w-full mt-1.5"}
              icon={<span className={"anticon w-4 h-4"}>{branding.classicLogo}</span>}
            >
              Switch to Jitsu Classic
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

function WorkspacesMenu(props: { jitsuClassicAvailable: boolean }) {
  const router = useRouter();
  const [classicLoading, setClassicLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const workspace = useWorkspace();
  const appConfig = useAppConfig();
  const { data, error } = useApi(`/api/user/properties`);
  let additionalMenuItems: MenuItemType[] = [];
  if (error) {
    log.atWarn().log("Failed to load user properties", error);
  } else if (data?.admin && appConfig.auth?.firebasePublic) {
    additionalMenuItems = [
      {
        key: "admin-users",

        label: (
          <Link href="/admin/users" className="flex items-center">
            <ButtonLabel iconSize="small" icon={<ShieldAlert className="h-full w-full" />}>
              Admin Users
            </ButtonLabel>
          </Link>
        ),
      },
      {
        label: (
          <Link href="/admin/workspaces" className="flex items-center">
            <ButtonLabel iconSize="small" icon={<FolderKanban className="h-full w-full" />}>
              Admin Workspaces
            </ButtonLabel>
          </Link>
        ),

        key: "admin-workspaces",
      },
    ];
    if (appConfig.ee.available) {
      additionalMenuItems.push({
        key: "billing-workspaces",
        label: (
          <Link href="/admin/overage-billing" className="flex items-center">
            <ButtonLabel iconSize="small" icon={<CircleDollarSign className="h-full w-full" />}>
              Billing Administration
            </ButtonLabel>
          </Link>
        ),
      });
    }
  }

  return (
    <Menu
      items={[
        {
          key: "all-workspaces",
          label: (
            <Link href="/workspaces" className="flex items-center">
              <ButtonLabel iconSize="small" icon={<Folders className="w-full h-full" />}>
                All Workspaces
              </ButtonLabel>
            </Link>
          ),
        },
        {
          key: "new-workspace",
          label: (
            <div className="flex items-center">
              <ButtonLabel
                iconSize="small"
                icon={
                  adding ? <Loader2 className="h-full w-full animate-spin" /> : <FilePlus className="h-full w-full" />
                }
              >
                Create new workspace
              </ButtonLabel>
            </div>
          ),
          onClick: async () => {
            setAdding(true);
            try {
              const { id } = await get("/api/workspace", { method: "POST", body: {} });
              await router.push(`/${id}`);
            } catch (e) {
              feedbackError(`Can't create new workspace`, { error: e });
            } finally {
              setAdding(false);
            }
          },
        },
        ...additionalMenuItems,
      ]}
    />
  );
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = props => {
  const [open, setOpen] = useState(false);
  //const classicProject = useClassicProject();

  return (
    <Dropdown
      dropdownRender={() => <WorkspacesMenu jitsuClassicAvailable={false} />}
      trigger={["click"]}
      open={open}
      onOpenChange={open => setOpen(open)}
    >
      <div className="flex items-center cursor-pointer hover:bg-backgroundDark px-2.5 py-1.5 rounded">
        <div>{props.currentTitle}</div>
        <HiSelector />
      </div>
    </Dropdown>
  );
};

type TabsMenuItem = {
  title: ReactNode;
  icon: ReactNode;
  path: string;
  globalPath?: boolean;
  aliases?: string[] | string;
  hidden?: boolean;
  items?: never;
};

type TabsMenuGroup = {
  title: ReactNode;
  icon: ReactNode;
  items: (TabsMenuItem | undefined)[];
};
export type TopTabsMenuProps = {
  items: (TabsMenuItem | TabsMenuGroup)[];
};

function isSelected(item: string, router: NextRouter) {
  let workspacePath = router.pathname.replace("/[workspaceId]", "");
  if (workspacePath === "") {
    workspacePath = "/";
  }

  return item === workspacePath;
}

function MenuLabel({ children, icon, hasSubMenu }: { children: ReactNode; icon?: ReactNode; hasSubMenu?: boolean }) {
  return (
    <div className={`flex items-center flex-nowrap group`}>
      {icon && <div className="h-4 w-4 mr-2">{icon}</div>}
      <div>{children}</div>
      {hasSubMenu && (
        <div>
          <ChevronDown className="w-3.5 h-3.5 mt-0.5 ml-1" />
        </div>
      )}
    </div>
  );
}

export const TopTabsMenu: React.FC<TopTabsMenuProps> = props => {
  const router = useRouter();
  const workspace = useWorkspace();

  const items: MenuProps["items"] = props.items.map(item => {
    if (item.items) {
      return {
        label: <MenuLabel hasSubMenu={true}>{item.title}</MenuLabel>,
        key:
          "[" +
          item.items
            .filter(Boolean)
            .map(subItem => subItem!.path)
            .join("-") +
          "]",
        selected: true,
        children: item.items.filter(Boolean).map(subItem => ({
          key: subItem!.path,
          label: (
            <MenuLabel icon={subItem!.icon}>
              <Link href={subItem!.globalPath ? subItem!.path : `/${workspace.slugOrId}${subItem!.path}`}>
                {subItem!.title}
              </Link>
            </MenuLabel>
          ),
          link: subItem!.path,
        })),
      };
    } else {
      return {
        label: (
          <MenuLabel>
            <Link href={item.globalPath ? item.path : `/${workspace.slugOrId}${item.path}`}>{item.title}</Link>
          </MenuLabel>
        ),
        key: item.path,
        link: item.path,
      };
    }
  });
  const allKeys = props.items.map(x => (x.items ? x.items.filter(Boolean).map(i => i!.path) : x.path)).flat();

  return (
    <Menu
      className={styles.topMenu}
      onClick={() => {}}
      selectedKeys={allKeys.filter(p => isSelected(p, router))}
      mode="horizontal"
      items={items}
    />
  );
};

function Breadcrumbs() {
  const workspace = useWorkspace();

  return (
    <div className="flex py-4 items-center">
      <div className="w-8 h-8">
        <Link href="/">{branding.logo}</Link>
      </div>
      <div className="pl-2 w-8 h-8 text-textLight">
        <svg fill="none" height="100%" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="100%">
          <path d="M16.88 3.549L7.12 20.451" />
        </svg>
      </div>
      <div>
        <WorkspaceSelector currentTitle={workspace.name} />
      </div>
    </div>
  );
}

function UserProfileMenu({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const { analytics } = useJitsu();
  const sessionControl = useUserSessionControls();
  return (
    <div>
      <Menu>
        <div className="px-8 py-2 text-center">
          <div className="font-bold whitespace-nowrap">{user.name}</div>
          <div>{user.email}</div>
        </div>
        <Menu.Divider />
        <MenuItem onClick={() => router.push("/user")}>
          <ButtonLabel icon={<FiSettings />}>Settings</ButtonLabel>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            await sessionControl.logout();
            analytics.reset();
          }}
        >
          <ButtonLabel icon={<FaSignOutAlt />}>Logout</ButtonLabel>
        </MenuItem>
      </Menu>
    </div>
  );
}

const UserProfileButton: React.FC<{}> = () => {
  const user = useUser();
  return (
    <Dropdown
      dropdownRender={() => (
        <UserProfileMenu
          user={{
            email: user.email,
            name: user.name,
          }}
        />
      )}
      placement="bottomLeft"
      arrow
      trigger={["click"]}
    >
      <div className="h-8 w-8 cursor-pointer">
        {user.image && user.image.indexOf("googleusercontent.com/") < 0 ? (
          <img className="rounded-full w-8 h-8" src={user.image} about="userpic" alt="" width="100" height="100" />
        ) : (
          <FaUserCircle className="text-primary w-full h-full" />
        )}
      </div>
    </Dropdown>
  );
};

const AlertView: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [show, setShow] = useState(false);
  const workspaceAlertHiddenAt = "workspaceAlertHiddenAt";
  useEffect(() => {
    const hiddenAt = localStorage.getItem(workspaceAlertHiddenAt);
    const hideAlertSeconds = 60 * 60; // 1 hour
    if (!hiddenAt || new Date().getTime() - new Date(hiddenAt).getTime() > 1000 * hideAlertSeconds) {
      setTimeout(() => setShow(true), 1); // show after 1ms to avoid SSR issues and enable animation
    }
  }, []);

  return (
    <div
      className="absolute top-0 z-40 rounded-b bg-white transition-all duration-500 ease-in-out"
      style={{ transform: `translateX(-50%) ` + (show ? "" : "translateY(-100%)"), left: "50%", maxWidth: "40vw" }}
    >
      <div
        className={`rounded-b border-warning border-l border-r border-b flex items-start space-x-4 py-2 px-4 text-xs bg-warning/5 `}
      >
        <AlertCircle className="text-warning" />
        <div>{children}</div>
        <div>
          <button
            onClick={() => {
              setShow(false);
              localStorage.setItem(workspaceAlertHiddenAt, new Date().toISOString());
            }}
          >
            <X className="h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

function usageIsAboutToExceed(billing: UseBillingResult, usage: UseUsageRes) {
  return (
    billing.enabled &&
    billing.settings &&
    !usage.isLoading &&
    !usage.error &&
    usage.usage?.usagePercentage &&
    usage.usage?.usagePercentage < 1 &&
    billing.settings.planId === "free" &&
    usage.usage?.projectionByTheEndOfPeriod &&
    usage.usage?.projectionByTheEndOfPeriod > usage.usage.maxAllowedDestinatonEvents
  );
}

const FreePlanQuotaAlert: React.FC<{}> = () => {
  const workspace = useWorkspace();
  const usage = useEventsUsage({ skipSubscribed: true });
  const billing = useBilling();
  const router = useRouter();
  assertTrue(billing.enabled, "Billing should be enabled and loaded");
  assertDefined(billing.settings, "Billing settings should be loaded");

  if (router.pathname.endsWith("/settings/billing")) {
    //don't display second alert on billing page
    return <></>;
  }

  if (usage.throttle) {
    return (
      <AlertView>
        Your workspace is throttled due to exceeding the free plan quota at rate of <b>{usage.throttle}%</b>
        <Link
          className="group inline-flex items-center border-b border-neutral-600"
          href={`/${workspace.slugOrId}/settings/billing`}
        >
          Go to billing to see more details{" "}
          <ArrowRight className="h-4 group-hover:rotate-45 transition-all duration-500" />
        </Link>
      </AlertView>
    );
  } else if (usageIsAboutToExceed(billing, usage)) {
    return (
      <AlertView>
        You are projected to exceed your monthly events. Please upgrade your plan to avoid service disruption.{" "}
        <Link
          className="group inline-flex items-center border-b border-neutral-600"
          href={`/${workspace.slugOrId}/settings/billing`}
        >
          Go to billing <ArrowRight className="h-4 group-hover:rotate-45 transition-all duration-500" />
        </Link>
      </AlertView>
    );
  }

  return <></>;
};

const WorkspaceAlert: React.FC<{}> = () => {
  const billing = useBilling();
  if (billing.loading || !billing.enabled) {
    return <></>;
  }
  return <FreePlanQuotaAlert />;
};

function PageHeader() {
  const appConfig = useAppConfig();
  const workspace = useWorkspace();
  const billing = useBilling();
  const items: (TabsMenuItem | TabsMenuGroup | undefined | false)[] = [
    { title: "Overview", path: "/", aliases: "/overview", icon: <LayoutDashboard className="w-full h-full" /> },
    {
      title: "Event Streaming",
      icon: <Zap className="w-full h-full" />,
      items: [
        { title: "Sites", path: "/streams", icon: <Globe className="w-full h-full" /> },
        { title: "Connections", path: "/connections", icon: <Share2 className="w-full h-full" /> },
      ],
    },
    (appConfig.syncs.enabled || workspace.featuresEnabled?.includes("syncs")) && {
      title: "Connectors",
      icon: <PlugZap className="w-full h-full" />,
      items: [
        { title: "Service Connections", path: "/services", icon: <ServerCog className="w-full h-full" /> },
        { title: "Syncs", path: "/syncs", icon: <Share2 className="w-full h-full" /> },
        { title: "All Logs", path: "/syncs/tasks", icon: <ScrollText className="w-full h-full" /> },
        { title: "Custom Images", path: "/custom-images", icon: <FaDocker className="w-full h-full" /> },
      ],
    },
    appConfig.ee?.available && {
      title: "Customers",
      icon: <User className="w-full h-full" />,
      items: [{ title: "Profile Builder", path: "/profile-builder", icon: <UserRoundPen className="w-full h-full" /> }],
    },
    { title: "Functions", path: "/functions", icon: <FunctionSquare className="w-full h-full" /> },
    { title: "Destinations", path: "/destinations", icon: <Server className="w-full h-full" /> },
    {
      title: "Data",
      icon: <SearchCode className={"w-full h-full"} />,
      items: [
        { title: "Live Events", path: "/data", icon: <Activity className="w-full h-full" /> },
        { title: "Query Data", path: "/sql", icon: <Terminal className="w-full h-full" />, hidden: !appConfig?.ee },
        appConfig.ee?.available
          ? {
              title: "Event Statistics",
              path: "/event-stat",
              icon: <LineChart className="w-full h-full" />,
              hidden: !appConfig?.ee,
            }
          : undefined,
      ],
    },
    {
      title: "Settings",
      icon: <Settings className="w-full h-full" />,
      items: [
        { title: "Workspace Settings", path: "/settings", icon: <Hammer className="w-full h-full" /> },
        appConfig.customDomainsEnabled
          ? { title: "Domains", path: "/settings/domains", icon: <Globe className="w-full h-full" /> }
          : undefined,
        { title: "User Settings", path: "/user", icon: <User className="w-full h-full" />, globalPath: true },
        { title: "Billing Settings", path: "/settings/billing", icon: <CreditCard className="w-full h-full" /> },
        {
          title: "Notification Settings",
          path: "/settings/notifications",
          icon: <BellIcon className="w-full h-full" />,
        },
        billing.enabled && billing.settings?.dataRetentionEditorEnabled
          ? {
              title: "Data Retention",
              path: "/settings/data-retention",
              icon: <PackageOpen className="w-full h-full" />,
            }
          : undefined,
        workspace.featuresEnabled?.includes("misc")
          ? {
              title: "Miscellaneous Settings",
              path: "/miscs",
              icon: <FaGear className="w-full h-full" />,
            }
          : undefined,
      ],
    },
    appConfig.ee?.available && {
      title: "Support",
      path: "/support",
      icon: <HelpCircle className="w-full h-full" />,
    },
  ];
  return (
    <div>
      <div className="w-full relative">
        <WorkspaceAlert />
        <div className="flex justify-between items-center px-4">
          <Breadcrumbs />
          <UserProfileButton />
        </div>
        <TopTabsMenu items={items.filter(i => !!i) as (TabsMenuItem | TabsMenuGroup)[]} />
      </div>
    </div>
  );
}
//minimum with of the window
const minWidth = 1024;

/**
 * @param onboarding if the dialog is shown on onboarding page. For onboarding,
 * we should issue an event that onboarding is completed
 */
const WorkspaceSettingsModal: React.FC<{
  onSuccess: (newVals: { name: string; slug: string }) => void;
  onboarding: boolean;
}> = ({ onSuccess, onboarding }) => {
  const appConfig = useAppConfig();
  const domains = getDomains(appConfig);
  const { analytics } = useJitsu();
  const { push, query } = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");
  const sessionControl = useUserSessionControls();

  useEffect(() => {
    if (welcome) {
      analytics.track("sign_up");
      push({ query: { ...omit(query, "welcome") } });
    }
  }, [welcome, analytics, push, query]);

  const dataIngestion = (
    <>
      {appConfig.publicEndpoints.protocol}://<span className="text-textDark">yourslug</span>.
      {appConfig.publicEndpoints.dataHost}
      {appConfig.publicEndpoints.port ? `:${appConfig.publicEndpoints.port}` : ""}
    </>
  );
  return (
    <Overlay closable={false}>
      <div className="flex justify-center" style={{ minWidth: minWidth }}>
        <div className="px-6 py-8 max-w-6xl grow relative">
          <h1 className="text-4xl text-center">👋 Let's get started!</h1>
          <div className="text-xl text-textLight py-6">
            Pick a name a slug for your {branding.productName} workspace. Slug will be used in the URLs{" "}
            <code>
              {domains.appBase}/<span className="text-textDark">your-slug</span>
            </code>{" "}
          </div>
          <WorkspaceNameAndSlugEditor onSuccess={onSuccess} onboarding={onboarding} />
          <div className="text-center my-4">
            Got here by mistake?{" "}
            <a className="cursor-pointer text-primary underline" onClick={sessionControl.logout}>
              Sign out
            </a>{" "}
            or{" "}
            <Link className="cursor-pointer text-primary underline" href={`/workspaces`}>
              select other workspace
            </Link>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

const log = getLog("WorkspacePageLayout");

export const VerticalSection: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
    <div style={{ minWidth: minWidth }} className={classNames("w-full flex flex-col lg:items-center", className)}>
      {children}
    </div>
  );
};

export const WidthControl: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return <div className={classNames(className, "flex-grow overflow-auto", styles.widthControl)}>{children}</div>;
};

export const WorkspacePageLayout: React.FC<PropsWithChildren<PageLayoutProps>> = ({
  className,
  screen,
  fullscreen,
  contentClassName,
  onClose,
  children,
  doNotBlockIfUsageExceeded,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const workspace = useWorkspace();
  const router = useRouter();

  if (!router.query.workspaceId) {
    throw new Error(`${router.asPath} is not a workspace page`);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === "M") {
          const userConfirmed = window.confirm(
            `Do you really want to open a window with minimum width of ${minWidth}px?`
          );
          if (userConfirmed) {
            window.open(window.location.href, "_blank", `width=${minWidth},height=${window.innerHeight}`);
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [window]);

  useEffect(() => {
    setShowDrawer(false);
  }, [fullscreen]);

  if (workspace.deleted) {
    router.push("/workspaces");
    return <p>This workspace was deleted, redirecting...</p>;
  }

  const pHeader = (
    <VerticalSection className="header border-b border-neutral-300 bg-neutral-50 z-40" key="header">
      <WidthControl className={"px-4"}>
        <PageHeader />
      </WidthControl>
    </VerticalSection>
  );

  return (
    <div className={`flex flex-col ${screen ? "h-screen" : ""} ${className}`}>
      {!doNotBlockIfUsageExceeded && <BillingBlockingDialog />}
      <div className={`flex-auto ${fullscreen || screen ? "overflow-hidden" : ""} flex flex-col`}>
        {!workspace.slug && (
          <WorkspaceSettingsModal
            onboarding={true}
            onSuccess={({ slug }) => {
              if (slug) {
                router.push(`/${slug}`);
              } else {
                router.reload();
              }
            }}
          />
        )}
        {fullscreen ? (
          <>
            <div className="flex justify-center fixed w-screen z-50 pointer-events-none">
              <div className={"z-50 cursor-pointer pointer-events-auto px-2"}>
                <button
                  className="border-l border-b border-r rounded-b-md px-8 py-0 shadow"
                  onClick={() => setShowDrawer(!showDrawer)}
                >
                  <ChevronUp className={"w-6 h-6 block rotate-180"} />
                </button>
              </div>
            </div>
            <Drawer
              height={"auto"}
              bodyStyle={{ padding: 0, minWidth: 1024 }}
              open={showDrawer}
              placement={"top"}
              closable={false}
              onClose={() => setShowDrawer(false)}
            >
              {pHeader}
            </Drawer>
          </>
        ) : (
          pHeader
        )}
        <VerticalSection className={`flex-auto overflow-auto ${fullscreen ? "py-2" : "py-12"} ${contentClassName}`}>
          {fullscreen && (
            <button
              className="absolute right-0 top-0 mt-1 mr-2 hover:bg-neutral-100 p-1.5 rounded-lg flex justify-center items-center z-50"
              onClick={() => (onClose ? onClose() : router.back())}
            >
              <X className="w-8 h-8" />
            </button>
          )}
          <WidthControl className={"px-8"}>{children}</WidthControl>
        </VerticalSection>
      </div>
    </div>
  );
};
