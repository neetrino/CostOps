# Credential expiry and rotation

Every connected provider account must tell the operator **before or when** its API token stops working, in **Telegram** and in the **admin UI**, with a **direct link** to create a replacement. This is not a budget alert. It applies to Neon, Vercel, and every later adapter.

---

## Why

Tokens are easy to forget. A Vercel team token may be created with a one-year expiry. Neon org keys do **not** auto-expire (they die on revoke or leak). CostOps must cover both:

| Signal | When |
|--------|------|
| Known expiry | `credentialExpiresAt` is set (Vercel 1-year token, or a manual reminder) |
| Auth failure | Provider API returns 401/403 or an equivalent “invalid/revoked key” |

Do not wait for spend alerts to imply “the token died”. A dead token must look like a **credential** problem, not a `$0` day.

---

## Surfaces

### Admin (Settings → Integrations)

For each `ProviderAccount` show:

- provider + account name
- credential health: `ok` / `expiring` / `expired` / `auth_failed` / `unknown`
- `credentialExpiresAt` and days left (or “no expiry on file”)
- last successful sync / last auth error (no secret values)
- button/link **Create new token** → adapter `credentialCreateUrl`
- short path text (where to click if the deep link is generic)
- date field **Expires on** so the operator can record the Vercel expiry (APIs do not return it after creation)
- after rotation: operator updates env / secret, then **Mark rotated** or the next successful sync clears `auth_failed`

Overview must also surface stale/error accounts (already in the spec). Credential expiry counts as provider health.

### Telegram

Same facts as the admin card. Always include the create-token URL for **that** provider.

```text
CREDENTIAL ALERT

Provider: Vercel
Account: Neetrino
Status: expires in 7 days (2027-09-05 UTC)

Create a new token:
https://vercel.com/account/tokens

Scope: Team (Neetrino), not one project.
Then put the new value in VERCEL_API_TOKEN and set the new expiry in CostOps Settings.
```

Auth failure:

```text
CREDENTIAL ALERT

Provider: Neon
Account: org-quiet-mode-…
Status: API key rejected (401)

Create a new org API key:
https://console.neon.tech
Path: Organization → Settings → API keys

Update NEON_API_KEY. Do not treat today's cost as $0.
```

Escape names as in spend alerts. Never put the old or new secret in the message.

---

## Triggers (core, not per-adapter)

Evaluate on the scheduler tick (with sync) **and** after any provider call that fails auth.

| Kind | Condition | Repeat |
|------|-----------|--------|
| `EXPIRING_30D` | `expiresAt` in 1–30 days | Once per `expiresAt` value |
| `EXPIRING_7D` | `expiresAt` in 1–7 days | Once per `expiresAt` value |
| `EXPIRED` | `now >= expiresAt` | Once per `expiresAt` value |
| `AUTH_FAILED` | 401/403 / revoked | Once per incident; clear on successful sync or Mark rotated |

Constants (named, not magic): `CREDENTIAL_WARN_DAYS_LONG = 30`, `CREDENTIAL_WARN_DAYS_SHORT = 7`.

If `expiresAt` is null, only `AUTH_FAILED` and the admin “no expiry on file” state apply.

---

## Adapter contract (mandatory for every provider)

Each adapter exports credential UX metadata. Adding Upstash/GCP/Hetzner **requires** these fields — do not ship an adapter without a rotate link.

```ts
export type ProviderCredentialMeta = {
  envVarNames: string[];
  /** Official dashboard URL where a human creates a replacement token. */
  credentialCreateUrl: string;
  /** Official docs for that token. */
  credentialDocsUrl: string;
  /** Short Console click path shown in UI and Telegram. */
  credentialCreatePath: string;
  /** True if the vendor token can have a wall-clock expiry (Vercel). */
  supportsExpiryDate: boolean;
  /** How to recognize a dead credential from an API error. */
  isAuthFailure(error: unknown): boolean;
};
```

### Known links (verify if a vendor moves the page)

| Provider | Create token | Docs | Expiry |
|----------|--------------|------|--------|
| Neon | [console.neon.tech](https://console.neon.tech) → org **Settings → API keys** | [Manage API keys](https://neon.com/docs/manage/api-keys) | No auto-expiry; notify on 401 after revoke |
| Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) (Personal Account → Tokens) | [Access tokens](https://vercel.com/docs/accounts/access-tokens) | Yes — operator must save the chosen expiry |
| Upstash / GCP / others | Fill when the adapter is added | — | Per vendor |

Vercel Team ID: team **Settings → General**. Not a secret, but keep next to the token in Settings.

---

## Data

On `ProviderAccount` (see `DATA_MODEL.md`):

- `credentialExpiresAt` — optional UTC instant
- `credentialRotatedAt` — last time operator marked rotated or env was confirmed working
- `lastAuthFailureAt` / `lastAuthFailureCode`

`CredentialAlert` stores dedupe rows (`providerAccountId` + `kind` + `windowKey`). `windowKey` for expiry kinds is the ISO date of `credentialExpiresAt`. Changing the expiry date allows a new warning cycle.

---

## Tests

- 30-day warning once; not again the next hour
- 7-day warning still fires after the 30-day one
- expiry-day warning
- new `expiresAt` after rotation starts a new cycle
- 401 → one Telegram; hourly sync does not spam
- successful sync after 401 does not send “recovered $0”
- adapter without `credentialCreateUrl` fails a contract test
