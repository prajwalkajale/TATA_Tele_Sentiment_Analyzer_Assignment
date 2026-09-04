"use client";

import { useState } from "react";
import { FileClock, LogOut, RadioTower } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { FileUpload } from "@/components/FileUpload";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { LoginScreen } from "@/components/LoginScreen";
import type { AnalysisResult } from "@/lib/analysis-schema";

export default function Home() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!isAuthed) {
    return <LoginScreen onLogin={() => setIsAuthed(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal text-white">
              <RadioTower aria-hidden="true" size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Telecom Sentiment Analyzer</p>
              <p className="text-xs text-slate-500">Logged in as agent</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              <FileClock aria-hidden="true" size={17} />
              Call History
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setIsAuthed(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <LogOut aria-hidden="true" size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <FileUpload onResult={setAnalysis} />
      {analysis ? <Dashboard analysis={analysis} /> : null}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadAnalysis={setAnalysis}
      />
    </main>
  );
}
