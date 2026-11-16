"use server";

import { createLead } from "@/lib/lead";
import { idleLeadResult, type LeadResult } from "@/lib/lead-result";
import { formDataToInput } from "@/lib/validation";

export async function submitLead(_previous: LeadResult = idleLeadResult, formData: FormData): Promise<LeadResult> {
  try {
    return await createLead(formDataToInput(formData));
  } catch {
    console.error("[halden] lead submission failed");
    return { status: "error", code: "submit_failed" };
  }
}
