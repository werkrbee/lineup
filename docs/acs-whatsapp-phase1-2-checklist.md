# ACS + WhatsApp — Phase 1–2 checklist (provision + outbound)

A concrete, do-it-in-order checklist to get lineup **sending** WhatsApp via Azure
Communication Services. Scope = phases 1–2 of `acs-whatsapp-backend.md` (provisioning +
outbound send). Inbound handling and the bullpen state machine (phases 3–4) come later.

> Placeholders: `rg-lineup`, `acs-lineup`, `func-lineup`, `stlineup`, `<sub-id>`,
> `<region>` (e.g. `eastus`). Rename to taste.

---

## Part A — Azure resources

Do these in the Azure portal or with `az` CLI. Exact resources:

| # | Resource | Name | Notes |
|---|----------|------|-------|
| 1 | Resource Group | `rg-lineup` | Container for everything below. |
| 2 | **Communication Services** | `acs-lineup` | The ACS resource. Grab its **connection string** (Keys blade). |
| 3 | **Advanced Messaging → WhatsApp channel** | — | Register in the ACS resource → get the **Channel Registration ID** (GUID). Requires the Meta steps in Part B. |
| 4 | Phone number | ACS-provisioned **or** BYO | Must be **SMS-reachable** so Meta can send the verification code. Not the message sender per se — WhatsApp sends from the WABA number. |
| 5 | Storage account | `stlineup` | Required by the Function App runtime. |
| 6 | Function App (Node 20) | `func-lineup` | Flex Consumption or Consumption plan. Hosts the outbound function. |
| 7 | Application Insights | `func-lineup` (auto) | Observability for sends/failures. |
| 8 | Key Vault (optional) | `kv-lineup` | Store `ACS_CONNECTION_STRING` instead of app settings. |

Event Grid (for **inbound**) is **phase 3** — skip for now.

### CLI quickstart

```bash
az group create -n rg-lineup -l eastus

# ACS resource (global data location; pick per compliance needs)
az communication create -n acs-lineup -g rg-lineup --location Global --data-location UnitedStates
az communication list-key -n acs-lineup -g rg-lineup   # -> primaryConnectionString

# Function App + storage
az storage account create -n stlineup -g rg-lineup -l eastus --sku Standard_LRS
az functionapp create -n func-lineup -g rg-lineup \
  --storage-account stlineup --consumption-plan-location eastus \
  --runtime node --runtime-version 20 --functions-version 4

# App settings (or use Key Vault references)
az functionapp config appsettings set -n func-lineup -g rg-lineup --settings \
  ACS_CONNECTION_STRING="endpoint=https://acs-lineup.communication.azure.com/;accesskey=..." \
  WHATSAPP_CHANNEL_ID="<channel-registration-guid>"
```

The **WhatsApp channel registration** (step 3) is done in the portal on the ACS
resource → *Advanced Messaging* → *Connect WhatsApp Business Account* (embedded Meta
signup), which is where Part B happens.

---

## Part B — Meta / WhatsApp Business

Done through the ACS portal's embedded signup (no separate Meta dev app needed):

- [ ] **Meta Business Account** — create or select one.
- [ ] **WhatsApp Business Account (WABA)** — create or select.
- [ ] **Add + verify a phone number** for the WABA (receives the SMS/voice code). This
      becomes the **sender number** recipients see.
- [ ] **Accept** the Meta Cloud API + WhatsApp Terms of Service.
- [ ] **Business display name** — set it (`lineup`); formal review isn't required to
      start sending.
- [ ] Copy the **Channel Registration ID** back into `WHATSAPP_CHANNEL_ID`.
- [ ] **Submit the 4 templates** in Part C → wait for approval (usually quick; utility
      category).

---

## Part C — Message templates to submit to Meta

Submit these in the WhatsApp Manager / ACS template flow. All **category: Utility**,
**language: en_US**. WhatsApp uses positional variables `{{1}}, {{2}}, …`; provide the
sample values (Meta requires examples for approval). Optional **quick-reply buttons**
`IN` / `OUT` are noted where they help.

### 1. `lineup_event_invite` (Utility)

> 🀄 {{1}}: you're invited to {{2}} on {{3}} at {{4}}. Reply **IN** to grab a seat or
> **OUT** to pass — seats are limited and first come, first served.

- Variables: `{{1}}`=group, `{{2}}`=game, `{{3}}`=date/time, `{{4}}`=venue
- Sample: `Saturday Mahjong` · `Mahjong night` · `Sat Aug 22, 7:30 PM` · `1407 Graymalkin Lane`
- Buttons (optional): quick-reply **IN**, **OUT**

### 2. `lineup_reminder` (Utility)

> ⏰ Reminder: {{1}} is {{2}} at {{3}}. You're currently **{{4}}**. Reply IN or OUT if
> that's changed.

- Variables: `{{1}}`=game, `{{2}}`=date/time, `{{3}}`=venue, `{{4}}`=status (In/Bullpen/Out)
- Sample: `Saturday Mahjong` · `tonight 7:30 PM` · `1407 Graymalkin Lane` · `In`

### 3. `lineup_spot_open` (Utility) — the bullpen call

> 🀄 A spot just opened for {{1}} ({{2}} at {{3}}). First to reply **IN** gets it!

- Variables: `{{1}}`=game, `{{2}}`=date/time, `{{3}}`=venue
- Sample: `Saturday Mahjong` · `tonight 7:30 PM` · `1407 Graymalkin Lane`
- Buttons (optional): quick-reply **IN**

### 4. `lineup_cancellation` (Utility)

> ❌ Heads up: {{1}} on {{2}} at {{3}} is cancelled. {{4}}

- Variables: `{{1}}`=game, `{{2}}`=date, `{{3}}`=venue, `{{4}}`=reason or sign-off
- Sample: `Saturday Mahjong` · `Sat Aug 22` · `1407 Graymalkin Lane` · `See you next time!`

> **Why templates:** invites, reminders, spot-open, and cancellations are
> *business-initiated* and go out **outside** a 24-hour window, so WhatsApp requires an
> approved template. **RSVP confirmations** ("You're in, 3/4") are sent as free-form
> **session** messages within 24h of the player's own reply — no template needed (handled
> by the `text` path in the function).

---

## Part D — Outbound Function skeleton

Runnable skeleton lives in [`acs-whatsapp/functions/`](acs-whatsapp/functions/):

- `package.json` — deps (`@azure/communication-messages`, `@azure/functions`)
- `src/functions/sendWhatsApp.js` — HTTP-triggered send (template **or** session text)
- `local.settings.json.example` — env vars to copy to `local.settings.json`

Deploy / run:

```bash
cd docs/acs-whatsapp/functions
npm install
cp local.settings.json.example local.settings.json   # fill in ACS_CONNECTION_STRING + WHATSAPP_CHANNEL_ID
func start                                            # local test (Azure Functions Core Tools)
# or: func azure functionapp publish func-lineup
```

Call it (business-initiated template):

```bash
curl -X POST "$FUNC_URL/api/sendWhatsApp?code=$FUNCTION_KEY" -H "Content-Type: application/json" -d '{
  "kind": "invite",
  "to": "+15555550199",
  "values": ["Saturday Mahjong", "Mahjong night", "Sat Aug 22, 7:30 PM", "1407 Graymalkin Lane"]
}'
```

Call it (free-form session reply, within 24h of their inbound):

```bash
curl -X POST "$FUNC_URL/api/sendWhatsApp?code=$FUNCTION_KEY" -H "Content-Type: application/json" -d '{
  "kind": "text", "to": "+15555550199", "message": "You'\''re in (3/4). See you Saturday! 🀄"
}'
```

> The exact `template.bindings/values` shape depends on the installed
> `@azure/communication-messages` version and must match each approved template's
> variables — treat the file as a skeleton and reconcile against the SDK docs when you wire it.

---

## Definition of done (phases 1–2)

- [ ] ACS resource + WhatsApp channel registered; `WHATSAPP_CHANNEL_ID` in hand.
- [ ] WABA connected, sender number verified, ToS accepted.
- [ ] 4 templates submitted and **approved**.
- [ ] Function deployed; a **template** send lands on a real WhatsApp number.
- [ ] A **session** (text) reply lands within the 24h window.
- [ ] `lineup-notify` updated with an ACS path (behind the existing Inkbox path).

Then decide on phases 3–4 (Event Grid inbound + server-side bullpen) per
`acs-whatsapp-backend.md`.
