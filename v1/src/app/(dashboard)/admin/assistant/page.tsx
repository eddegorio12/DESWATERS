import { redirect } from "next/navigation";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getSearchParamText, type SearchParamValue } from "@/features/admin/lib/list-filters";
import { AssistantWorkspace } from "@/features/assistant/components/assistant-workspace";
import { runAssistantEvaluationSuite } from "@/features/assistant/lib/assistant-evaluation";
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
  const runEvaluation = getSearchParamText(filters.runEval) === "1";

  if (
    runEvaluation &&
    (access.user.role === "SUPER_ADMIN" || access.user.role === "ADMIN")
  ) {
    await runAssistantEvaluationSuite(access.user.id);
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (conversationId) {
      params.set("c", conversationId);
    }

    redirect(params.size ? `/admin/assistant?${params.toString()}` : "/admin/assistant");
  }

  const response = await searchAssistantKnowledge({
    query,
    role: access.user.role,
    userId: access.user.id,
    conversationId,
  });
  const workspaceState = await getAssistantWorkspaceState(
    access.user.id,
    access.user.role,
    response?.conversationId ?? conversationId
  );

  return (
    <AdminPageShell
      eyebrow="Staff Assistant"
      title="Search cited DWDS workflow guidance inside the protected workspace."
      description="EH15 now includes citation-led assistant telemetry, fixed evaluation runs, and an admin-visible quality view on top of the protected read-only guidance workflow."
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
          label: "Evaluation",
          value: workspaceState.qualityOverview?.latestEvaluationRun
            ? `${workspaceState.qualityOverview.latestEvaluationRun.passedCount}/${workspaceState.qualityOverview.latestEvaluationRun.caseCount}`
            : "Not run",
          detail: workspaceState.qualityOverview?.latestEvaluationRun
            ? "Latest regression suite result on the protected assistant baseline."
            : "Run the fixed evaluation suite after assistant changes to compare quality.",
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
