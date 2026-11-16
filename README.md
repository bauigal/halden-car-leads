# Halden

A small, mobile-first UK “sell your car” landing page. Someone enters a registration and mileage, confirms the vehicle, notes its condition, optionally adds photos, and asks for a free valuation.

It is a design demo. The vehicles are fictional, photos are not stored, and sending the form does not contact a buyer. There is no database and no API key in the repository.

## Try a plate

| Registration | What the demo returns |
| --- | --- |
| `OV19 HRL` | 2019 Volvo XC40, petrol, 1,969 cc |
| `BK68 YTR` | 2018 Volkswagen Polo, petrol, 999 cc |
| `LF71 MNC` | 2021 Tesla Model 3, electric |
| `YJ06 DKP` | 2006 Ford Fiesta, petrol, 1,388 cc |
| `W456 FGT` | 2000 Vauxhall Corsa, prefix-style plate |
| `A123 BCD` | 1983 Ford Sierra, prefix-style plate |
| `ABC 123A` | 1963 Morris Minor, suffix-style plate |
| `XX22 AAA` | Valid current-format plate, no record |
| `HELLO` | Rejected. Not a UK plate |
| `QQ11 AAA` | Rejected. `Q` is not used on current plates |

The stock lives in `src/lib/vrm/mock-provider.ts`. All visitor-facing sentences live in `src/content/copy.ts`.

## Local setup

Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Next.js. The optional `.env.local` is only needed when you turn a real provider or notifier on:

```bash
cp .env.example .env.local
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Vitest, for plate, mileage, contact, lookup and lead logic |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |

## Environment

Defaults are safe to deploy as-is: mock lookup, console notifier on, email and SMS off.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VRM_PROVIDER` | `mock` | `mock` or `http` |
| `VRM_API_BASE_URL` | unset | Your vehicle API. Used only when the provider is `http` |
| `VRM_API_KEY` | unset | Bearer token for that API. Set it in the host, never in git |
| `NOTIFIER_LOG` | on | Set `false` to stop writing leads to the server log |
| `NOTIFIER_EMAIL` | `false` | `true` sends the desk an email through Resend |
| `RESEND_API_KEY` | unset | Resend API key |
| `RESEND_FROM_EMAIL` | unset | From address Resend will accept |
| `LEAD_NOTIFY_EMAIL` | unset | Desk inbox |
| `NOTIFIER_SMS` | `false` | `true` texts the desk through Twilio |
| `TWILIO_ACCOUNT_SID` | unset | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | unset | Twilio auth token |
| `TWILIO_FROM_NUMBER` | unset | Sender, E.164, or a WhatsApp sender |
| `LEAD_NOTIFY_PHONE` | unset | Desk number, E.164 |
| `TWILIO_CHANNEL` | `sms` | Set `whatsapp` to prefix both numbers with `whatsapp:` |

The console notifier prints the name, phone and email. Turn `NOTIFIER_LOG` off before any real enquiry.

## Plugging in a real vehicle API

`src/lib/vrm/http-provider.ts` is the adapter. With `VRM_PROVIDER=http` it `POST`s to `VRM_API_BASE_URL`:

```json
{ "registrationNumber": "OV19HRL" }
```

The request uses `Authorization: Bearer <VRM_API_KEY>`. A hit is mapped from:

```json
{
  "make": "Volvo",
  "model": "XC40",
  "yearOfManufacture": 2019,
  "fuelType": "Petrol",
  "engineCapacityCc": 1969,
  "colour": "Blue"
}
```

HTTP 404, `{ "found": false }`, or `{ "error": "not_found" }` is a miss. Anything else is treated as unavailable. If your vendor uses different field names, change `mapHttpVehicle`. The official DVLA Vehicle Enquiry API does not return the model, so it cannot fill this form on its own.

No request is made unless both the URL and the key are set.

## Email and SMS

Both notifiers are implemented and switched off. They message the buying desk, not the person who filled in the form.

- Resend: `src/lib/notify/resend-notifier.ts` posts plain text to `https://api.resend.com/emails`.
- Twilio: `src/lib/notify/twilio-notifier.ts` posts to the Messages resource. `TWILIO_CHANNEL=whatsapp` sends a WhatsApp message with the same credentials.

A channel that is switched on without its credentials fails the submission with a configuration error, rather than silently dropping the lead.

## Photos

The browser accepts up to 6 images, JPG, PNG, WebP or HEIC, 5 MB each. The lead stores the file name, type and size. The bytes stay on the device. `NoopPhotoStore` in `src/lib/photos.ts` is the demo storage.

Vercel function bodies are limited to 4.5 MB, so a real upload should go directly to [Vercel Blob](https://vercel.com/docs/vercel-blob) (or similar) from the browser. Do not post the image bytes through the server action.

## Deploying to Vercel

A person still has to connect the project. This repository does not deploy itself.

1. Push the repository to the Git host you use with Vercel, if it is not there already.
2. In Vercel, import the project. Leave the framework as Next.js and do not override the build command.
3. For the demo, add no environment variables. Mock data and the console log are the defaults.
4. Deploy, then try `OV19 HRL`.
5. Read the lead in the Vercel function logs. Locally it appears in the `next dev` terminal.
6. When you are ready for a real lookup or a real desk notification, add the variables above in the Vercel project settings and redeploy. Do not commit the keys.

## Licence

MIT. See [LICENSE](LICENSE).
