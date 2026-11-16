"use client";

import type { Ref } from "react";

import { PhotoPicker, type LocalPhoto } from "@/components/photo-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { copy, errorText } from "@/content/copy";
import { CONDITIONS, FAULTS, KEYS, type Condition, type Fault, type Keys } from "@/lib/validation";

export function ConditionStep({
  headingRef,
  condition,
  faults,
  keys,
  photos,
  fieldErrors,
  formError,
  onConditionChange,
  onFaultsChange,
  onKeysChange,
  onPhotosChange,
  onPhotoError,
  onBack,
  onContinue,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  condition: Condition | "";
  faults: Fault[];
  keys: Keys | "";
  photos: LocalPhoto[];
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
  onConditionChange: (value: Condition) => void;
  onFaultsChange: (value: Fault[]) => void;
  onKeysChange: (value: Keys) => void;
  onPhotosChange: (photos: LocalPhoto[]) => void;
  onPhotoError: (message: string | undefined) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const conditionError = fieldErrors.condition ? errorText(fieldErrors.condition) : undefined;
  const faultsError = fieldErrors.faults ? errorText(fieldErrors.faults) : undefined;
  const keysError = fieldErrors.keys ? errorText(fieldErrors.keys) : undefined;

  function toggleFault(fault: Fault, checked: boolean) {
    if (fault === "none") {
      onFaultsChange(checked ? ["none"] : []);
      return;
    }
    const next = faults.filter((item) => item !== "none" && item !== fault);
    onFaultsChange(checked ? [...next, fault] : next);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl tracking-tight outline-none">
          {copy.flow.condition.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.flow.condition.body}</p>
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <fieldset className="grid gap-2" aria-describedby={conditionError ? "condition-error" : undefined}>
        <legend className="text-sm font-medium">{copy.flow.condition.conditionLegend}</legend>
        <RadioGroup
          value={condition}
          onValueChange={(value) => {
            if ((CONDITIONS as readonly string[]).includes(value)) onConditionChange(value as Condition);
          }}
          aria-invalid={conditionError ? true : undefined}
          className="grid gap-2"
        >
          {copy.flow.conditions.map((option) => (
            <label
              key={option.value}
              className={
                condition === option.value
                  ? "flex cursor-pointer items-start gap-3 rounded-xl border border-primary bg-primary/5 px-3 py-3"
                  : "flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-3"
              }
            >
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-sm text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        {conditionError ? (
          <p id="condition-error" role="alert" className="text-sm font-medium text-destructive">
            {conditionError}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-2" aria-describedby={faultsError ? "faults-error" : undefined}>
        <legend className="text-sm font-medium">{copy.flow.condition.faultsLegend}</legend>
        <div className="grid gap-2">
          {copy.flow.faults.map((option) => {
            const checked = faults.includes(option.value as Fault);
            return (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    if ((FAULTS as readonly string[]).includes(option.value)) {
                      toggleFault(option.value as Fault, next);
                    }
                  }}
                  aria-invalid={faultsError ? true : undefined}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        {faultsError ? (
          <p id="faults-error" role="alert" className="text-sm font-medium text-destructive">
            {faultsError}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-2" aria-describedby={keysError ? "keys-error" : undefined}>
        <legend className="text-sm font-medium">{copy.flow.condition.keysLegend}</legend>
        <RadioGroup
          value={keys}
          onValueChange={(value) => {
            if ((KEYS as readonly string[]).includes(value)) onKeysChange(value as Keys);
          }}
          aria-invalid={keysError ? true : undefined}
          className="grid grid-cols-2 gap-2"
        >
          {copy.flow.keys.map((option) => (
            <label
              key={option.value}
              className={
                keys === option.value
                  ? "flex cursor-pointer items-center gap-3 rounded-xl border border-primary bg-primary/5 px-3 py-3 text-sm font-medium"
                  : "flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm font-medium"
              }
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
        {keysError ? (
          <p id="keys-error" role="alert" className="text-sm font-medium text-destructive">
            {keysError}
          </p>
        ) : null}
      </fieldset>

      <PhotoPicker photos={photos} error={fieldErrors.photos ? errorText(fieldErrors.photos) : undefined} onChange={onPhotosChange} onError={onPhotoError} />

      <div className="grid gap-2">
        <Button type="button" className="h-12 w-full text-base" onClick={onContinue}>
          {copy.flow.condition.button}
        </Button>
        <Button type="button" variant="ghost" className="h-11 w-full text-base" onClick={onBack}>
          {copy.flow.condition.back}
        </Button>
      </div>
    </div>
  );
}
