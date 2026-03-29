"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BotMessageSquare, LoaderCircle, MessageSquareText, Sparkles, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PopupMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Array<{ title?: string; sourcePath?: string }> | null;
  createdAt: string;
};

type PopupConversation = {
  id: string;
  title: string;
  lastAskedAt: string;
  messageCount: number;
};

type PopupWorkspaceState = {
  recentConversations: PopupConversation[];
  selectedConversation: {
    id: string;
    title: string;
    lastAskedAt: string;
    messages: PopupMessage[];
  } | null;
  conversationCount: number;
  knowledgeBase: {
    latestRun: {
      startedAt: string;
      completedAt: string | null;
      sourceCount: number;
      chunkCount: number;
    } | null;
    chunkCount: number;
  };
};

type PopupResponse = {
  query: string;
  answer: string;
  basis: string;
  uncertainty: string | null;
  hits: Array<{
    id: string;
    title: string;
    summary: string;
    sectionTitle: string | null;
    sourcePath: string;
    sourceType: "memory-bank" | "workflow-guide";
    href: string | null;
    matchingTerms: string[];
    score: number;
  }>;
  relatedModules: { href: string; label: string }[];
  conversationId: string | null;
};

const starterPrompts = [
  "How do I check overdue accounts?",
  "Where do I record a payment?",
  "Which page should I use for meter readings?",
  "Where can I see route complaints?",
];

export function AssistantPopup({
  roleLabel,
}: {
  roleLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceState, setWorkspaceState] = useState<PopupWorkspaceState | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [latestResponse, setLatestResponse] = useState<PopupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = workspaceState?.selectedConversation ?? null;

  async function loadWorkspace(conversationId?: string | null) {
    setIsLoadingState(true);
    setError(null);

    try {
      const search = conversationId
        ? `?conversationId=${encodeURIComponent(conversationId)}`
        : "";
      const response = await fetch(`/api/assistant/chat${search}`, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("The assistant could not load right now.");
      }

      const payload = (await response.json()) as { workspaceState: PopupWorkspaceState };
      setWorkspaceState(payload.workspaceState);
      setActiveConversationId(payload.workspaceState.selectedConversation?.id ?? conversationId ?? null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The assistant could not load.");
    } finally {
      setIsLoadingState(false);
    }
  }

  useEffect(() => {
    if (isOpen && !workspaceState && !isLoadingState) {
      void loadWorkspace(activeConversationId);
    }
  }, [activeConversationId, isLoadingState, isOpen, workspaceState]);

  async function sendQuestion(query: string) {
    const normalized = query.trim();

    if (!normalized) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          query: normalized,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("The assistant could not answer that yet.");
      }

      const payload = (await response.json()) as {
        response: PopupResponse | null;
        workspaceState: PopupWorkspaceState;
      };

      setLatestResponse(payload.response);
      setWorkspaceState(payload.workspaceState);
      setActiveConversationId(payload.response?.conversationId ?? payload.workspaceState.selectedConversation?.id ?? null);
      setDraft("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The assistant could not answer that yet.");
    } finally {
      setIsSending(false);
    }
  }

  const transcriptMessages = useMemo(
    () => selectedConversation?.messages ?? [],
    [selectedConversation]
  );

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full border border-primary/20 bg-primary px-4 py-3 text-left text-primary-foreground shadow-[0_18px_45px_rgba(16,84,109,0.32)] transition hover:bg-primary/92 sm:right-6 sm:bottom-6"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-white/14">
            <BotMessageSquare className="size-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-xs text-primary-foreground/78">Ask DWDS assistant</p>
          </div>
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed right-4 bottom-4 z-50 w-[min(100vw-2rem,25rem)] overflow-hidden rounded-[1.75rem] border border-border/80 bg-[#fbfdfe] shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:right-6 sm:bottom-6">
          <div className="border-b border-border/70 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">DWDS assistant</p>
                    <p className="text-xs text-muted-foreground">
                      Simple help for {roleLabel}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid max-h-[72vh] min-h-[31rem] grid-rows-[auto_minmax(0,1fr)_auto]">
            <div className="border-b border-border/70 bg-white/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/72">
                    Recent help
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Pick a recent question or start fresh.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveConversationId(null);
                    setLatestResponse(null);
                    setDraft("");
                    setWorkspaceState((current) =>
                      current
                        ? {
                            ...current,
                            selectedConversation: null,
                          }
                        : current
                    );
                  }}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      className: "h-9 rounded-full px-3 text-xs",
                    })
                  )}
                >
                  New chat
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {workspaceState?.recentConversations.length ? (
                  workspaceState.recentConversations.slice(0, 5).map((conversation) => {
                    const isActive = conversation.id === activeConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setActiveConversationId(conversation.id);
                          void loadWorkspace(conversation.id);
                        }}
                        className={cn(
                          "min-w-0 max-w-full rounded-full border px-3 py-2 text-left text-xs transition",
                          isActive
                            ? "border-primary/30 bg-primary/8 text-foreground"
                            : "border-border/70 bg-white text-muted-foreground hover:border-primary/25 hover:text-foreground"
                        )}
                      >
                        <span className="block max-w-full truncate font-semibold sm:max-w-40">
                          {conversation.title}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Your first question will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,251,252,0.96))] px-4 py-4">
              {isLoadingState ? (
                <div className="flex h-full items-center justify-center">
                  <LoaderCircle className="size-5 animate-spin text-primary" />
                </div>
              ) : transcriptMessages.length ? (
                <div className="space-y-3">
                  {transcriptMessages.map((message) => (
                    <article
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "USER" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] min-w-0 overflow-hidden rounded-[1.35rem] border px-4 py-3",
                          message.role === "USER"
                            ? "border-primary/20 bg-primary text-primary-foreground"
                            : "border-border/70 bg-white"
                        )}
                      >
                        <p className="text-sm leading-7 break-words [overflow-wrap:anywhere]">
                          {message.content}
                        </p>

                        {message.role === "ASSISTANT" && message.citations?.length ? (
                          <div className="mt-3 border-t border-border/60 pt-3">
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Sources used
                            </p>
                            <div className="mt-2 space-y-2">
                              {message.citations.slice(0, 2).map((citation, index) => (
                                <div
                                  key={`${message.id}-${index}`}
                                  className="rounded-[0.95rem] border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"
                                >
                                  {citation.title ?? "DWDS source"}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-border bg-white/88 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquareText className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ask in simple words</p>
                      <p className="text-sm text-muted-foreground">
                        Example: Where do I check overdue accounts?
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendQuestion(prompt)}
                        className="rounded-[1rem] border border-border/70 bg-white px-3 py-3 text-left text-sm text-foreground transition hover:border-primary/25 hover:bg-primary/5 break-words [overflow-wrap:anywhere]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          <div className="border-t border-border/70 bg-white px-4 py-4">
              {error ? (
                <div className="mb-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {error}
                </div>
              ) : null}

              {latestResponse?.uncertainty ? (
                <div className="mb-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {latestResponse.uncertainty}
                </div>
              ) : null}

              {latestResponse?.relatedModules.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {latestResponse.relatedModules.slice(0, 2).map((module) => (
                    <Link
                      key={module.href}
                      href={module.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          className: "h-8 rounded-full px-3 text-xs",
                        })
                      )}
                    >
                      {module.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendQuestion(draft);
                }}
                className="space-y-3"
              >
                <label
                  htmlFor="assistant-popup-question"
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72"
                >
                  Ask for help
                </label>
                <textarea
                  id="assistant-popup-question"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type your question. Example: Where do I print a receipt?"
                  rows={2}
                  className="w-full resize-none rounded-[1.15rem] border border-border/70 bg-[#f8fbfc] px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/12 [overflow-wrap:anywhere]"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Read-only help with citations.
                  </p>
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className={cn(
                      buttonVariants({
                        className: "h-10 rounded-full px-4",
                      })
                    )}
                  >
                    {isSending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
