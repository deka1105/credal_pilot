import type { ComponentType } from "react";

/**
 * The pilots built for Credal.
 *
 * Extracted from the pilot factory; each entry points at a folder under
 * `companies/credal/`. Adding one by hand means creating that folder and
 * appending here, exactly as in the source repo.
 */
export type Pilot = {
  slug: string;
  title: string;
  company: string;
  useCase: string;
  demo: string;
  built: string;
  tier: "eval" | "outreach";
  load: () => Promise<{ default: ComponentType }>;
};

export const pilots: Pilot[] = [
  {
    slug: "credal-permission-leak",
    title: "Permission leak harness",
    company: "credal",
    useCase: "UC-1",
    demo: "A support rep asks what the severance package is and the assistant answers correctly, from an HR document she cannot open. Across four users and eight questions, 31% of answers come from a document the asker had no access to — and every one of them reads like a good answer.",
    built: "2026-10-25",
    tier: "eval",
    load: () => import("@companies/credal/credal-permission-leak/Pilot"),
  },
];

export function getPilot(slug: string): Pilot | undefined {
  return pilots.find((p) => p.slug === slug);
}
