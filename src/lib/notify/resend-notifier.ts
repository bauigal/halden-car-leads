import type { AppEnv } from "@/lib/env";
import { NotifierConfigError, type LeadNotification, type LeadNotifier } from "@/lib/notify/types";
import { renderLeadText } from "@/lib/notify/text";

type FetchLike = typeof fetch;

export type OutboundRequest = {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
};

/**
 * Resend email stub. Off unless NOTIFIER_EMAIL=true.
 * Required when enabled: RESEND_API_KEY, RESEND_FROM_EMAIL, LEAD_NOTIFY_EMAIL.
 * The message goes to the buying desk, not the customer.
 */
export function assertEmailConfig(env: AppEnv): void {
  if (!env.RESEND_API_KEY?.trim() || !env.RESEND_FROM_EMAIL?.trim() || !env.LEAD_NOTIFY_EMAIL?.trim()) {
    throw new NotifierConfigError("email");
  }
}

export function buildResendRequest(env: AppEnv, lead: LeadNotification): OutboundRequest {
  return {
    url: "https://api.resend.com/emails",
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [env.LEAD_NOTIFY_EMAIL],
      subject: `Valuation request ${lead.reference}`,
      text: renderLeadText(lead),
    }),
  };
}

export class ResendNotifier implements LeadNotifier {
  readonly id = "email";

  constructor(
    private readonly env: AppEnv,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async notify(lead: LeadNotification): Promise<void> {
    const request = buildResendRequest(this.env, lead);
    const response = await this.fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    if (!response.ok) throw new Error("Resend request failed");
  }
}
