import { z } from "zod";

export const SentimentEnum = z.enum(["Positive", "Negative", "Neutral"]);

export const SentenceSentimentSchema = z.object({
  id: z.number(),
  speaker: z.string(),
  text: z.string(),
  sentiment: SentimentEnum,
  score: z.number().min(-1).max(1),
  emotion: z.string(),
  reasoning: z.string()
});

export const TelecomKpiSchema = z.object({
  name: z.string(),
  value: z.string(),
  status: z.enum(["good", "watch", "risk"]),
  reasoning: z.string()
});

export const AnalysisResultSchema = z.object({
  overallSentiment: SentimentEnum,
  overallScore: z.number().min(-1).max(1),
  summary: z.string(),
  primaryEmotion: z.string(),
  emotionMix: z.array(
    z.object({
      emotion: z.string(),
      intensity: z.number().min(0).max(100)
    })
  ),
  kpis: z.array(TelecomKpiSchema),
  sentenceLevel: z.array(SentenceSentimentSchema),
  recommendedActions: z.array(z.string())
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
