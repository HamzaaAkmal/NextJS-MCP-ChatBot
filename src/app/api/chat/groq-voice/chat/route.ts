import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";
import { chatRepository } from "lib/db/repository";
import { generateUUID } from "lib/utils";
import type { GroqTool } from "../session/route";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Groq Voice Chat API: `),
});

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface GroqToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatRequest {
  messages: GroqMessage[];
  systemPrompt?: string;
  tools?: GroqTool[];
  threadId?: string;
  saveToHistory?: boolean;
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

    const { 
      messages, 
      systemPrompt, 
      tools, 
      threadId,
      saveToHistory = false 
    }: ChatRequest = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    logger.info(`Processing voice chat request with ${messages.length} messages`);

    // Build the request body
    const requestBody: Record<string, unknown> = {
      model: "moonshotai/kimi-k2-instruct-0905",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful voice assistant. Keep your responses concise and conversational, suitable for spoken dialogue. Avoid using markdown formatting, code blocks, or bullet points. Respond naturally as if having a conversation.",
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Groq Chat error: ${errorText}`);
      return NextResponse.json(
        { error: `Groq API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const choice = data.choices[0];
    const assistantMessage = choice?.message;

    // Check if there are tool calls
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      logger.info(`Tool calls requested: ${assistantMessage.tool_calls.map((tc: GroqToolCall) => tc.function.name).join(", ")}`);
      
      return NextResponse.json({
        type: "tool_calls",
        toolCalls: assistantMessage.tool_calls,
        content: assistantMessage.content || "",
      });
    }

    const assistantText = assistantMessage?.content || "";
    logger.info(`Response generated: "${assistantText.substring(0, 50)}..."`);

    // Save to history if requested and threadId is provided
    if (saveToHistory && threadId) {
      try {
        // Get the last user message
        const lastUserMessage = messages.filter(m => m.role === "user").pop();
        
        if (lastUserMessage) {
          // Save user message
          await chatRepository.upsertMessage({
            id: generateUUID(),
            threadId,
            role: "user",
            parts: [{ type: "text", text: lastUserMessage.content }],
          });
        }

        // Save assistant message
        await chatRepository.upsertMessage({
          id: generateUUID(),
          threadId,
          role: "assistant",
          parts: [{ type: "text", text: assistantText }],
          metadata: {
            chatModel: { provider: "groq", model: "llama-3.3-70b-versatile" },
          },
        });

        logger.info(`Messages saved to thread: ${threadId}`);
      } catch (saveError: any) {
        logger.error(`Failed to save messages: ${saveError.message}`);
        // Don't fail the request if saving fails
      }
    }

    return NextResponse.json({ 
      type: "text",
      text: assistantText 
    });
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
