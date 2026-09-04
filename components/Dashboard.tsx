"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  HeartPulse,
  MessageSquareText,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  TrendingUp
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AnalysisResult } from "@/lib/analysis-schema";
import type { LucideIcon } from "lucide-react";

type DashboardProps = {
  analysis: AnalysisResult;
};

type StatusTone = "good" | "watch" | "risk" | "neutral";

type KpiCard = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: StatusTone;
};

const sentimentStyles = {
  Positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Negative: "bg-red-50 text-red-700 ring-red-200",
  Neutral: "bg-slate-100 text-slate-700 ring-slate-200"
};

const scoreLabelStyles = {
  Positive: "text-emerald-700",
  Negative: "text-red-700",
  Neutral: "text-slate-700"
};

const statusStyles: Record<StatusTone, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  risk: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700"
};

export function Dashboard({ analysis }: DashboardProps) {
  const churnRisk = findKpi(analysis, "Churn Risk");
  const firstContactResolution = findKpi(analysis, "First Contact Resolution");
  const customerEffortScore = findKpi(analysis, "Customer Effort Score");
  const issueCategory = inferIssueCategory(analysis);

  const chartData = analysis.sentenceLevel.map((item) => ({
    id: item.id,
    speaker: item.speaker,
    sentiment: item.sentiment,
    sentimentScore: item.score,
    emotion: item.emotion
  }));

  const kpiCards: KpiCard[] = [
    {
      label: "Overall Sentiment",
      value: analysis.overallSentiment,
      detail: `${formatScore(analysis.overallScore)} average score`,
      icon: HeartPulse,
      tone: sentimentToTone(analysis.overallSentiment)
    },
    {
      label: "Issue Category",
      value: issueCategory,
      detail: "Inferred from call evidence",
      icon: PhoneCall,
      tone: "neutral"
    },
    {
      label: "Churn Risk",
      value: churnRisk?.value ?? "Not detected",
      detail: churnRisk?.reasoning ?? "No churn signal was returned by the AI.",
      icon: ShieldAlert,
      tone: churnRisk?.status ?? "neutral"
    },
    {
      label: "First Contact Resolution",
      value: firstContactResolution?.value ?? "Not detected",
      detail: firstContactResolution?.reasoning ?? "No FCR signal was returned by the AI.",
      icon: CheckCircle2,
      tone: firstContactResolution?.status ?? "neutral"
    },
    {
      label: "Customer Effort Score",
      value: customerEffortScore?.value ?? "Not detected",
      detail: customerEffortScore?.reasoning ?? "No effort signal was returned by the AI.",
      icon: Gauge,
      tone: customerEffortScore?.status ?? "neutral"
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="mb-6 flex flex-col gap-3 border-t border-slate-200 pt-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">
            Results dashboard
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            Customer experience intelligence
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
          <Activity aria-hidden="true" size={17} />
          {analysis.sentenceLevel.length} analyzed turns
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-signal">
              <MessageSquareText aria-hidden="true" size={21} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ink">Conversation Summary</h3>
              <p className="text-sm text-slate-500">AI-generated summary with call context.</p>
            </div>
          </div>
          <p className="text-lg leading-8 text-slate-700">{limitToTwoSentences(analysis.summary)}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {analysis.recommendedActions.slice(0, 2).map((action) => (
              <div key={action} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-mint">
                  <Sparkles aria-hidden="true" size={16} />
                  Recommended action
                </div>
                <p className="text-sm leading-6 text-slate-600">{action}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-mint">
              <BarChart3 aria-hidden="true" size={21} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ink">Emotion Mix</h3>
              <p className="text-sm text-slate-500">Primary emotion: {analysis.primaryEmotion}</p>
            </div>
          </div>

          <div className="space-y-4">
            {analysis.emotionMix.map((emotion) => (
              <div key={emotion.emotion}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{emotion.emotion}</span>
                  <span className="text-slate-500">{emotion.intensity}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-mint"
                    style={{ width: `${emotion.intensity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${statusStyles[card.tone]}`}>
                  <Icon aria-hidden="true" size={20} />
                </div>
                {card.tone === "risk" ? <AlertTriangle className="text-red-500" aria-hidden="true" size={18} /> : null}
              </div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-semibold leading-tight ${card.label === "Overall Sentiment" ? scoreLabelStyles[analysis.overallSentiment] : "text-ink"}`}>
                {card.value}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{card.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">Sentiment Trajectory</h3>
            <p className="text-sm text-slate-500">
              Scores range from -1 negative to +1 positive across the conversation.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <TrendingUp aria-hidden="true" size={17} />
            Ended at {formatScore(chartData.at(-1)?.sentimentScore ?? 0)}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
              <XAxis dataKey="id" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "#94A3B8", strokeDasharray: "4 4" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)"
                }}
                formatter={(value) => [formatScore(Number(value)), "Sentiment score"]}
                labelFormatter={(label) => `Sentence ${label}`}
              />
              <Line
                type="monotone"
                dataKey="sentimentScore"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: "#FFFFFF", stroke: "#2563EB", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#2563EB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-ink">Sentence-Level Breakdown</h3>
          <p className="mt-1 text-sm text-slate-500">
            Line-by-line evidence, sentiment label, emotion detection, and reasoning.
          </p>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-4 font-semibold">Speaker</th>
                <th className="border-b border-slate-200 px-5 py-4 font-semibold">Sentence</th>
                <th className="border-b border-slate-200 px-5 py-4 font-semibold">Emotion Detection</th>
                <th className="border-b border-slate-200 px-5 py-4 font-semibold">Sentiment</th>
                <th className="border-b border-slate-200 px-5 py-4 font-semibold">AI Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.sentenceLevel.map((item) => (
                <tr key={item.id} className="align-top transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={speakerClassName(item.speaker)}>{item.speaker}</span>
                  </td>
                  <td className="max-w-md px-5 py-4 text-sm leading-6 text-slate-700">{item.text}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                    {item.emotion}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sentimentStyles[item.sentiment]}`}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="max-w-lg px-5 py-4 text-sm leading-6 text-slate-600">{item.reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function findKpi(analysis: AnalysisResult, name: string) {
  return analysis.kpis.find((kpi) => kpi.name.toLowerCase() === name.toLowerCase());
}

function sentimentToTone(sentiment: AnalysisResult["overallSentiment"]): StatusTone {
  if (sentiment === "Positive") return "good";
  if (sentiment === "Negative") return "risk";
  return "watch";
}

function formatScore(score: number) {
  return `${score > 0 ? "+" : ""}${score.toFixed(2)}`;
}

function limitToTwoSentences(summary: string) {
  const sentences = summary.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return summary;
  return sentences.slice(0, 2).join(" ").trim();
}

function inferIssueCategory(analysis: AnalysisResult) {
  const haystack = `${analysis.summary} ${analysis.sentenceLevel.map((item) => item.text).join(" ")}`.toLowerCase();

  if (/internet|router|wifi|broadband|packet|signal|outage|drop/.test(haystack)) {
    return "Connectivity";
  }
  if (/bill|charge|payment|invoice|refund|credit/.test(haystack)) {
    return "Billing";
  }
  if (/plan|upgrade|downgrade|data|roaming|sim/.test(haystack)) {
    return "Plan or Account";
  }
  if (/technician|field|appointment|install|repair/.test(haystack)) {
    return "Field Service";
  }

  return "General Support";
}

function speakerClassName(speaker: string) {
  const normalized = speaker.toLowerCase();
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1";

  if (normalized.includes("agent")) {
    return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
  }
  if (normalized.includes("customer")) {
    return `${base} bg-teal-50 text-teal-700 ring-teal-200`;
  }

  return `${base} bg-slate-100 text-slate-700 ring-slate-200`;
}
