"use client";

import { LockKeyhole, RadioTower } from "lucide-react";
import { FormEvent, useState } from "react";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("agent");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Basic auth is intentionally hardcoded to satisfy the timed assignment scope.
    if (username === "agent" && password === "password123") {
      onLogin();
      return;
    }

    setError("Use agent / password123 for the demo login.");
  }

  return (
    <main className="min-h-screen bg-[#eef4fb]">
      <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-signal text-white">
            <RadioTower aria-hidden="true" size={24} />
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Telecom Sentiment Analyzer
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Upload a support call transcript and turn it into AI-backed sentiment,
            churn risk, resolution signals, and conversation-level insights.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-signal">
              <LockKeyhole aria-hidden="true" size={21} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Agent Login</h2>
              <p className="text-sm text-slate-500">Demo credentials are prefilled.</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-signal focus:ring-2 focus:ring-blue-100"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-signal focus:ring-2 focus:ring-blue-100"
          />

          {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-signal px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
