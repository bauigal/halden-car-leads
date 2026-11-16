import type { AppEnv } from "@/lib/env";
import { isEnabled } from "@/lib/env";
import { ConsoleNotifier } from "@/lib/notify/console-notifier";
import { assertEmailConfig, ResendNotifier } from "@/lib/notify/resend-notifier";
import { assertSmsConfig, TwilioNotifier } from "@/lib/notify/twilio-notifier";
import type { LeadNotifier } from "@/lib/notify/types";

/**
 * Console logging is on unless NOTIFIER_LOG=false.
 * Email and SMS/WhatsApp stay off unless their flag is exactly "true"
 * and the matching credentials are present.
 */
export function getNotifiers(env: AppEnv = process.env): LeadNotifier[] {
  const notifiers: LeadNotifier[] = [];
  if (env.NOTIFIER_LOG?.trim().toLowerCase() !== "false") {
    notifiers.push(new ConsoleNotifier());
  }
  if (isEnabled(env.NOTIFIER_EMAIL)) {
    assertEmailConfig(env);
    notifiers.push(new ResendNotifier(env));
  }
  if (isEnabled(env.NOTIFIER_SMS)) {
    assertSmsConfig(env);
    notifiers.push(new TwilioNotifier(env));
  }
  return notifiers;
}
