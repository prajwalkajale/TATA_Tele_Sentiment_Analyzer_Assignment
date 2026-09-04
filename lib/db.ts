import { Pool } from "pg";
import type { AnalysisResult } from "@/lib/analysis-schema";

export type HistoryItem = {
  id: number;
  username: string;
  transcript: string;
  overallSentiment: AnalysisResult["overallSentiment"];
  summary: string;
  kpis: AnalysisResult["kpis"];
  sentences: AnalysisResult["sentenceLevel"];
  createdAt: string;
  result: AnalysisResult;
};

type StoredHistoryItem = {
  id: number;
  username: string;
  transcript: string;
  overall_sentiment: AnalysisResult["overallSentiment"];
  summary: string;
  kpis: AnalysisResult["kpis"];
  sentences: AnalysisResult["sentenceLevel"];
  created_at: Date;
};

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  __callHistoryFallback?: HistoryItem[];
  historyTableReady?: boolean;
};

const pool =
  process.env.DATABASE_URL
    ? globalForDb.pgPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("localhost")
          ? false
          : process.env.DATABASE_URL.includes("postgres:5432")
            ? false
            : { rejectUnauthorized: false }
      })
    : null;

if (pool && !globalForDb.pgPool) {
  globalForDb.pgPool = pool;
}

if (!globalForDb.__callHistoryFallback) {
  globalForDb.__callHistoryFallback = [];
}

export async function saveAnalysis(
  username: string,
  transcript: string,
  result: AnalysisResult
): Promise<void> {
  if (!pool) {
    const item = toHistoryItem({
      id: Date.now(),
      username: username || "agent",
      transcript,
      overall_sentiment: result.overallSentiment,
      summary: result.summary,
      kpis: result.kpis,
      sentences: result.sentenceLevel,
      created_at: new Date()
    });

    globalForDb.__callHistoryFallback = [item, ...(globalForDb.__callHistoryFallback ?? [])].slice(0, 50);
    return;
  }

  await ensureHistoryTable();
  await pool.query(
    `INSERT INTO call_history
      (username, transcript, overall_sentiment, summary, kpis, sentences)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [
      username || "agent",
      transcript,
      result.overallSentiment,
      result.summary,
      JSON.stringify(result.kpis),
      JSON.stringify(result.sentenceLevel)
    ]
  );
}

export async function getHistory(username?: string): Promise<HistoryItem[]> {
  if (!pool) {
    const rows = globalForDb.__callHistoryFallback ?? [];
    return username ? rows.filter((item) => item.username === username) : rows;
  }

  await ensureHistoryTable();

  const query = username
    ? {
        text: `SELECT id, username, transcript, overall_sentiment, summary, kpis, sentences, created_at
               FROM call_history
               WHERE username = $1
               ORDER BY created_at DESC`,
        values: [username]
      }
    : {
        text: `SELECT id, username, transcript, overall_sentiment, summary, kpis, sentences, created_at
               FROM call_history
               ORDER BY created_at DESC`,
        values: []
      };

  const { rows } = await pool.query<StoredHistoryItem>(query);
  return rows.map(toHistoryItem);
}

async function ensureHistoryTable() {
  if (!pool || globalForDb.historyTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_history (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) DEFAULT 'agent',
      transcript TEXT NOT NULL,
      overall_sentiment VARCHAR(20) NOT NULL,
      summary TEXT,
      kpis JSONB NOT NULL,
      sentences JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  globalForDb.historyTableReady = true;
}

function toHistoryItem(row: StoredHistoryItem): HistoryItem {
  const sentences = row.sentences ?? [];
  const kpis = row.kpis ?? [];
  const overallScore = averageScore(sentences);

  const result: AnalysisResult = {
    overallSentiment: row.overall_sentiment,
    overallScore,
    summary: row.summary,
    primaryEmotion: primaryEmotion(sentences),
    emotionMix: emotionMix(sentences),
    kpis,
    sentenceLevel: sentences,
    recommendedActions: [
      "Review this saved call analysis with the support lead.",
      "Use the stored KPI signals to prioritize follow-up action."
    ]
  };

  return {
    id: row.id,
    username: row.username,
    transcript: row.transcript,
    overallSentiment: row.overall_sentiment,
    summary: row.summary,
    kpis,
    sentences,
    createdAt: row.created_at.toISOString(),
    result
  };
}

function averageScore(sentences: AnalysisResult["sentenceLevel"]) {
  if (!sentences.length) return 0;
  const total = sentences.reduce((sum, item) => sum + item.score, 0);
  return Number((total / sentences.length).toFixed(2));
}

function primaryEmotion(sentences: AnalysisResult["sentenceLevel"]) {
  return emotionMix(sentences)[0]?.emotion ?? "Unknown";
}

function emotionMix(sentences: AnalysisResult["sentenceLevel"]) {
  if (!sentences.length) {
    return [{ emotion: "Unknown", intensity: 0 }];
  }

  const counts = sentences.reduce<Record<string, number>>((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([emotion, count]) => ({
      emotion,
      intensity: Math.round((count / sentences.length) * 100)
    }))
    .sort((a, b) => b.intensity - a.intensity);
}
