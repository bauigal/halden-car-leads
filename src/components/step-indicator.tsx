import { copy } from "@/content/copy";

const STEP_IDS = ["plate", "confirm", "condition", "contact"] as const;
export type FlowStep = (typeof STEP_IDS)[number];

export function stepIndex(step: FlowStep): number {
  return STEP_IDS.indexOf(step);
}

export function StepIndicator({ current }: { current: FlowStep }) {
  const active = stepIndex(current);

  return (
    <ol aria-label={copy.flow.progressLabel} className="grid grid-cols-4 gap-2">
      {copy.flow.steps.map((step, index) => {
        const state = index < active ? "done" : index === active ? "current" : "upcoming";
        return (
          <li key={step.id} aria-current={state === "current" ? "step" : undefined} className="grid justify-items-center gap-1.5 text-center">
            <span
              className={
                state === "upcoming"
                  ? "flex size-7 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground"
                  : "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              }
            >
              {state === "done" ? (
                <span aria-hidden="true">✓</span>
              ) : (
                index + 1
              )}
              {state === "done" ? <span className="sr-only">Completed. </span> : null}
            </span>
            <span className={state === "upcoming" ? "text-[11px] leading-tight text-muted-foreground sm:text-xs" : "text-[11px] leading-tight font-medium sm:text-xs"}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
