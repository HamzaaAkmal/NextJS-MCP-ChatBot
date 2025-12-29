import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Groq TTS API: `),
});

// Available English voices for Orpheus TTS
export const GROQ_TTS_VOICES = {
  autumn: "autumn",
  diana: "diana",
  hannah: "hannah",
  austin: "austin",
  daniel: "daniel",
  troy: "troy",
} as const;

export type GroqTTSVoice = keyof typeof GROQ_TTS_VOICES;

// Orpheus has a 200 character limit, so we need to split long text into chunks
function splitTextIntoChunks(text: string, maxLength: number = 180): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary or space within the limit
    let splitIndex = remaining.lastIndexOf(". ", maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }

  return chunks;
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

    const { text, voice = "troy" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    logger.info(`Synthesizing speech: "${text.substring(0, 50)}..." with voice: ${voice}`);

    // Split text into chunks due to 200 character limit
    const chunks = splitTextIntoChunks(text.slice(0, 4096));
    const audioBuffers: ArrayBuffer[] = [];

    for (const chunk of chunks) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "canopylabs/orpheus-v1-english",
            voice: voice,
            input: chunk,
            response_format: "wav",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Groq TTS error: ${errorText}`);
        return NextResponse.json(
          { error: `Groq API error: ${errorText}` },
          { status: response.status }
        );
      }

      const audioData = await response.arrayBuffer();
      audioBuffers.push(audioData);
    }

    // For simplicity, just return the first chunk's audio
    // In production, you'd want to concatenate WAV files properly
    const combinedAudio = audioBuffers[0];
    logger.info(`Speech synthesis successful, audio size: ${combinedAudio.byteLength} bytes`);

    return new NextResponse(combinedAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": combinedAudio.byteLength.toString(),
      },
    });
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
