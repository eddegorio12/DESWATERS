import { NextResponse } from "next/server";

import {
  getAssistantWorkspaceState,
  searchAssistantKnowledge,
} from "@/features/assistant/lib/assistant-knowledge";
import { getModuleAccess } from "@/features/auth/lib/authorization";

function serializeWorkspaceState(
  state: Awaited<ReturnType<typeof getAssistantWorkspaceState>>
) {
  return {
    recentConversations: state.recentConversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      lastAskedAt: conversation.lastAskedAt.toISOString(),
      messageCount: conversation._count.messages,
    })),
    selectedConversation: state.selectedConversation
      ? {
          id: state.selectedConversation.id,
          title: state.selectedConversation.title,
          lastAskedAt: state.selectedConversation.lastAskedAt.toISOString(),
          messages: state.selectedConversation.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            citations: message.citations,
            createdAt: message.createdAt.toISOString(),
          })),
        }
      : null,
    conversationCount: state.conversationCount,
    knowledgeBase: {
      latestRun: state.knowledgeBase.latestRun
        ? {
            startedAt: state.knowledgeBase.latestRun.startedAt.toISOString(),
            completedAt: state.knowledgeBase.latestRun.completedAt?.toISOString() ?? null,
            sourceCount: state.knowledgeBase.latestRun.sourceCount,
            chunkCount: state.knowledgeBase.latestRun.chunkCount,
          }
        : null,
      chunkCount: state.knowledgeBase.chunkCount,
    },
  };
}

async function getAuthorizedAssistantAccess() {
  const access = await getModuleAccess("assistant");

  if (access.status !== "authorized") {
    return null;
  }

  return access.user;
}

export async function GET(request: Request) {
  const user = await getAuthorizedAssistantAccess();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const workspaceState = await getAssistantWorkspaceState(user.id, conversationId);

  return NextResponse.json({
    workspaceState: serializeWorkspaceState(workspaceState),
  });
}

export async function POST(request: Request) {
  const user = await getAuthorizedAssistantAccess();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { query?: string; conversationId?: string | null }
    | null;
  const query = body?.query?.trim() ?? "";
  const conversationId = body?.conversationId ?? null;

  if (!query) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const response = await searchAssistantKnowledge({
    query,
    role: user.role,
    userId: user.id,
    conversationId,
  });
  const workspaceState = await getAssistantWorkspaceState(user.id, response?.conversationId ?? null);

  return NextResponse.json({
    response,
    workspaceState: serializeWorkspaceState(workspaceState),
  });
}
