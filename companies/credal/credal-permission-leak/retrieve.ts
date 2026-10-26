/**
 * Two retrieval paths over one corpus.
 *
 * The only difference between them is whether the asker's access is consulted
 * before ranking. That is the whole experiment: same question, same scoring,
 * same corpus — and an answer that is correct, useful, and one the asker had
 * no right to.
 *
 * There is no model here. The answer is the highest-scoring planted claim,
 * which keeps the demonstration deterministic and means nothing on screen
 * depends on a generation step behaving.
 */

import { DOCS, USERS, type Doc, type Claim, type Group, type User } from "./corpus";

const STOP = new Set(["the","a","an","is","are","do","does","what","how","much","many","my","i","we","our","of","to","in","for","on","with","and","or","be","can","should","if","it","that","this","there","get","got"]);

export const tokenise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

export type Hit = {
  doc: Doc;
  claim: Claim;
  score: number;
  /** Whether the asking user can actually open this document. */
  permitted: boolean;
};

/** Keyword overlap, with a small bonus for matching more than one term. */
function scoreClaim(words: string[], claim: Claim): number {
  let hits = 0;
  for (const w of words) {
    if (claim.keywords.includes(w)) hits += 2;
    else if (claim.keywords.some((k) => k.startsWith(w) || w.startsWith(k))) hits += 1;
  }
  return hits === 0 ? 0 : hits + (hits > 2 ? 1 : 0);
}

export const canRead = (user: User, doc: Doc) => doc.acl.some((g: Group) => user.groups.includes(g));

export function rank(question: string, user: User): Hit[] {
  const words = tokenise(question);
  const hits: Hit[] = [];
  for (const doc of DOCS) {
    for (const claim of doc.claims) {
      const score = scoreClaim(words, claim);
      if (score > 0) hits.push({ doc, claim, score, permitted: canRead(user, doc) });
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id));
}

export type Answer = {
  /** Null when nothing the path could see matched. */
  hit: Hit | null;
  text: string;
  /** The line this path would write to an audit log. */
  audit: string;
  consulted: number;
};

export function answerUnfiltered(question: string, user: User): Answer {
  const hits = rank(question, user);
  const top = hits[0] ?? null;
  return {
    hit: top,
    text: top ? top.claim.text : "No matching source found.",
    audit: top
      ? `answered from ${top.doc.id} "${top.doc.title}" (${top.doc.sensitivity}) — access not checked`
      : "no source matched",
    consulted: hits.length,
  };
}

export function answerFiltered(question: string, user: User): Answer {
  const all = rank(question, user);
  const visible = all.filter((h) => h.permitted);
  const top = visible[0] ?? null;
  const blocked = all.filter((h) => !h.permitted);
  return {
    hit: top,
    text: top
      ? top.claim.text
      : blocked.length > 0
        ? "No accessible source answers this. Higher-ranked matches exist in documents you do not have access to."
        : "No matching source found.",
    audit: top
      ? `answered from ${top.doc.id} "${top.doc.title}" — ${user.name} has access via ${top.doc.acl.filter((g) => user.groups.includes(g)).join(", ")}`
      : blocked.length > 0
        ? `withheld — ${blocked.length} higher-ranked match${blocked.length === 1 ? "" : "es"} in documents outside ${user.name}'s access`
        : "no source matched",
    consulted: visible.length,
  };
}

export type Comparison = {
  question: string;
  user: User;
  unfiltered: Answer;
  filtered: Answer;
  /**
   * A leak is not "the answers differ" — it is specifically that the
   * unfiltered path answered from something the asker cannot open. That
   * distinction matters: two paths can differ harmlessly.
   */
  leaked: boolean;
  blocked: Hit[];
};

export function compare(question: string, user: User): Comparison {
  const unfiltered = answerUnfiltered(question, user);
  const filtered = answerFiltered(question, user);
  return {
    question, user, unfiltered, filtered,
    leaked: Boolean(unfiltered.hit && !unfiltered.hit.permitted),
    blocked: rank(question, user).filter((h) => !h.permitted),
  };
}

export type LeakRate = {
  total: number;
  leaks: number;
  /** Leaks where the two paths returned different text — the ones a reader would notice. */
  silent: number;
  byUser: { user: User; asked: number; leaked: number }[];
};

/** The rate across every user and every stock question — the number nobody publishes. */
export function leakRate(questions: string[]): LeakRate {
  let total = 0, leaks = 0, silent = 0;
  const byUser = USERS.map((user) => {
    let asked = 0, leaked = 0;
    for (const q of questions) {
      const c = compare(q, user);
      if (!c.unfiltered.hit) continue;
      asked++; total++;
      if (c.leaked) {
        leaked++; leaks++;
        // The dangerous case: the leaked answer reads as a perfectly good one.
        if (c.unfiltered.text !== c.filtered.text) silent++;
      }
    }
    return { user, asked, leaked };
  });
  return { total, leaks, silent, byUser };
}
