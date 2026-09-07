# Credential expiry and rotation

Every connected provider account must tell the operator **before or when** its API token stops working, in **Telegram** and in the **admin UI**, with a **direct link** to create a replacement. This is not a budget alert. It applies to Neon, Vercel, and every later adapter.

---

## Why

CostOps does **not** store token expiry dates and does not ask the operator to type them in. Vendors do not return a reliable wall-clock expiry after the token is created.

| Signal | When |
|--------|------|
| Live auth failure | Provider API returns 401/403 or an equivalent “invalid / revoked / expired key” on a real request (sync) |
| Request failed | Last sync failed for another reason (timeout, 5xx) — shown in admin, **no** Telegram credential alert |

Do not wait for spend alerts to imply “the token died”. A dead token must look like a **credential** problem, not a `$0` day. Calendar 30d / 7d / expired reminders are disabled.

---

## Surfaces

### Admin (Settings → Integrations)

For each `ProviderAccount` show:

- provider + account name
- credential health from the last live request: `ok` / `auth_failed` / `error` / `unknown`
- last successful sync / last auth error (no secret values)
- button/link **Create new token** → adapter `credentialCreateUrl`
- short path text (where to click if the deep link is generic)
- after rotation: operator updates env / secret, then **Mark rotated** or the next successful sync clears `auth_failed`

Integrations must surface stale/error accounts (already in the spec). Credential expiry counts as provider health. The header sync chip is the board-level health signal.

### Telegram

Same facts as the admin card. Always include the create-token URL for **that** provider.

```text
CREDENTIAL ALERT

Provider: Vercel
Account: Neetrino
Status: API token rejected (401)

Create a new token:
https://vercel.com/account/tokens

Scope: Team (Neetrino), not one project.
Then put the new value in VERCEL_API_TOKEN. CostOps will clear the alert on the next successful sync.
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
| `AUTH_FAILED` | Live 401/403 / revoked / expired key | Once per incident; clear on successful sync or Mark rotated |

Calendar `EXPIRING_30D` / `EXPIRING_7D` / `EXPIRED` kinds remain in the schema but are not evaluated.

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
  /** Always false. CostOps does not store token expiry dates. */
  supportsExpiryDate: boolean;
  /** How to recognize a dead credential from an API error. */
  isAuthFailure(error: unknown): boolean;
};
```

### Known links (verify if a vendor moves the page)

| Provider | Create token | Docs | Expiry |
|----------|--------------|------|--------|
| Neon | [console.neon.tech](https://console.neon.tech) → org **Settings → API keys** | [Manage API keys](https://neon.com/docs/manage/api-keys) | No auto-expiry; notify on 401 after revoke |
| Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) (Personal Account → Tokens) | [Access tokens](https://vercel.com/docs/accounts/access-tokens) | No stored date; notify on 401/403 |
| Upstash | [console.upstash.com/account/api](https://console.upstash.com/account/api) (Account → Management API) | [Developer API](https://upstash.com/docs/devops/developer-api/authentication) | No auto-expiry; notify on 401 |
| GCP | [IAM service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) + billing account | Cloud Billing export / BigQuery | Operator stores key file path in `GOOGLE_APPLICATION_CREDENTIALS` |

Vercel Team ID: team **Settings → General**. Not a secret, but keep next to the token in Settings.

---

## Data

On `ProviderAccount` (see `DATA_MODEL.md`):

- `credentialExpiresAt` — unused (column kept; not written by the UI)
- `credentialRotatedAt` — last time operator marked rotated or env was confirmed working
- `lastAuthFailureAt` / `lastAuthFailureCode`

`CredentialAlert` stores dedupe rows (`providerAccountId` + `kind` + `windowKey`). `AUTH_FAILED` uses window `open` until cleared.

---

## Tests

- leftover `credentialExpiresAt` does not send Telegram
- 401 → one Telegram; hourly sync does not spam
- successful sync after 401 does not send “recovered $0”
- adapter without `credentialCreateUrl` fails a contract test
