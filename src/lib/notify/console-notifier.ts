import type { LeadNotification, LeadNotifier } from "@/lib/notify/types";

export class ConsoleNotifier implements LeadNotifier {
  readonly id = "log";

  constructor(private readonly write: (line: string) => void = (line) => console.info(line)) {}

  async notify(lead: LeadNotification): Promise<void> {
    this.write(`[halden] valuation request ${lead.reference}\n${JSON.stringify(lead, null, 2)}`);
  }
}
