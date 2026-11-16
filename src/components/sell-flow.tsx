"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitLead } from "@/app/actions/submit-lead";
import { ConditionStep } from "@/components/condition-step";
import { ConfirmStep } from "@/components/confirm-step";
import { ContactStep } from "@/components/contact-step";
import { revokePhotos, type LocalPhoto } from "@/components/photo-picker";
import { PlateStep } from "@/components/plate-step";
import { StepIndicator, type FlowStep } from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { SuccessStep } from "@/components/success-step";
import { copy, errorText } from "@/content/copy";
import { idleLeadResult, type LeadResult } from "@/lib/lead-result";
import { conditionStepSchema, fieldErrorMap, plateStepSchema, type Condition, type Fault, type Keys } from "@/lib/validation";
import type { VehicleDetails } from "@/lib/vrm/types";

type LookupJson =
  | { ok: true; found: true; vehicle: VehicleDetails }
  | { ok: true; found: false; code?: string }
  | { ok: false; code?: string };

export function SellFlow() {
  const [step, setStep] = useState<FlowStep>("plate");
  const [vrm, setVrm] = useState("");
  const [mileage, setMileage] = useState("");
  const [mileageMiles, setMileageMiles] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [condition, setCondition] = useState<Condition | "">("");
  const [faults, setFaults] = useState<Fault[]>([]);
  const [keys, setKeys] = useState<Keys | "">("");
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingLookup, setPendingLookup] = useState(false);
  const [dismissedReference, setDismissedReference] = useState<string | null>(null);
  const [clearedServerFields, setClearedServerFields] = useState<{ result: LeadResult; fields: string[] } | null>(null);
  const [state, action, pending] = useActionState(submitLead, idleLeadResult);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef(0);
  const mounted = useRef(false);

  const receipt = state.status === "success" && state.reference !== dismissedReference ? state : null;
  const serverError = !pending && state.status === "error" ? state : null;
  const clearedFields = clearedServerFields?.result === state ? clearedServerFields.fields : [];
  const serverFields: Partial<Record<string, string>> = { ...(serverError?.fieldErrors ?? {}) };
  for (const field of clearedFields) delete serverFields[field];
  const displayErrors: Partial<Record<string, string>> = { ...serverFields };
  for (const [field, code] of Object.entries(fieldErrors)) {
    if (code) displayErrors[field] = code;
    else delete displayErrors[field];
  }
  const serverHasFields = Object.keys(serverError?.fieldErrors ?? {}).length > 0;
  const jumpTarget: FlowStep | null =
    displayErrors.vrm || displayErrors.mileage
      ? "plate"
      : displayErrors.condition || displayErrors.faults || displayErrors.keys || displayErrors.photos
        ? "condition"
        : null;
  const banner =
    formError ??
    (serverError
      ? Object.keys(serverFields).length > 0
        ? jumpTarget && jumpTarget !== step
          ? errorText(serverError.code)
          : copy.flow.review
        : serverHasFields
          ? undefined
          : errorText(serverError.code)
      : undefined);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step, receipt]);

  function forget(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
    setClearedServerFields((current) => {
      const fields = current?.result === state ? current.fields : [];
      if (fields.includes(field)) return current?.result === state ? current : { result: state, fields };
      return { result: state, fields: [...fields, field] };
    });
  }

  async function findCar() {
    const parsed = plateStepSchema.safeParse({ vrm, mileage });
    if (!parsed.success) {
      setFieldErrors(fieldErrorMap(parsed.error));
      setFormError(undefined);
      return;
    }

    const requestId = ++requestRef.current;
    setPendingLookup(true);
    setFormError(undefined);
    setFieldErrors({});

    try {
      const response = await fetch("/api/vrm", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: parsed.data.vrm }),
      });
      const body = (await response.json()) as LookupJson;
      if (requestId !== requestRef.current) return;
      if (body.ok && body.found) {
        setVehicle(body.vehicle);
        setMileageMiles(parsed.data.mileage);
        setVrm(body.vehicle.vrm);
        setStep("confirm");
        return;
      }
      const code = "code" in body ? body.code : "provider_unavailable";
      if (code === "vrm_invalid" || code === "vrm_required") {
        setFieldErrors({ vrm: code });
        setFormError(undefined);
      } else {
        setFormError(errorText(code));
      }
    } catch {
      if (requestId !== requestRef.current) return;
      setFormError(errorText("provider_unavailable"));
    } finally {
      if (requestId === requestRef.current) setPendingLookup(false);
    }
  }

  function continueFromCondition() {
    const parsed = conditionStepSchema.safeParse({
      condition,
      faults,
      keys,
      photos: photos.map(({ name: photoName, type, size }) => ({ name: photoName, type, size })),
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorMap(parsed.error));
      setFormError(copy.flow.review);
      return;
    }
    setCondition(parsed.data.condition);
    setFaults(parsed.data.faults);
    setKeys(parsed.data.keys);
    setFieldErrors({});
    setFormError(undefined);
    setStep("contact");
  }

  function reset() {
    revokePhotos(photos);
    if (state.status === "success") setDismissedReference(state.reference);
    setStep("plate");
    setVrm("");
    setMileage("");
    setMileageMiles(null);
    setVehicle(null);
    setCondition("");
    setFaults([]);
    setKeys("");
    setPhotos([]);
    setName("");
    setPhone("");
    setEmail("");
    setFieldErrors({});
    setFormError(undefined);
  }

  return (
    <section id="valuation" className="rounded-[1.6rem] border border-border bg-card p-4 shadow-[0_24px_70px_-40px_rgba(28,25,21,0.65)] sm:p-6">
      {receipt ? (
        <SuccessStep
          headingRef={headingRef}
          reference={receipt.reference}
          vehicle={receipt.vehicle}
          mileage={receipt.mileage}
          photoCount={receipt.photoCount}
          onAgain={reset}
        />
      ) : (
        <div className="grid gap-6">
          <StepIndicator current={step} />
          {jumpTarget && jumpTarget !== step ? (
            <Button type="button" variant="outline" className="h-11 w-full text-base" onClick={() => setStep(jumpTarget)}>
              {jumpTarget === "plate" ? copy.flow.checkPlate : copy.flow.checkCondition}
            </Button>
          ) : null}
          {step === "plate" ? (
            <PlateStep
              headingRef={headingRef}
              vrm={vrm}
              mileage={mileage}
              fieldErrors={displayErrors}
              formError={banner}
              pending={pendingLookup}
              onVrmChange={(value) => {
                setVrm(value);
                forget("vrm");
              }}
              onMileageChange={(value) => {
                setMileage(value);
                forget("mileage");
              }}
              onSubmit={() => void findCar()}
            />
          ) : null}
          {step === "confirm" && vehicle && mileageMiles !== null ? (
            <ConfirmStep
              headingRef={headingRef}
              vehicle={vehicle}
              mileage={mileageMiles}
              onConfirm={() => setStep("condition")}
              onReject={() => setStep("plate")}
            />
          ) : null}
          {step === "condition" ? (
            <ConditionStep
              headingRef={headingRef}
              condition={condition}
              faults={faults}
              keys={keys}
              photos={photos}
              fieldErrors={displayErrors}
              formError={banner}
              onConditionChange={(value) => {
                setCondition(value);
                forget("condition");
              }}
              onFaultsChange={(value) => {
                setFaults(value);
                forget("faults");
              }}
              onKeysChange={(value) => {
                setKeys(value);
                forget("keys");
              }}
              onPhotosChange={setPhotos}
              onPhotoError={(code) => setFieldErrors((current) => ({ ...current, photos: code }))}
              onBack={() => setStep("confirm")}
              onContinue={continueFromCondition}
            />
          ) : null}
          {step === "contact" && vehicle && mileageMiles !== null && condition && keys ? (
            <ContactStep
              headingRef={headingRef}
              action={action}
              pending={pending}
              vehicle={vehicle}
              mileage={mileageMiles}
              condition={condition}
              faults={faults}
              keys={keys}
              photos={photos}
              name={name}
              phone={phone}
              email={email}
              fieldErrors={displayErrors}
              formError={banner}
              onNameChange={(value) => {
                setName(value);
                forget("name");
              }}
              onPhoneChange={(value) => {
                setPhone(value);
                forget("phone");
              }}
              onEmailChange={(value) => {
                setEmail(value);
                forget("email");
              }}
              onEdit={() => setStep("confirm")}
              onBack={() => setStep("condition")}
              onInvalid={(fields) => {
                setFieldErrors(fields);
                setFormError(copy.flow.review);
              }}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
