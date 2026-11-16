"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/button";
import { VehicleFacts } from "@/components/vehicle-facts";
import { copy } from "@/content/copy";
import type { VehicleDetails } from "@/lib/vrm/types";

export function SuccessStep({
  headingRef,
  reference,
  vehicle,
  mileage,
  photoCount,
  onAgain,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  reference: string;
  vehicle: VehicleDetails;
  mileage: number;
  photoCount: number;
  onAgain: () => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-sm font-medium tracking-[0.14em] text-primary uppercase">{copy.brand}</p>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl tracking-tight outline-none">
          {copy.flow.success.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.flow.success.body}</p>
      </div>
      <div className="rounded-2xl bg-[#f4c400] px-4 py-5 text-[#1a160f]">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase">{copy.flow.success.referenceLabel}</p>
        <p className="mt-1 font-mono text-3xl tracking-[0.04em]">{reference}</p>
      </div>
      <VehicleFacts vehicle={vehicle} mileage={mileage} />
      <p className="text-sm text-muted-foreground">
        {photoCount === 0
          ? copy.flow.success.photosNone
          : photoCount === 1
            ? copy.flow.success.photosOne
            : `${photoCount} ${copy.flow.success.photosMany}`}
      </p>
      <Button type="button" className="h-12 w-full text-base" onClick={onAgain}>
        {copy.flow.success.again}
      </Button>
    </div>
  );
}
