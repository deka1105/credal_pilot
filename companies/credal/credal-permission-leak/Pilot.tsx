import { DemoBanner } from "@/lib/app-shell";
import { DEMO_NOTE } from "./corpus";
import { Harness } from "./Harness";

/**
 * Permission leak harness — Credal P-1.
 *
 * Stateless and client-side. Two retrieval paths over one corpus; the only
 * difference is whether the asker's access is consulted before ranking.
 */
export default function PermissionLeakPilot() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
      <DemoBanner>{DEMO_NOTE}</DemoBanner>

      <h1 className="text-lg font-semibold tracking-tight">
        The assistant answered correctly. It shouldn&rsquo;t have been able to.
      </h1>
      <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-foreground/65">
        A permission leak through an AI assistant produces no error. The answer is accurate,
        useful, and drawn from a document the person asking could never have opened — which is
        exactly why nobody notices. Ask the same question as four different people and watch it
        happen, then watch inherited permissions stop it.
      </p>

      <div className="mt-6">
        <Harness />
      </div>
    </div>
  );
}
