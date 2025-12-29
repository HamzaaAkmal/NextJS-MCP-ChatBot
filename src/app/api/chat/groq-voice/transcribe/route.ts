import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Groq STT API: `),
});

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

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    logger.info(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

    // Prepare form data for Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, audioFile.name || "audio.webm");
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("language", "en");
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: groqFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Groq STT error: ${errorText}`);
      return NextResponse.json(
        { error: `Groq API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    logger.info(`Transcription successful: "${result.text?.substring(0, 50)}..."`);

    return NextResponse.json({ text: result.text });
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
