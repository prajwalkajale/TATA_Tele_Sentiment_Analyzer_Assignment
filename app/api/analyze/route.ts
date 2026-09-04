import OpenAI from "openai";
import { NextResponse } from "next/server";
import { saveAnalysis } from "@/lib/db";
import { AnalysisResultSchema, type AnalysisResult } from "@/lib/analysis-schema";

export const runtime = "nodejs";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL?.trim();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: unknown };
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    if (transcript.length > 20000) {
      return NextResponse.json(
        { error: "Transcript is too long. Please keep it under 20,000 characters." },
        { status: 413 }
      );
    }

    const result = await analyzeTranscript(transcript);
    saveAnalysis("agent", transcript, result).catch((cause) => {
      console.error("Failed to save call analysis", cause);
    });

    return NextResponse.json(result);
  } catch (cause) {
    console.error("Analysis route failed", cause);
    return NextResponse.json(
      { error: "Unable to analyze the transcript. Please try again." },
      { status: 500 }
    );
  }
}

async function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
  if (n8nWebhookUrl) {
    return analyzeWithN8n(n8nWebhookUrl, transcript);
  }

  // Fallback path for Vercel/offline demos when n8n is not configured.
  if (!process.env.OPENAI_API_KEY) {
    return createDemoAnalysis(transcript);
  }

  return analyzeWithOpenAI(transcript);
}

async function analyzeWithN8n(webhookUrl: string, transcript: string): Promise<AnalysisResult> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return AnalysisResultSchema.parse(normalizeN8nPayload(payload));
}

async function analyzeWithOpenAI(transcript: string): Promise<AnalysisResult> {
  const client = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: "You are an expert telecom customer-experience analyst. Return only valid JSON that exactly matches the requested schema. Do not include markdown.\n\n" + buildPrompt(transcript)
      }
    ]
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error("The AI returned an empty response.");
  }

  const cleanContent = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  return AnalysisResultSchema.parse(JSON.parse(cleanContent));
}

function normalizeN8nPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload[0]?.json ?? payload[0];
  }

  if (payload && typeof payload === "object" && "json" in payload) {
    return (payload as { json: unknown }).json;
  }

  return payload;
}

function buildPrompt(transcript: string) {
  return `Analyze this telecom customer conversation.

Evaluation priorities:
- Logical sentiment accuracy.
- Clear reasoning for every sentiment choice.
- Telecom-specific KPIs that can be derived from a phone call.
- Creativity through emotion detection, summary, and recommended actions.

Strict JSON schema:
{
  "overallSentiment": "Positive | Negative | Neutral",
  "overallScore": number from -1 to 1,
  "summary": "brief conversation summary",
  "primaryEmotion": "dominant customer emotion",
  "emotionMix": [
    { "emotion": "Frustration | Relief | Confusion | Trust | Satisfaction | etc", "intensity": number from 0 to 100 }
  ],
  "kpis": [
    {
      "name": "Churn Risk | First Contact Resolution | Customer Effort Score | Escalation Need | Compliance Risk",
      "value": "short display value",
      "status": "good | watch | risk",
      "reasoning": "clear KPI reasoning from call evidence"
    }
  ],
  "sentenceLevel": [
    {
      "id": number,
      "speaker": "Customer | Agent | Unknown",
      "text": "single transcript line or sentence",
      "sentiment": "Positive | Negative | Neutral",
      "score": number from -1 to 1,
      "emotion": "detected emotion",
      "reasoning": "clear reason for the sentiment label"
    }
  ],
  "recommendedActions": ["specific next-best action for the telecom team"]
}

Rules:
- Break the transcript into readable line-by-line or sentence-level entries.
- Use evidence from the text, not generic assumptions.
- Prefer concise reasoning, but make it clear enough for an evaluator to audit.
- Return JSON only.

Transcript:
${transcript}`;
}

function createDemoAnalysis(transcript: string): AnalysisResult {
  const lines = transcript
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sentenceLevel = lines.map((line, index) => {
    const lower = line.toLowerCase();
    const isNegative =
      /frustrat|drop|repeat|not|issue|problem|unreliable|outage|cancel|angry|slow/.test(lower);
    const isPositive = /thanks|appreciate|better|stable|helps|credit/.test(lower);
    const sentiment = isNegative && !isPositive ? "Negative" : isPositive ? "Positive" : "Neutral";
    const score = sentiment === "Negative" ? -0.65 : sentiment === "Positive" ? 0.7 : 0.05;

    return {
      id: index + 1,
      speaker: line.includes(":") ? line.split(":")[0] : "Unknown",
      text: line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : line,
      sentiment,
      score,
      emotion: sentiment === "Negative" ? "Frustration" : sentiment === "Positive" ? "Relief" : "Attentiveness",
      reasoning:
        sentiment === "Negative"
          ? "The line contains service disruption or repeated-effort language."
          : sentiment === "Positive"
            ? "The line signals appreciation, improvement, or resolution progress."
            : "The line is procedural and does not strongly indicate satisfaction or dissatisfaction."
    };
  });

  const average =
    sentenceLevel.reduce((total, item) => total + item.score, 0) / Math.max(sentenceLevel.length, 1);
  const overallSentiment = average < -0.2 ? "Negative" : average > 0.2 ? "Positive" : "Neutral";

  return AnalysisResultSchema.parse({
    overallSentiment,
    overallScore: Number(average.toFixed(2)),
    summary:
      "The customer begins frustrated by repeated connectivity failures, while the agent acknowledges the impact, avoids redundant troubleshooting, opens a priority ticket, and offers a service credit.",
    primaryEmotion: average < 0 ? "Frustration easing into relief" : "Relief",
    emotionMix: [
      { emotion: "Frustration", intensity: 58 },
      { emotion: "Relief", intensity: 34 },
      { emotion: "Trust", intensity: 26 }
    ],
    kpis: [
      {
        name: "Churn Risk",
        value: average < -0.2 ? "Medium" : "Low",
        status: average < -0.2 ? "watch" : "good",
        reasoning:
          "The customer reports reliability pain, but the agent provides ownership, a ticket, and a service credit."
      },
      {
        name: "First Contact Resolution",
        value: "Likely partial",
        status: "watch",
        reasoning:
          "The connection is refreshed during the call, but a field-ticket SLA remains in case the issue returns."
      },
      {
        name: "Customer Effort Score",
        value: "Improving",
        status: "good",
        reasoning:
          "The agent explicitly avoids asking the customer to repeat basic troubleshooting."
      }
    ],
    sentenceLevel,
    recommendedActions: [
      "Monitor the priority network ticket until the four-hour SLA closes.",
      "Send a proactive confirmation text with the ticket number and credit details.",
      "Flag repeated drops as a retention risk if another outage occurs within seven days."
    ]
  });
}
