import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { VercelAIMcpTool } from "app-types/mcp";
import {
  filterMcpServerCustomizations,
  loadMcpTools,
  mergeSystemPrompt,
} from "../../shared.chat";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildSpeechSystemPrompt,
} from "lib/ai/prompts";
import { safe } from "ts-safe";
import { DEFAULT_VOICE_TOOLS } from "lib/ai/speech";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "../../actions";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";
import { getUserPreferences } from "lib/user/server";
import { ChatMention } from "app-types/chat";
import { chatRepository } from "lib/db/repository";
import { generateUUID } from "lib/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Groq Voice Session API: `),
});

export interface GroqVoiceSessionResponse {
  systemPrompt: string;
  tools: GroqTool[];
  userId: string;
  threadId: string;
}

export interface GroqTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

function vercelAIToolToGroqTool(tool: VercelAIMcpTool, name: string): GroqTool {
  return {
    type: "function",
    function: {
      name,
      description: tool.description || "",
      parameters: (tool.inputSchema as any)?.jsonSchema ?? {
        type: "object",
        properties: {},
        required: [],
      },
    },
  };
}

function defaultVoiceToolToGroqTool(tool: (typeof DEFAULT_VOICE_TOOLS)[0]): GroqTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set" },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mentions, agentId } = (await request.json()) as {
      agentId?: string;
      mentions: ChatMention[];
    };

    const agent = await rememberAgentAction(agentId, session.user.id);

    if (agentId) {
      logger.info(`[${agentId}] Agent: ${agent?.name}`);
    }

    const enabledMentions = agent ? agent.instructions.mentions : mentions;

    const allowedMcpTools = await loadMcpTools({ mentions: enabledMentions });

    const toolNames = Object.keys(allowedMcpTools ?? {});

    if (toolNames.length > 0) {
      logger.info(`${toolNames.length} MCP tools found`);
    } else {
      logger.info(`No MCP tools found`);
    }

    const userPreferences = await getUserPreferences(session.user.id);

    const mcpServerCustomizations = await safe()
      .map(() => {
        if (Object.keys(allowedMcpTools ?? {}).length === 0)
          throw new Error("No tools found");
        return rememberMcpServerCustomizationsAction(session.user.id);
      })
      .map((v) => filterMcpServerCustomizations(allowedMcpTools!, v))
      .orElse({});

    // Convert MCP tools to Groq format
    const groqMcpTools = Object.entries(allowedMcpTools ?? {}).map(
      ([name, tool]) => vercelAIToolToGroqTool(tool, name)
    );

    // Convert default voice tools to Groq format
    const groqDefaultTools = DEFAULT_VOICE_TOOLS.map(defaultVoiceToolToGroqTool);

    const allTools = [...groqMcpTools, ...groqDefaultTools];

    const systemPrompt = mergeSystemPrompt(
      buildSpeechSystemPrompt(
        session.user,
        userPreferences ?? undefined,
        agent
      ),
      buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations)
    );

    logger.info(`Session created with ${allTools.length} tools`);

    // Create a new thread for this voice chat session
    const threadId = generateUUID();
    await chatRepository.insertThread({
      id: threadId,
      title: "Voice Chat Session",
      userId: session.user.id,
    });

    logger.info(`Created voice chat thread: ${threadId}`);

    const response: GroqVoiceSessionResponse = {
      systemPrompt,
      tools: allTools,
      userId: session.user.id,
      threadId,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
