"use client";

import { Clock3, FileClock, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis-schema";
import type { HistoryItem } from "@/lib/db";

type HistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoadAnalysis: (result: AnalysisResult) => void;
};

const sentimentStyles = {
  Positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Negative: "bg-red-50 text-red-700 ring-red-200",
  Neutral: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function HistoryDrawer({ isOpen, onClose, onLoadAnalysis }: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadHistory() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/history");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load call history.");
        }

        setHistory(payload.history ?? []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load call history.");
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [isOpen]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex min-h-64 items-center justify-center text-slate-500">
          <Loader2 aria-hidden="true" className="mr-2 animate-spin" size={18} />
          Loading call history
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (!history.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          No saved calls yet. Analyze a transcript and it will appear here automatically.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {history.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock3 aria-hidden="true" size={14} />
                  {formatDate(item.createdAt)}
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sentimentStyles[item.overallSentiment]}`}>
                  {item.overallSentiment}
                </span>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {inferIssueCategory(item)}
              </span>
            </div>

            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
              {truncate(item.transcript, 220)}
            </p>

            <button
              type="button"
              onClick={() => {
                onLoadAnalysis(item.result);
                onClose();
              }}
              className="mt-4 w-full rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Load Analysis
            </button>
          </article>
        ))}
      </div>
    );
  }, [error, history, isLoading, onClose, onLoadAnalysis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-[#f7f9fc] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-signal">
              <FileClock aria-hidden="true" size={21} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Call History</h2>
              <p className="text-sm text-slate-500">Saved analyses for the logged-in agent.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6">{content}</div>
      </aside>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function inferIssueCategory(item: HistoryItem) {
  const haystack = `${item.summary} ${item.transcript}`.toLowerCase();

  if (/internet|router|wifi|broadband|packet|signal|outage|drop/.test(haystack)) {
    return "Connectivity";
  }
  if (/bill|charge|payment|invoice|refund|credit/.test(haystack)) {
    return "Billing";
  }
  if (/plan|upgrade|downgrade|data|roaming|sim/.test(haystack)) {
    return "Plan";
  }
  if (/technician|field|appointment|install|repair/.test(haystack)) {
    return "Field Service";
  }

  return "Support";
}
