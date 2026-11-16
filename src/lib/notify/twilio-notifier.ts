import type { AppEnv } from "@/lib/env";
import { NotifierConfigError, type LeadNotification, type LeadNotifier } from "@/lib/notify/types";
import { renderLeadText } from "@/lib/notify/text";
import type { OutboundRequest } from "@/lib/notify/resend-notifier";

type FetchLike = typeof fetch;

/**
 * Twilio SMS / WhatsApp stub. Off unless NOTIFIER_SMS=true.
 * Required when enabled: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_FROM_NUMBER, LEAD_NOTIFY_PHONE.
 * Set TWILIO_CHANNEL=whatsapp to prefix both numbers with `whatsapp:`.
 * Numbers should be E.164, for example +447700900123.
 * The message goes to the buying desk, not the customer.
 */
export function assertSmsConfig(env: AppEnv): void {
  if (
    !env.TWILIO_ACCOUNT_SID?.trim() ||
    !env.TWILIO_AUTH_TOKEN?.trim() ||
    !env.TWILIO_FROM_NUMBER?.trim() ||
    !env.LEAD_NOTIFY_PHONE?.trim()
  ) {
    throw new NotifierConfigError("sms");
  }
}

export function prefixChannel(channel: "sms" | "whatsapp", phone: string): string {
  const trimmed = phone.trim();
  if (channel === "sms") return trimmed.replace(/^whatsapp:/, "");
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

export function buildTwilioRequest(env: AppEnv, lead: LeadNotification): OutboundRequest {
  const sid = env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const token = env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const channel = env.TWILIO_CHANNEL?.trim().toLowerCase() === "whatsapp" ? "whatsapp" : "sms";
  const body = new URLSearchParams({
    To: prefixChannel(channel, env.LEAD_NOTIFY_PHONE ?? ""),
    From: prefixChannel(channel, env.TWILIO_FROM_NUMBER ?? ""),
    Body: renderLeadText(lead),
  });

  return {
    url: `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  };
}

export class TwilioNotifier implements LeadNotifier {
  readonly id = "sms";

  constructor(
    private readonly env: AppEnv,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async notify(lead: LeadNotification): Promise<void> {
    const request = buildTwilioRequest(this.env, lead);
    const response = await this.fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    if (!response.ok) throw new Error("Twilio request failed");
  }
}
