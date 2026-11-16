"use client";

import type { Ref } from "react";

import type { LocalPhoto } from "@/components/photo-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy, errorText } from "@/content/copy";
import { contactStepSchema, fieldErrorMap } from "@/lib/validation";
import type { VehicleDetails } from "@/lib/vrm/types";
import type { Condition, Fault, Keys } from "@/lib/validation";

export function ContactStep({
  headingRef,
  action,
  pending,
  vehicle,
  mileage,
  condition,
  faults,
  keys,
  photos,
  name,
  phone,
  email,
  fieldErrors,
  formError,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onEdit,
  onBack,
  onInvalid,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  action: (formData: FormData) => void;
  pending: boolean;
  vehicle: VehicleDetails;
  mileage: number;
  condition: Condition;
  faults: Fault[];
  keys: Keys;
  photos: LocalPhoto[];
  name: string;
  phone: string;
  email: string;
  fieldErrors: Partial<Record<string, string>>;
  formError?: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEdit: () => void;
  onBack: () => void;
  onInvalid: (fields: Partial<Record<string, string>>) => void;
}) {
  const photoMeta = photos.map(({ name: photoName, type, size }) => ({ name: photoName, type, size }));

  return (
    <form
      action={action}
      aria-busy={pending}
      className="grid gap-5"
      onSubmit={(event) => {
        const parsed = contactStepSchema.safeParse({ name, phone, email });
        if (!parsed.success) {
          event.preventDefault();
          onInvalid(fieldErrorMap(parsed.error));
        }
      }}
    >
      <div className="grid gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl tracking-tight outline-none">
          {copy.flow.contact.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.flow.contact.body}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-3">
        <p className="text-sm">
          <span className="block text-muted-foreground">{copy.flow.contact.summaryLabel}</span>
          <span className="font-medium">
            {vehicle.vrm} · {vehicle.make} {vehicle.model}
          </span>
        </p>
        <button type="button" className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={onEdit}>
          {copy.flow.contact.edit}
        </button>
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <input type="hidden" name="vrm" value={vehicle.vrm} />
      <input type="hidden" name="mileage" value={String(mileage)} />
      <input type="hidden" name="condition" value={condition} />
      <input type="hidden" name="faults" value={faults.join(",")} />
      <input type="hidden" name="keys" value={keys} />
      <input type="hidden" name="photos" value={JSON.stringify(photoMeta)} />

      <Field id="name" label={copy.flow.contact.nameLabel} error={fieldErrors.name} autoComplete="name" value={name} onChange={onNameChange} />
      <Field
        id="phone"
        label={copy.flow.contact.phoneLabel}
        hint={copy.flow.contact.phoneHint}
        error={fieldErrors.phone}
        autoComplete="tel"
        inputMode="tel"
        value={phone}
        onChange={onPhoneChange}
      />
      <Field
        id="email"
        label={copy.flow.contact.emailLabel}
        error={fieldErrors.email}
        autoComplete="email"
        inputMode="email"
        type="email"
        value={email}
        onChange={onEmailChange}
      />

      <p className="text-sm text-muted-foreground">{copy.flow.contact.note}</p>

      <div className="grid gap-2">
        <Button type="submit" disabled={pending} className="h-12 w-full text-base">
          {pending ? copy.flow.contact.pending : copy.flow.contact.button}
        </Button>
        <Button type="button" variant="ghost" className="h-11 w-full text-base" onClick={onBack} disabled={pending}>
          {copy.flow.contact.back}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  autoComplete,
  inputMode,
  type = "text",
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputMode?: "tel" | "email";
  type?: string;
}) {
  const message = error ? errorText(error) : undefined;
  const describedBy = [hint ? `${id}-hint` : undefined, message ? `${id}-error` : undefined].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={id === "email" ? 254 : id === "phone" ? 20 : 80}
        aria-invalid={message ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
