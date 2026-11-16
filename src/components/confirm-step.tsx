"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/button";
import { VehicleFacts } from "@/components/vehicle-facts";
import { copy } from "@/content/copy";
import type { VehicleDetails } from "@/lib/vrm/types";

export function ConfirmStep({
  headingRef,
  vehicle,
  mileage,
  onConfirm,
  onReject,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  vehicle: VehicleDetails;
  mileage: number;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl tracking-tight outline-none">
          {copy.flow.confirm.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.flow.confirm.body}</p>
      </div>
      <VehicleFacts vehicle={vehicle} mileage={mileage} />
      <div className="grid gap-2">
        <Button type="button" className="h-12 w-full text-base" onClick={onConfirm}>
          {copy.flow.confirm.yes}
        </Button>
        <Button type="button" variant="outline" className="h-11 w-full text-base" onClick={onReject}>
          {copy.flow.confirm.no}
        </Button>
      </div>
    </div>
  );
}
