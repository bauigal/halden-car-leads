import { describe, expect, it, vi } from "vitest";

import { createLead, createReference } from "@/lib/lead";
import { ConsoleNotifier } from "@/lib/notify/console-notifier";
import { getNotifiers } from "@/lib/notify/get-notifiers";
import { NotifierConfigError, type LeadNotification, type LeadNotifier } from "@/lib/notify/types";
import { buildResendRequest } from "@/lib/notify/resend-notifier";
import { buildTwilioRequest } from "@/lib/notify/twilio-notifier";
import { NoopPhotoStore } from "@/lib/photos";
import { MockVrmProvider } from "@/lib/vrm/mock-provider";

const validLead = {
  vrm: "OV19 HRL",
  mileage: "12500",
  condition: "good",
  faults: ["none"],
  keys: "two_or_more",
  name: "Ada Lovelace",
  phone: "07700 900123",
  email: "ada@example.com",
  photos: [{ name: "front.jpg", type: "image/jpeg", size: 2048 }],
};

function recorder() {
  const leads: LeadNotification[] = [];
  const notifier: LeadNotifier = {
    id: "test",
    notify: async (lead) => {
      leads.push(lead);
    },
  };
  return { notifier, leads };
}

describe("lead submission", () => {
  it("validates, re-reads the car, and notifies with photo metadata only", async () => {
    const { notifier, leads } = recorder();
    const result = await createLead(validLead, {
      provider: new MockVrmProvider(),
      notifiers: [notifier],
      photoStore: new NoopPhotoStore(),
      now: () => new Date("2026-11-16T12:00:00.000Z"),
      reference: () => "HLD-TEST",
    });

    expect(result).toMatchObject({
      status: "success",
      reference: "HLD-TEST",
      mileage: 12500,
      photoCount: 1,
      vehicle: { make: "Volvo", model: "XC40" },
    });
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      reference: "HLD-TEST",
      photoStorage: "noop",
      photos: [{ name: "front.jpg", type: "image/jpeg", size: 2048 }],
      contact: { phone: "07700900123", email: "ada@example.com" },
    });
    expect(JSON.stringify(leads[0])).not.toContain("base64");
  });

  it("does not notify when the details are invalid or the plate is unknown", async () => {
    const { notifier, leads } = recorder();
    const deps = {
      provider: new MockVrmProvider(),
      notifiers: [notifier],
      photoStore: new NoopPhotoStore(),
      reference: () => "HLD-TEST",
    };

    const invalid = await createLead({ ...validLead, email: "not-an-email" }, deps);
    expect(invalid.status).toBe("error");
    const missing = await createLead({ ...validLead, vrm: "XX22 AAA" }, deps);
    expect(missing).toMatchObject({ status: "error", code: "not_found", fieldErrors: { vrm: "not_found" } });
    expect(leads).toHaveLength(0);
  });

  it("reports a notifier failure without claiming success", async () => {
    const notifier: LeadNotifier = {
      id: "test",
      notify: async () => {
        throw new Error("down");
      },
    };
    const result = await createLead(validLead, {
      provider: new MockVrmProvider(),
      notifiers: [notifier],
      photoStore: new NoopPhotoStore(),
      reference: () => "HLD-TEST",
    });
    expect(result).toEqual({ status: "error", code: "submit_failed" });
  });

  it("builds an unambiguous reference", () => {
    expect(createReference(new Uint8Array([0, 1, 2, 3]))).toMatch(/^HLD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });
});

describe("notifiers", () => {
  it("logs by default and leaves email and SMS off", () => {
    expect(getNotifiers({}).map((notifier) => notifier.id)).toEqual(["log"]);
    expect(getNotifiers({ NOTIFIER_LOG: "false" }).map((notifier) => notifier.id)).toEqual([]);
    expect(
      getNotifiers({
        NOTIFIER_LOG: "false",
        NOTIFIER_EMAIL: "false",
        RESEND_API_KEY: "key",
        RESEND_FROM_EMAIL: "Halden <desk@example.com>",
        LEAD_NOTIFY_EMAIL: "desk@example.com",
      }),
    ).toEqual([]);
  });

  it("refuses to enable a channel that has no credentials", () => {
    expect(() => getNotifiers({ NOTIFIER_EMAIL: "true" })).toThrow(NotifierConfigError);
    expect(() => getNotifiers({ NOTIFIER_SMS: "true", NOTIFIER_LOG: "false" })).toThrow(NotifierConfigError);
  });

  it("builds a Resend request and a Twilio WhatsApp request without sending them", () => {
    const lead: LeadNotification = {
      reference: "HLD-TEST",
      submittedAt: "2026-11-16T12:00:00.000Z",
      contact: { name: "Ada Lovelace", phone: "07700900123", email: "ada@example.com" },
      vehicle: {
        vrm: "OV19 HRL",
        make: "Volvo",
        model: "XC40",
        year: 2019,
        fuel: "Petrol",
        engineSizeCc: 1969,
      },
      mileage: 12500,
      condition: "good",
      faults: ["none"],
      keys: "two_or_more",
      photos: [],
      photoStorage: "noop",
    };
    const email = buildResendRequest(
      {
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "Halden <desk@example.com>",
        LEAD_NOTIFY_EMAIL: "desk@example.com",
      },
      lead,
    );
    expect(email.url).toBe("https://api.resend.com/emails");
    expect(email.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(email.body)).toMatchObject({
      to: ["desk@example.com"],
      subject: "Valuation request HLD-TEST",
    });

    const sms = buildTwilioRequest(
      {
        TWILIO_ACCOUNT_SID: "AC-test",
        TWILIO_AUTH_TOKEN: "token-test",
        TWILIO_FROM_NUMBER: "+447700900000",
        LEAD_NOTIFY_PHONE: "+447700900123",
        TWILIO_CHANNEL: "whatsapp",
      },
      lead,
    );
    expect(sms.url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC-test/Messages.json");
    expect(sms.headers.Authorization.startsWith("Basic ")).toBe(true);
    expect(sms.body).toContain("To=whatsapp%3A%2B447700900123");
    expect(sms.body).toContain("From=whatsapp%3A%2B447700900000");
  });

  it("writes the reference to the console notifier", async () => {
    const write = vi.fn();
    const lead = {
      reference: "HLD-LOG1",
    } as LeadNotification;
    await new ConsoleNotifier(write).notify(lead);
    expect(write).toHaveBeenCalledOnce();
    expect(String(write.mock.calls[0]?.[0])).toContain("HLD-LOG1");
  });
});
