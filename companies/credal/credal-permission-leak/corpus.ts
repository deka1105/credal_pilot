/**
 * A small enterprise corpus with a real permission model.
 *
 * Every document carries an ACL and every user carries group memberships,
 * because the whole demonstration depends on the two being checked against
 * each other — or not. The documents are written so that the restricted ones
 * answer ordinary-sounding questions well: a leak is only interesting when the
 * leaked answer is the one the asker wanted.
 */

export type Group = "everyone" | "engineering" | "support" | "hr" | "legal" | "finance" | "exec";

export type Claim = {
  /** Words that make this claim the right answer to a question. */
  keywords: string[];
  text: string;
};

export type Doc = {
  id: string;
  title: string;
  source: "Confluence" | "Google Drive" | "Slack" | "Salesforce" | "Notion";
  /** Groups that can open it. A document readable by `everyone` is public internally. */
  acl: Group[];
  sensitivity: "public" | "internal" | "restricted";
  claims: Claim[];
};

export type User = {
  id: string;
  name: string;
  title: string;
  groups: Group[];
};

export const USERS: User[] = [
  { id: "u1", name: "Priya R.", title: "Support Specialist", groups: ["everyone", "support"] },
  { id: "u2", name: "Dan O.", title: "Backend Engineer", groups: ["everyone", "engineering"] },
  { id: "u3", name: "Marcus H.", title: "People Partner", groups: ["everyone", "hr"] },
  { id: "u4", name: "Sofia L.", title: "VP Finance", groups: ["everyone", "finance", "exec"] },
];

export const DOCS: Doc[] = [
  {
    id: "d1", title: "Employee Handbook 2026", source: "Confluence",
    acl: ["everyone"], sensitivity: "public",
    claims: [
      { keywords: ["holiday", "holidays", "pto", "vacation", "leave", "days", "off"], text: "Employees accrue 25 days of paid leave per year, plus public holidays." },
      { keywords: ["expense", "expenses", "reimburse", "reimbursement", "claim"], text: "Expenses under $100 are auto-approved; anything above needs manager sign-off in Ramp." },
    ],
  },
  {
    id: "d2", title: "Support Escalation Runbook", source: "Notion",
    acl: ["everyone", "support", "engineering"], sensitivity: "internal",
    claims: [
      { keywords: ["escalate", "escalation", "p1", "incident", "outage", "severity"], text: "A P1 is any outage affecting more than 5% of accounts; page the on-call engineer and open an incident channel within 10 minutes." },
      { keywords: ["refund", "refunds", "credit", "goodwill"], text: "Support can issue goodwill credits up to $500 without approval; above that, route to the account owner." },
    ],
  },
  {
    id: "d3", title: "Severance & Exit Policy", source: "Google Drive",
    acl: ["hr", "exec"], sensitivity: "restricted",
    claims: [
      { keywords: ["severance", "exit", "termination", "laid", "layoff", "redundancy", "notice"], text: "Standard severance is 8 weeks' base pay plus 2 weeks per completed year of service, capped at 26 weeks. Equity accelerates 12 months on a without-cause exit." },
      { keywords: ["pip", "performance", "improvement", "plan"], text: "A performance improvement plan runs 60 days with weekly written check-ins; HR must be present at the opening conversation." },
    ],
  },
  {
    id: "d4", title: "Compensation Bands — Engineering", source: "Google Drive",
    acl: ["hr", "exec"], sensitivity: "restricted",
    claims: [
      { keywords: ["salary", "band", "bands", "compensation", "comp", "pay", "range", "offer"], text: "L4 engineering base band is $165k–$195k; L5 is $195k–$240k. Offers above band midpoint need VP approval." },
    ],
  },
  {
    id: "d5", title: "Board Deck — Q3 2026", source: "Google Drive",
    acl: ["exec", "finance"], sensitivity: "restricted",
    claims: [
      { keywords: ["runway", "burn", "cash", "months", "funding", "raise"], text: "Net burn is $1.1M per month against $26M cash, giving 23 months of runway. A Series B process opens in Q1." },
      { keywords: ["churn", "retention", "nrr", "logo"], text: "Gross logo churn was 4.1% in Q3; net revenue retention is 118%." },
    ],
  },
  {
    id: "d6", title: "Acme Corp — Litigation Status", source: "Confluence",
    acl: ["legal", "exec"], sensitivity: "restricted",
    claims: [
      { keywords: ["acme", "lawsuit", "litigation", "dispute", "claim", "settle", "settlement"], text: "The Acme dispute is in mediation; reserve set at $750k. Do not discuss status with the customer directly." },
    ],
  },
  {
    id: "d7", title: "Production Architecture Overview", source: "Confluence",
    acl: ["everyone", "engineering"], sensitivity: "internal",
    claims: [
      { keywords: ["architecture", "database", "postgres", "service", "services", "deploy", "stack"], text: "Primary store is Postgres on RDS with read replicas in two regions; services deploy via ECS behind an ALB." },
    ],
  },
  {
    id: "d8", title: "#deals — Slack export", source: "Slack",
    acl: ["everyone", "finance", "exec"], sensitivity: "internal",
    claims: [
      { keywords: ["pipeline", "deal", "deals", "quarter", "forecast", "close"], text: "Q4 commit is $2.4M with $900k in best case; the Zenith renewal is the largest single line at $410k." },
    ],
  },
];

export const QUESTIONS = [
  "What is the standard severance package?",
  "What is the salary band for an L5 engineer?",
  "How much runway do we have?",
  "What is the status of the Acme lawsuit?",
  "How many holiday days do I get?",
  "When should I escalate something as a P1?",
  "How big a refund can I issue without approval?",
  "What database does production run on?",
];

export const DEMO_NOTE =
  "This company, its documents, its people and its permission model are invented for the demo — no Credal account, connector or customer data is involved. The retrieval and the permission check are real: both paths below run the same scoring function over the same corpus by the rules in retrieve.ts, and the only difference between them is whether the asker's access is consulted.";
