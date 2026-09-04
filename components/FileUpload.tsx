"use client";

import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { sampleTelecomTranscript } from "@/lib/sample-transcript";
import type { AnalysisResult } from "@/lib/analysis-schema";

type FileUploadProps = {
  onResult: (result: AnalysisResult) => void;
};

export function FileUpload({ onResult }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Please upload a .txt transcript.");
      return;
    }

    setFileName(file.name);
    setTranscript(await file.text());
  }

  async function analyzeTranscript() {
    if (!transcript.trim()) {
      setError("Add a transcript or load the sample before analyzing.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      onResult(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">
          Full-stack AI workflow
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
          Upload a telecom conversation
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-signal hover:bg-blue-50"
          >
            <Upload aria-hidden="true" className="mb-3 text-signal" size={28} />
            <span className="font-semibold text-ink">Choose .txt transcript</span>
            <span className="mt-2 text-sm text-slate-500">
              {fileName || "Plain text call logs or chat transcripts work best."}
            </span>
          </button>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setTranscript(sampleTelecomTranscript);
                setFileName("sample-telecom-transcript.txt");
                setError("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-medium text-ink transition hover:bg-slate-50"
            >
              <FileText aria-hidden="true" size={18} />
              Load Sample Telecom Transcript
            </button>

            <button
              type="button"
              onClick={analyzeTranscript}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-signal px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              Analyze
            </button>
          </div>

          {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}
        </div>

        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Paste conversation text here..."
          className="min-h-96 resize-none rounded-lg border border-slate-200 bg-white p-4 leading-7 text-slate-700 shadow-soft outline-none transition focus:border-signal focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </section>
  );
}
