import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getSearchParamText, type SearchParamValue } from "@/features/admin/lib/list-filters";
import { AssistantWorkspace } from "@/features/assistant/components/assistant-workspace";
import {
  getAssistantWorkspaceState,
  searchAssistantKnowledge,
} from "@/features/assistant/lib/assistant-knowledge";
import { getModuleAccess } from "@/features/auth/lib/authorization";

type AdminAssistantPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminAssistantPage({
  searchParams,
}: AdminAssistantPageProps) {
  const access = await getModuleAccess("assistant");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="assistant" access={access} />;
  }

  const filters = await searchParams;
  const query = getSearchParamText(filters.q);
  const conversationId = getSearchParamText(filters.c);
  const response = await searchAssistantKnowledge({
    query,
    role: access.user.role,
    userId: access.user.id,
    conversationId,
  });
  const workspaceState = await getAssistantWorkspaceState(
    access.user.id,
    response?.conversationId ?? conversationId
  );

  return (
    <AdminPageShell
      eyebrow="Staff Assistant"
      title="Search cited DWDS workflow guidance inside the protected workspace."
      description="EH15 starts here with a role-aware internal assistant shell. This first slice retrieves from the memory-bank and curated module guidance, stays read-only, and points staff toward the correct module or next check."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/dashboard", label: "Operations dashboard" },
            { href: "/admin/follow-up", label: "Follow-up module" },
          ]}
          includeDashboardLink={false}
        />
      }
      stats={[
        {
          label: "Mode",
          value: "Read-only",
          detail: "The assistant can explain workflows but cannot post or mutate records.",
          accent: "teal",
        },
        {
          label: "Sources",
          value: workspaceState.knowledgeBase.latestRun
            ? workspaceState.knowledgeBase.latestRun.sourceCount.toString()
            : "0",
          detail: workspaceState.knowledgeBase.latestRun
            ? `${workspaceState.knowledgeBase.latestRun.chunkCount} stored chunks are available for retrieval.`
            : "Run the assistant once to persist the first documentation corpus.",
          accent: "sky",
        },
        {
          label: "History",
          value: workspaceState.conversationCount.toString(),
          detail:
            workspaceState.conversationCount > 0
              ? "Recent per-user assistant threads are now stored below."
              : "No saved assistant conversations exist for this account yet.",
          accent: "amber",
        },
        {
          label: "Role guard",
          value: access.user.role.replaceAll("_", " "),
          detail: "Answers should stay inside the signed-in staff role scope.",
          accent: "violet",
        },
      ]}
    >
      <AssistantWorkspace
        role={access.user.role}
        query={query}
        response={response}
        activeConversationId={response?.conversationId ?? conversationId}
        workspaceState={workspaceState}
      />
    </AdminPageShell>
  );
}
