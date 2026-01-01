"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DEFAULT_VOICE_TOOLS,
  UIMessageWithCompleted,
  VoiceChatOptions,
  VoiceChatSession,
} from "..";
import { generateUUID } from "lib/utils";
import { TextPart, ToolUIPart } from "ai";
import { extractMCPToolId } from "lib/ai/mcp/mcp-tool-id";
import { callMcpToolByServerNameAction } from "@/app/api/mcp/actions";
import { appStore } from "@/app/store";
import { useTheme } from "next-themes";

export const GROQ_VOICE = {
  Autumn: "autumn",
  Diana: "diana",
  Hannah: "hannah",
  Austin: "austin",
  Daniel: "daniel",
  Troy: "troy",
} as const;

type Content =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-invocation";
      name: string;
      arguments: any;
      state: "call" | "result";
      toolCallId: string;
      result?: any;
    };

const createUIPart = (content: Content): TextPart | ToolUIPart => {
  if (content.type == "tool-invocation") {
    const part: ToolUIPart = {
      type: `tool-${content.name}`,
      input: content.arguments,
      state: "output-available",
      toolCallId: content.toolCallId,
      output: content.result,
    };
    return part;
  }
  return {
    type: "text",
    text: content.text,
  };
};

const createUIMessage = (m: {
  id?: string;
  role: "user" | "assistant";
  content: Content;
  completed?: boolean;
}): UIMessageWithCompleted => {
  const id = m.id ?? generateUUID();
  return {
    id,
    role: m.role,
    parts: [createUIPart(m.content)],
    completed: m.completed ?? false,
  };
};

// VAD (Voice Activity Detection) based on audio level
class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private silenceThreshold = 15;
  private silenceTimeout = 1500; // ms of silence to stop recording
  private lastSpeechTime = 0;
  private isCurrentlySpeaking = false;
  private onSpeechStart: (() => void) | null = null;
  private onSpeechEnd: (() => void) | null = null;
  private animationFrame: number | null = null;

  constructor(
    stream: MediaStream,
    onSpeechStart?: () => void,
    onSpeechEnd?: () => void,
  ) {
    this.onSpeechStart = onSpeechStart ?? null;
    this.onSpeechEnd = onSpeechEnd ?? null;
    this.setup(stream);
  }

  private setup(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.dataArray = new Uint8Array(
      this.analyser.frequencyBinCount,
    ) as Uint8Array<ArrayBuffer>;
    this.startMonitoring();
  }

  private startMonitoring() {
    const check = () => {
      if (!this.analyser || !this.dataArray) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      const average =
        this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;

      const now = Date.now();
      const isSpeaking = average > this.silenceThreshold;

      if (isSpeaking) {
        this.lastSpeechTime = now;
        if (!this.isCurrentlySpeaking) {
          this.isCurrentlySpeaking = true;
          this.onSpeechStart?.();
        }
      } else if (
        this.isCurrentlySpeaking &&
        now - this.lastSpeechTime > this.silenceTimeout
      ) {
        this.isCurrentlySpeaking = false;
        this.onSpeechEnd?.();
      }

      this.animationFrame = requestAnimationFrame(check);
    };
    check();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.audioContext?.close();
  }

  resetSilenceTimer() {
    this.lastSpeechTime = Date.now();
  }
}

export function useGroqVoiceChat(props?: VoiceChatOptions): VoiceChatSession {
  const { voice = GROQ_VOICE.Troy } = props || {};

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioStream = useRef<MediaStream | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const isProcessing = useRef(false);
  const conversationHistory = useRef<
    Array<{
      role: string;
      content: string;
      tool_calls?: any[];
      tool_call_id?: string;
      name?: string;
    }>
  >([]);

  // Session state
  const sessionRef = useRef<{
    systemPrompt: string;
    tools: any[];
    threadId: string;
  } | null>(null);

  const { setTheme } = useTheme();

  // Initialize session with tools and system prompt
  const initializeSession = useCallback(async (): Promise<void> => {
    const response = await fetch("/api/chat/groq-voice/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: props?.agentId,
        mentions: props?.toolMentions || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initialize session");
    }

    const session = await response.json();

    sessionRef.current = {
      systemPrompt: session.systemPrompt,
      tools: session.tools,
      threadId: session.threadId, // Use threadId from server
    };

    console.log(
      `[Groq Voice] Session initialized with ${session.tools.length} tools, thread: ${session.threadId}`,
    );
  }, [props?.agentId, props?.toolMentions]);

  // Handle built-in voice tools
  const handleBuiltInTool = useCallback(
    async (toolName: string, args: any): Promise<string> => {
      switch (toolName) {
        case "changeBrowserTheme":
          setTheme(args?.theme);
          return "Theme changed successfully";
        case "endConversation":
          // Will be handled by caller
          return "Conversation ended";
        default:
          return "Unknown tool";
      }
    },
    [setTheme],
  );

  // Execute MCP tool
  const executeMcpTool = useCallback(
    async (toolName: string, args: any): Promise<string> => {
      try {
        const toolId = extractMCPToolId(toolName);
        const result = await callMcpToolByServerNameAction(
          toolId.serverName,
          toolId.toolName,
          args,
        );
        return JSON.stringify(result).slice(0, 15000);
      } catch (err) {
        console.error(`[Groq Voice] Tool execution error:`, err);
        return JSON.stringify({ error: String(err) });
      }
    },
    [],
  );

  // Transcribe audio using Groq Whisper
  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string> => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/chat/groq-voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to transcribe audio");
      }

      const result = await response.json();
      return result.text;
    },
    [],
  );

  // Synthesize speech using Groq TTS
  const synthesizeSpeech = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;

      setIsAssistantSpeaking(true);

      try {
        const response = await fetch("/api/chat/groq-voice/synthesize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to synthesize speech");
        }

        const audioData = await response.arrayBuffer();
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (!audioElement.current) {
          audioElement.current = new Audio();
        }

        audioElement.current.src = audioUrl;
        audioElement.current.onended = () => {
          setIsAssistantSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          // Reset VAD silence timer after assistant finishes speaking
          vadRef.current?.resetSilenceTimer();
        };

        await audioElement.current.play();
      } catch (err) {
        setIsAssistantSpeaking(false);
        throw err;
      }
    },
    [voice],
  );

  // Get LLM response with tool support
  const getLLMResponse = useCallback(
    async (userText: string): Promise<string> => {
      // Add user message to conversation history
      conversationHistory.current.push({ role: "user", content: userText });

      let shouldEndConversation = false;
      const maxIterations = 5; // Prevent infinite tool loops
      let iteration = 0;
      let finalResponse = "";

      while (iteration < maxIterations) {
        iteration++;

        // Use the server-side API
        const response = await fetch("/api/chat/groq-voice/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversationHistory.current,
            systemPrompt: sessionRef.current?.systemPrompt,
            tools: sessionRef.current?.tools,
            threadId: sessionRef.current?.threadId,
            saveToHistory: true, // Save all messages to history
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get LLM response");
        }

        const data = await response.json();

        // Handle tool calls
        if (data.type === "tool_calls" && data.toolCalls?.length > 0) {
          console.log(
            `[Groq Voice] Processing ${data.toolCalls.length} tool calls`,
          );

          // Add assistant message with tool calls to history
          conversationHistory.current.push({
            role: "assistant",
            content: data.content || "",
            tool_calls: data.toolCalls,
          });

          // Execute each tool call
          for (const toolCall of data.toolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

            console.log(`[Groq Voice] Executing tool: ${toolName}`);

            // Add tool message to UI
            const toolMessageId = generateUUID();
            const toolMessage = createUIMessage({
              id: toolMessageId,
              role: "assistant",
              content: {
                type: "tool-invocation",
                name: toolName,
                arguments: toolArgs,
                state: "call",
                toolCallId: toolCall.id,
              },
              completed: false,
            });
            setMessages((prev) => [...prev, toolMessage]);

            let toolResult: string;

            // Check if it's a built-in voice tool
            if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
              toolResult = await handleBuiltInTool(toolName, toolArgs);

              if (toolName === "endConversation") {
                shouldEndConversation = true;
              }
            } else {
              // Execute MCP tool
              toolResult = await executeMcpTool(toolName, toolArgs);
            }

            // Update tool message with result
            setMessages((prev) =>
              prev.map((m) =>
                m.id === toolMessageId
                  ? {
                      ...m,
                      parts: [
                        {
                          type: `tool-${toolName}`,
                          input: toolArgs,
                          state: "output-available",
                          toolCallId: toolCall.id,
                          output: toolResult,
                        } as ToolUIPart,
                      ],
                      completed: true,
                    }
                  : m,
              ),
            );

            // Add tool result to conversation history
            conversationHistory.current.push({
              role: "tool",
              content: toolResult,
              tool_call_id: toolCall.id,
              name: toolName,
            });
          }

          if (shouldEndConversation) {
            // End conversation after tool execution
            setError(null);
            setMessages([]);
            appStore.setState((prev) => ({
              voiceChat: {
                ...prev.voiceChat,
                agentId: undefined,
                isOpen: false,
              },
            }));
            return "Goodbye!";
          }

          // Continue to get response after tool execution
          continue;
        }

        // Regular text response
        finalResponse = data.text || "";

        // Add assistant response to conversation history
        conversationHistory.current.push({
          role: "assistant",
          content: finalResponse,
        });

        break;
      }

      return finalResponse;
    },
    [handleBuiltInTool, executeMcpTool],
  );

  // Process recorded audio
  const processAudio = useCallback(async () => {
    if (isProcessing.current || audioChunks.current.length === 0) return;

    isProcessing.current = true;
    setIsLoading(true);

    try {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      audioChunks.current = [];

      // Skip very short recordings (less than 0.5 second of audio)
      if (audioBlob.size < 5000) {
        isProcessing.current = false;
        setIsLoading(false);
        return;
      }

      // Transcribe user speech
      const userText = await transcribeAudio(audioBlob);

      if (!userText.trim()) {
        isProcessing.current = false;
        setIsLoading(false);
        return;
      }

      // Add user message to UI
      const userMessageId = generateUUID();
      const userMessage = createUIMessage({
        id: userMessageId,
        role: "user",
        content: { type: "text", text: userText },
        completed: true,
      });
      setMessages((prev) => [...prev, userMessage]);

      // Get LLM response
      const assistantText = await getLLMResponse(userText);

      // Add assistant message to UI
      const assistantMessageId = generateUUID();
      const assistantMessage = createUIMessage({
        id: assistantMessageId,
        role: "assistant",
        content: { type: "text", text: assistantText },
        completed: true,
      });
      setMessages((prev) => [...prev, assistantMessage]);

      setIsLoading(false);

      // Synthesize and play response
      await synthesizeSpeech(assistantText);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    } finally {
      isProcessing.current = false;
    }
  }, [transcribeAudio, getLLMResponse, synthesizeSpeech]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!audioStream.current || isProcessing.current || isAssistantSpeaking)
      return;

    audioChunks.current = [];
    const recorder = new MediaRecorder(audioStream.current, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      processAudio();
    };

    recorder.start(100); // Collect data every 100ms
    mediaRecorder.current = recorder;
    setIsUserSpeaking(true);
  }, [processAudio, isAssistantSpeaking]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsUserSpeaking(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "getUserMedia is not supported in this browser or context. Please use HTTPS or check browser compatibility.",
        );
      }
      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      // Setup VAD
      if (vadRef.current) {
        vadRef.current.stop();
      }

      vadRef.current = new VoiceActivityDetector(
        audioStream.current,
        startRecording,
        stopRecording,
      );

      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [startRecording, stopRecording]);

  const stopListening = useCallback(async () => {
    try {
      if (vadRef.current) {
        vadRef.current.stop();
        vadRef.current = null;
      }

      if (
        mediaRecorder.current &&
        mediaRecorder.current.state === "recording"
      ) {
        mediaRecorder.current.stop();
      }

      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }

      setIsListening(false);
      setIsUserSpeaking(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const start = useCallback(async () => {
    if (isActive || isLoading) return;

    setIsLoading(true);
    setError(null);
    setMessages([]);
    conversationHistory.current = [];
    sessionRef.current = null;

    try {
      // Initialize session with tools and system prompt
      await initializeSession();

      // Request microphone access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "getUserMedia is not supported in this browser or context. Please use HTTPS or check browser compatibility.",
        );
      }
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup VAD for automatic speech detection
      vadRef.current = new VoiceActivityDetector(
        audioStream.current,
        startRecording,
        stopRecording,
      );

      setIsActive(true);
      setIsListening(true);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isActive, isLoading, startRecording, stopRecording, initializeSession]);

  const stop = useCallback(async () => {
    try {
      if (vadRef.current) {
        vadRef.current.stop();
        vadRef.current = null;
      }

      if (mediaRecorder.current) {
        if (mediaRecorder.current.state === "recording") {
          mediaRecorder.current.stop();
        }
        mediaRecorder.current = null;
      }

      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }

      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current.src = "";
      }

      setIsActive(false);
      setIsListening(false);
      setIsUserSpeaking(false);
      setIsAssistantSpeaking(false);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    isUserSpeaking,
    isAssistantSpeaking,
    isListening,
    isLoading,
    error,
    messages,
    start,
    stop,
    startListening,
    stopListening,
  };
}
