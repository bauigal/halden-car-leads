"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy, errorText } from "@/content/copy";
import { formatVrm, isValidVrm, normaliseVrm } from "@/lib/plates";

export function PlateStep({
  headingRef,
  vrm,
  mileage,
  fieldErrors,
  formError,
  pending,
  onVrmChange,
  onMileageChange,
  onSubmit,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  vrm: string;
  mileage: string;
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
  pending: boolean;
  onVrmChange: (value: string) => void;
  onMileageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const vrmError = errorTextOrUndefined(fieldErrors.vrm);
  const mileageError = errorTextOrUndefined(fieldErrors.mileage);
  const chips = copy.demoPlates.filter((plate) => plate.chip);

  return (
    <form
      className="grid gap-5"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-2">
        <h2 id="valuation-heading" ref={headingRef} tabIndex={-1} className="font-display text-3xl tracking-tight outline-none">
          {copy.flow.plate.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.flow.plate.body}</p>
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="vrm">{copy.flow.plate.vrmLabel}</Label>
        <div className="flex overflow-hidden rounded-xl border border-black/15 shadow-sm focus-within:ring-3 focus-within:ring-ring/50">
          <div aria-hidden="true" className="flex w-11 flex-col items-center justify-center bg-[#163e73] text-[10px] font-semibold tracking-widest text-white">
            UK
          </div>
          <Input
            id="vrm"
            name="vrm"
            value={vrm}
            onChange={(event) => {
              const normalised = normaliseVrm(event.target.value);
              onVrmChange(isValidVrm(normalised) ? formatVrm(normalised) : normalised);
            }}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={14}
            placeholder="OV19 HRL"
            aria-invalid={vrmError ? true : undefined}
            aria-describedby={vrmError ? "vrm-error vrm-hint" : "vrm-hint"}
            className="h-14 rounded-none border-0 bg-[#f4c400] px-3 text-center text-2xl font-semibold tracking-[0.14em] text-[#1a160f] uppercase shadow-none placeholder:text-[#1a160f]/45 focus-visible:ring-0 md:text-2xl"
          />
        </div>
        <p id="vrm-hint" className="text-sm text-muted-foreground">
          {copy.flow.plate.vrmHint}
        </p>
        {vrmError ? (
          <p id="vrm-error" role="alert" className="text-sm font-medium text-destructive">
            {vrmError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">{copy.flow.plate.demoLabel}</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((plate) => (
            <button
              key={plate.vrm}
              type="button"
              aria-pressed={normaliseVrm(vrm) === normaliseVrm(plate.vrm)}
              className="cursor-pointer rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium tracking-wide focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              onClick={() => onVrmChange(plate.vrm)}
            >
              {plate.vrm}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="mileage">{copy.flow.plate.mileageLabel}</Label>
        <div className="relative">
          <Input
            id="mileage"
            name="mileage"
            inputMode="numeric"
            autoComplete="off"
            value={mileage}
            maxLength={9}
            placeholder="48,000"
            aria-invalid={mileageError ? true : undefined}
            aria-describedby={mileageError ? "mileage-error" : undefined}
            onChange={(event) => onMileageChange(event.target.value)}
            className="pr-16"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            {copy.flow.plate.mileageSuffix}
          </span>
        </div>
        {mileageError ? (
          <p id="mileage-error" role="alert" className="text-sm font-medium text-destructive">
            {mileageError}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? copy.flow.plate.pending : copy.flow.plate.button}
      </Button>
    </form>
  );
}

function errorTextOrUndefined(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return errorText(code);
}
