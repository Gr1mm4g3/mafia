"use client";

import React, { useState, useTransition } from "react";
import { ActionResponse, registerOrLoginAction } from "@/app/actions/game";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<ActionResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("mode", mode);
    fd.set("username", username);
    fd.set("password", password);

    startTransition(async () => {
      const res = await registerOrLoginAction(fd);
      setFeedback(res);
    });
  }

  function handleQuickStart() {
    const fd = new FormData();
    fd.set("mode", "quick");
    startTransition(async () => {
      const res = await registerOrLoginAction(fd);
      setFeedback(res);
    });
  }

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col justify-center items-center p-4 font-mono">
      <div className="w-full max-w-xl bg-[#1a1a1a] border border-zinc-800 shadow-2xl">
        {/* Top Terminal Banner */}
        <div className="bg-[#121212] border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-amber-500 font-semibold block">
              Barafranca // Underworld Network v1.93
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-0.5">
              OMERTA: THE SYNDICATE
            </h1>
          </div>
          <span className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400">
            1930s EDITION
          </span>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-amber-500/60 pl-3">
            Climb a 16-tier Mafia hierarchy from <span className="text-zinc-200">Empty Suit</span>{" "}
            to <span className="text-amber-400">Godfather</span>. Pull timed street heists, hotwire
            classic pre-war automobiles, smuggle bootleg spirits and narcotics between six cities,
            and bust your crew out of precinct lockup.
          </p>

          {/* 1-Click Instant Play */}
          <div className="bg-[#141414] border border-amber-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Fast Track Induction
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Generate a made man with $1,000 starting capital & jump straight into New York.
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickStart}
              disabled={isPending}
              className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition cursor-pointer"
            >
              {isPending ? "Opening Books..." : "Instant Mobster →"}
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-widest text-zinc-500">
              Or Use Custom Credentials
            </span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 border border-zinc-800 bg-[#121212] p-1">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                mode === "register"
                  ? "bg-zinc-800 text-amber-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Swear Omerta (Register)
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                mode === "login"
                  ? "bg-zinc-800 text-amber-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Existing Earner (Login)
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 border text-xs ${
                feedback.ok
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/40 border-red-500/40 text-red-300"
              }`}
            >
              <div className="font-bold uppercase">{feedback.title}</div>
              <div className="mt-0.5 text-zinc-300">{feedback.message}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                Street Handle (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Lucky_Luciano"
                className="w-full bg-[#121212] border border-zinc-700 focus:border-amber-500 px-3 py-2 text-sm text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                Secret Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#121212] border border-zinc-700 focus:border-amber-500 px-3 py-2 text-sm text-zinc-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-zinc-100 hover:bg-white disabled:opacity-50 text-black font-bold text-xs uppercase tracking-widest py-3 transition cursor-pointer"
            >
              {isPending
                ? "Verifying With Commission..."
                : mode === "register"
                  ? "Create Mobster Account"
                  : "Enter the Underworld"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

