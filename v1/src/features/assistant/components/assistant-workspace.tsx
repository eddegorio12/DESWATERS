import Link from "next/link";

import type { AssistantConversationMessageRole, Prisma, Role } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import {
  getAssistantKnowledgeScope,
  getAssistantStarterPrompts,
  type AssistantSearchResponse,
} from "@/features/assistant/lib/assistant-knowledge";
import { cn } from "@/lib/utils";

type WorkspaceState = {
  recentConversations: Array<{
    id: string;
    title: string;
    lastAskedAt: Date;
    _count: {
      messages: number;
    };
  }>;
  selectedConversation: {
    id: string;
    title: string;
    lastAskedAt: Date;
    messages: Array<{
      id: string;
      role: AssistantConversationMessageRole;
      content: string;
      citations: Prisma.JsonValue;
      createdAt: Date;
    }>;
  } | null;
  conversationCount: number;
  knowledgeBase: {
    latestRun: {
      startedAt: Date;
      completedAt: Date | null;
      sourceCount: number;
      chunkCount: number;
    } | null;
    chunkCount: number;
  };
};

function formatActivityDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function isCitationList(value: Prisma.JsonValue): value is Array<{
  title?: string;
  sourcePath?: string;
}> {
  return Array.isArray(value);
}

export function AssistantWorkspace({
  role,
  query,
  response,
  activeConversationId,
  workspaceState,
}: {
  role: Role;
  query: string;
  response: AssistantSearchResponse | null;
  activeConversationId: string | null;
  workspaceState: WorkspaceState;
}) {
  const scope = getAssistantKnowledgeScope(role);
  const starterPrompts = getAssistantStarterPrompts(role);
  const hasConversation = Boolean(workspaceState.selectedConversation);

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-6">
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="DWDS Assistant"
            title="Saved chats"
            description="Chat history is scoped to the signed-in user only."
            aside={
              <Link
                href="/admin/assistant"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className: "h-10 rounded-full px-4",
                  })
                )}
              >
                New chat
              </Link>
            }
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <article className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                Role
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {scope.roleLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Read-only answers stay inside your module scope.
              </p>
            </article>

            <article className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                Stored docs
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {workspaceState.knowledgeBase.chunkCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Persisted chunks from the memory-bank and workflow guides.
              </p>
            </article>

            <article className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                Last sync
              </p>
              <p className="mt-3 text-base font-semibold tracking-tight text-foreground">
                {workspaceState.knowledgeBase.latestRun
                  ? formatActivityDate(workspaceState.knowledgeBase.latestRun.startedAt)
                  : "Not run yet"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {workspaceState.knowledgeBase.latestRun
                  ? `${workspaceState.knowledgeBase.latestRun.sourceCount} sources`
                  : "The first question creates the persisted retrieval baseline."}
              </p>
            </article>
          </div>

          <div className="mt-6 space-y-3">
            {workspaceState.recentConversations.length ? (
              workspaceState.recentConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;

                return (
                  <Link
                    key={conversation.id}
                    href={`/admin/assistant?c=${encodeURIComponent(conversation.id)}`}
                    className={cn(
                      "block rounded-[1.2rem] border p-4 transition",
                      isActive
                        ? "border-primary/35 bg-primary/5"
                        : "border-border/70 bg-white hover:border-primary/25 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conversation.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {conversation._count.messages} messages
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatActivityDate(conversation.lastAskedAt)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-border bg-muted/15 p-4 text-sm leading-7 text-muted-foreground">
                No saved chats yet. Ask one workflow question to create the first thread.
              </div>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Prompt Ideas"
            title="Try these starters"
            description="Use module names, statuses, and workflow terms for stronger retrieval."
          />

          <div className="mt-6 grid gap-3">
            {starterPrompts.map((prompt) => (
              <Link
                key={prompt}
                href={`/admin/assistant${activeConversationId ? `?c=${encodeURIComponent(activeConversationId)}&` : "?"}q=${encodeURIComponent(prompt)}`}
                className="rounded-[1.2rem] border border-border/70 bg-white p-4 text-sm leading-6 text-foreground transition hover:border-primary/30 hover:bg-primary/5"
              >
                {prompt}
              </Link>
            ))}
          </div>
        </AdminSurfacePanel>
      </div>

      <AdminSurfacePanel className="flex min-h-[820px] flex-col">
        <AdminSurfaceHeader
          eyebrow="Chat"
          title={
            workspaceState.selectedConversation
              ? workspaceState.selectedConversation.title
              : "Start a new DWDS assistant chat"
          }
          description={
            hasConversation
              ? "The assistant keeps this thread citation-led, read-only, and inside your current role scope."
              : "Ask a workflow or policy question. The assistant will save the thread and cite the DWDS material it used."
          }
          aside={
            <div className="text-right">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                Module reach
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {scope.accessibleModules.length} modules
              </p>
            </div>
          }
        />

        <div className="flex-1 space-y-6 py-6">
          {hasConversation ? (
            <div className="space-y-4">
              {workspaceState.selectedConversation?.messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "USER" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-[1.35rem] border px-5 py-4 sm:max-w-[82%]",
                      message.role === "USER"
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-[#dbe9e5] bg-[#f7fbfa]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={cn(
                          "text-[0.72rem] font-semibold uppercase tracking-[0.2em]",
                          message.role === "USER"
                            ? "text-primary-foreground/72"
                            : "text-primary/72"
                        )}
                      >
                        {message.role === "USER" ? "You" : "DWDS Assistant"}
                      </p>
                      <span
                        className={cn(
                          "text-xs",
                          message.role === "USER"
                            ? "text-primary-foreground/72"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatActivityDate(message.createdAt)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-3 text-sm leading-7",
                        message.role === "USER" ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {message.content}
                    </p>

                    {message.role === "ASSISTANT" &&
                    isCitationList(message.citations) &&
                    message.citations.length ? (
                      <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Citations
                        </p>
                        {message.citations.map((citation, index) => (
                          <div
                            key={`${message.id}-${index}`}
                            className="rounded-[1rem] border border-border/60 bg-white/80 px-3 py-2 text-xs text-muted-foreground"
                          >
                            {citation.title ?? "Source"}
                            {citation.sourcePath ? ` - ${citation.sourcePath}` : ""}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/15 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/72">
                Ready to chat
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                Ask the assistant like an internal chatbot
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Good prompts mention the DWDS module, status, or workflow you are dealing with.
                The assistant will answer from stored guidance, cite its sources, and save the
                thread for your account.
              </p>
            </div>
          )}

          {response ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-[1.2rem] border border-border/70 bg-white p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                  Current answer basis
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{response.basis}</p>
                {response.uncertainty ? (
                  <p className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    {response.uncertainty}
                  </p>
                ) : null}
              </article>

              <article className="rounded-[1.2rem] border border-border/70 bg-white p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72">
                  Related modules
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {response.relatedModules.length ? (
                    response.relatedModules.map((module) => (
                      <Link
                        key={module.href}
                        href={module.href}
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            className: "h-10 rounded-full px-4",
                          })
                        )}
                      >
                        {module.label}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      No direct module link was inferred from the retrieved sources.
                    </p>
                  )}
                </div>
              </article>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/70 pt-6">
          <form action="/admin/assistant" method="get" className="space-y-4">
            {activeConversationId ? <input type="hidden" name="c" value={activeConversationId} /> : null}

            <div className="rounded-[1.5rem] border border-border/70 bg-white p-4 shadow-sm">
              <label
                htmlFor="assistant-query"
                className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary/72"
              >
                Message DWDS Assistant
              </label>
              <textarea
                id="assistant-query"
                name="q"
                defaultValue={query}
                placeholder="Ask about a DWDS workflow, policy, or status. Example: Which module should I use to review overdue accounts?"
                rows={4}
                className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/80"
              />

              <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Read-only, role-aware, and citation-led. No records are mutated through chat.
                </p>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({
                      className: "h-11 rounded-full px-5",
                    })
                  )}
                >
                  Send message
                </button>
              </div>
            </div>
          </form>
        </div>
      </AdminSurfacePanel>
    </div>
  );
}
