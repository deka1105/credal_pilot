"use client";

import { useMemo, useState } from "react";
import { USERS, QUESTIONS, DOCS } from "./corpus";
import { compare, leakRate, canRead } from "./retrieve";

export function Harness() {
  const [userId, setUserId] = useState(USERS[0].id);
  const [q, setQ] = useState(QUESTIONS[0]);

  const user = USERS.find((u) => u.id === userId)!;
  const c = useMemo(() => compare(q, user), [q, user]);
  const rate = useMemo(() => leakRate(QUESTIONS), []);
  const visible = DOCS.filter((d) => canRead(user, d)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] text-foreground/55">Asking as:</span>
        {USERS.map((u) => (
          <button key={u.id} type="button" onClick={() => setUserId(u.id)}
            className={`rounded border px-2.5 py-1 text-[11.5px] transition-colors ${
              userId === u.id ? "border-foreground/40 bg-foreground/10"
                : "border-foreground/15 text-foreground/65 hover:border-foreground/30"}`}>
            {u.name} <span className="text-foreground/45">· {u.title}</span>
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="q" className="mb-1.5 block text-[12px] text-foreground/55">
          Ask anything — retrieval runs over the same {DOCS.length} documents either way.
          {" "}{user.name} can open {visible} of them.
        </label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-foreground/[0.02] px-3 py-2 text-[13px] outline-none focus:border-foreground/40" />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {QUESTIONS.slice(0, 5).map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)}
              className="rounded border border-foreground/12 px-1.5 py-0.5 text-[10.5px] text-foreground/55 transition-colors hover:border-foreground/30 hover:text-foreground/80">
              {s}
            </button>
          ))}
        </div>
      </div>

      {c.leaked && (
        <div className="rounded-lg border border-red-600/50 bg-red-500/10 px-4 py-3">
          <div className="text-[14px] font-semibold text-red-800 dark:text-red-300">
            Leak — and the answer is correct
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-red-900/90 dark:text-red-200/90">
            {user.name} ({user.title}) cannot open{" "}
            <strong>{c.unfiltered.hit!.doc.title}</strong>, and the assistant just answered from it.
            Nothing here is an error: no exception, no empty result, nothing in a log that says a
            person learned something they shouldn&rsquo;t have. The first signal is a complaint,
            months later.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel
          tone="bad" title="Retrieval over everything"
          sub="What the assistant finds when it searches the corpus and answers the best match."
          text={c.unfiltered.text} audit={c.unfiltered.audit}
          doc={c.unfiltered.hit?.doc.title ?? null}
          sensitivity={c.unfiltered.hit?.doc.sensitivity ?? null}
          consulted={c.unfiltered.consulted}
          flagged={c.leaked}
        />
        <Panel
          tone="good" title="Permissions inherited from the source"
          sub="The same scoring, over only the documents this person could already open."
          text={c.filtered.text} audit={c.filtered.audit}
          doc={c.filtered.hit?.doc.title ?? null}
          sensitivity={c.filtered.hit?.doc.sensitivity ?? null}
          consulted={c.filtered.consulted}
          flagged={false}
        />
      </div>

      {c.blocked.length > 0 && (
        <div className="rounded-lg border border-foreground/12 px-4 py-3">
          <h3 className="text-[12.5px] font-semibold">
            Withheld from {user.name}{" "}
            <span className="font-mono text-[11px] font-normal text-foreground/45">
              {c.blocked.length} higher-ranked match{c.blocked.length === 1 ? "" : "es"}
            </span>
          </h3>
          <ul className="mt-1.5 space-y-1">
            {c.blocked.map((h) => (
              <li key={h.doc.id + h.claim.text.slice(0, 12)} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
                <span className="font-mono text-[10.5px] text-foreground/40">{h.doc.id}</span>
                <span>{h.doc.title}</span>
                <span className="font-mono text-[10.5px] text-foreground/45">
                  {h.doc.source} · needs {h.doc.acl.join(" or ")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/50">
            Named, never quoted. Telling someone a document exists is usually acceptable; telling
            them what it says is the thing that isn&rsquo;t.
          </p>
        </div>
      )}

      <section className="rounded-lg border border-foreground/12 px-4 py-3">
        <h3 className="text-[12.5px] font-semibold">
          Leak rate across every user and every stock question
        </h3>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <span className="font-mono text-[26px] leading-none tabular-nums text-red-700 dark:text-red-400">
            {((rate.leaks / rate.total) * 100).toFixed(0)}%
          </span>
          <span className="text-[12.5px] text-foreground/65">
            {rate.leaks} of {rate.total} answered questions came from a document the asker could not
            open — and all {rate.silent} returned text the permitted path would not have.
          </span>
        </div>
        <ul className="mt-2.5 space-y-1">
          {rate.byUser.map((b) => (
            <li key={b.user.id} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-40 shrink-0 truncate text-foreground/70">
                {b.user.name} <span className="text-foreground/45">· {b.user.title}</span>
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                <span className="block h-full rounded-full bg-red-500/70"
                      style={{ width: `${(b.leaked / Math.max(1, b.asked)) * 100}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right font-mono tabular-nums text-foreground/55">
                {b.leaked} of {b.asked}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] leading-relaxed text-foreground/55">
          It falls with seniority, which is the uncomfortable part: the people most likely to be
          handed an assistant first are the ones it leaks to most.
        </p>
      </section>
    </div>
  );
}

function Panel({ tone, title, sub, text, audit, doc, sensitivity, consulted, flagged }: {
  tone: "good" | "bad"; title: string; sub: string; text: string; audit: string;
  doc: string | null; sensitivity: string | null; consulted: number; flagged: boolean;
}) {
  const border = flagged ? "border-red-600/50" : tone === "good" ? "border-emerald-600/40" : "border-foreground/15";
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${border}`}>
      <div className="text-[12.5px] font-semibold">{title}</div>
      <p className="mt-0.5 text-[11px] leading-snug text-foreground/50">{sub}</p>
      <p className="mt-2 text-[13px] leading-relaxed">{text}</p>
      {doc && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-foreground/15 bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[10.5px]">
            {doc}
          </span>
          {sensitivity && (
            <span className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] ${
              sensitivity === "restricted"
                ? "border-red-600/50 text-red-800 dark:border-red-400/40 dark:text-red-300"
                : "border-foreground/20 text-foreground/50"}`}>
              {sensitivity}
            </span>
          )}
        </div>
      )}
      <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-foreground/45 [overflow-wrap:anywhere]">
        audit: {audit} · {consulted} candidate{consulted === 1 ? "" : "s"} considered
      </p>
    </div>
  );
}
