import { Api, inferUrl, nextJsApiHandler, verifyAccess, verifyAccessWithRole } from "../../../../lib/api";
import { z } from "zod";
import { db } from "../../../../lib/server/db";
import { ApiError } from "../../../../lib/shared/errors";
import {
  DefaultUserNotificationsPreferences,
  getUserPreferenceService,
  PreferencesObj,
} from "../../../../lib/server/user-preferences";
import { getServerLog } from "../../../../lib/server/log";
import { SessionUser } from "../../../../lib/schema";
import { initTelemetry, withProductAnalytics } from "../../../../lib/server/telemetry";
import { isEqual } from "juava";
import { randomUUID } from "crypto";

const log = getServerLog();

async function savePreferences(user: SessionUser, workspace): Promise<void> {
  await Promise.all([
    ensureUserPreferences(user, workspace),
    db.prisma().workspaceUserProperties.upsert({
      where: {
        workspaceId_userId: { userId: user.internalId, workspaceId: workspace.id },
      },
      create: {
        userId: user.internalId,
        workspaceId: workspace.id,
        lastUsed: new Date(),
      },
      update: {
        lastUsed: new Date(),
      },
    }),
  ]);
}

async function ensureUserPreferences(user: SessionUser, workspace): Promise<void> {
  const [globalPreferences, workspacePreferences] = await Promise.all([
    getUserPreferenceService(db.prisma()).getPreferences({ userId: user.internalId }),
    getUserPreferenceService(db.prisma()).getPreferences({ userId: user.internalId, workspaceId: workspace.id }),
  ]);
  const newGlobalPreferences = {
    ...globalPreferences,
    lastUsedWorkspaceId: workspace.id,
  };
  if (!newGlobalPreferences.notifications) {
    newGlobalPreferences.notifications = {
      ...DefaultUserNotificationsPreferences,
      subscriptionCode: randomUUID(),
    };
  }
  const savePromises: Promise<PreferencesObj>[] = [];
  if (!isEqual(globalPreferences, newGlobalPreferences)) {
    savePromises.push(
      getUserPreferenceService(db.prisma()).savePreference({ userId: user.internalId }, newGlobalPreferences)
    );
  }
  if (!workspacePreferences.notifications) {
    const newWorkspacePreferences = {
      ...workspacePreferences,
      notifications: {
        // global notification preferences works as default values for fresh workspaces
        ...newGlobalPreferences.notifications,
        subscriptionCode: randomUUID(),
      },
    };
    savePromises.push(
      getUserPreferenceService(db.prisma()).savePreference(
        { userId: user.internalId, workspaceId: workspace.id },
        newWorkspacePreferences
      )
    );
  }
  if (savePromises.length > 0) {
    log.atInfo().log(`Saving user preferences for user ${user.internalId} and workspace ${workspace.id}`);
    await Promise.all(savePromises);
  }
}

export const api: Api = {
  url: inferUrl(__filename),
  GET: {
    description: "Get workspace",
    auth: true,
    types: { query: z.object({ workspaceIdOrSlug: z.string() }) },
    handle: async ({ req, query: { workspaceIdOrSlug }, user }) => {
      //we need to initialize telemetry to get deploymentId for old deployments. Not an optimal solution, because of additional query. But guarantees to work
      await initTelemetry();
      const workspace = await db.prisma().workspace.findFirst({
        where: { OR: [{ id: workspaceIdOrSlug }, { slug: workspaceIdOrSlug }] },
        include: {
          oidcLoginGroups: {
            where: {
              oidcProvider: {
                enabled: true,
              },
            },
            include: {
              oidcProvider: {
                select: {
                  id: true,
                  name: true,
                  enabled: true,
                },
              },
            },
          },
        },
      });
      if (!workspace) {
        throw new ApiError(`Workspace '${workspaceIdOrSlug}' not found`, { status: 404 });
      }
      try {
        await verifyAccess(user, workspace.id);
      } catch (e) {
        throw new ApiError(
          `Current user doesn't have an access to workspace`,
          {
            noAccessToWorkspace: true,
          },
          { status: 403 }
        );
      }
      //if slug is not set, means that workspace is not yet onboarded. We shouldn't track
      if (workspace.slug) {
        //send event asynchronously to prevent increased response time
        //theoretically, event can get lost, however this is not the type of event that
        //requires 100% reliability
        withProductAnalytics(
          callback =>
            callback.track("workspace_access", {
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              workspaceSlug: workspace.slug,
            }),
          { user, workspace, req }
        );
      }

      try {
        await savePreferences(user, workspace);
      } catch (e) {
        log
          .atWarn()
          .withCause(e)
          .log(`Failed to save workspace preferences (${workspace.id}). For user (${user.internalId})`);
      }

      return workspace;
    },
  },
  PUT: {
    auth: true,
    types: {
      body: z.object({ name: z.string(), slug: z.string() }),
      query: z.object({
        //true if the changed done during onboarding
        //also, we can't do boolean since there's a bug in how we parse zod
        onboarding: z.string().optional(),
        workspaceIdOrSlug: z.string(),
      }),
    },
    handle: async ({ req, query: { workspaceIdOrSlug, onboarding }, body, user }) => {
      await verifyAccessWithRole(user, workspaceIdOrSlug, "editEntities");
      const workspace = await db
        .prisma()
        .workspace.update({ where: { id: workspaceIdOrSlug }, data: { name: body.name, slug: body.slug } });
      if (onboarding === "true") {
        await withProductAnalytics(callback => callback.track("workspace_onboarded"), { user, workspace, req });
      }
      return workspace;
    },
  },
};

export default nextJsApiHandler(api);
