# Inkbox — notifications (iMessage · SMS · email)

lineup sends notifications through the **Inkbox** MCP connector — email, SMS, and
iMessage for AI agents. It replaces the earlier Twilio placeholder (the Twilio MCP
connector is search-only and cannot send).

## Identity

- **Agent handle / display name:** `lineup`
- **Identity ID:** `INKBOX_IDENTITY_ID`
- **Connector (MCP server) UUID:** `INKBOX_CONNECTOR_UUID`

## Channel readiness (as of 2026-08-20)

| Channel | State | Notes |
|---------|-------|-------|
| **Email** | ✅ live (tested) | `lineup@inkboxmail.com`, verified sending domain. Best for organizer notices + digests. |
| **iMessage** | ⚠️ connected, provisioning | Operator device linked via `connect @lineup`; dedicated number still pending. Best for players (blue-bubble, group-friendly). |
| **SMS** | ❌ not provisioned | Needs a phone number + (US) A2P registration in the Inkbox dashboard. Fallback for non-Apple players. |

## Key tools

- Email: `inkbox_email_send` (`email_address`, `recipients.to[]`, `subject`, `body_text`/`body_html`)
- SMS: `inkbox_text_send` (`phone_number_id`, `to[]` E.164, `text`) — needs a provisioned number
- iMessage: `inkbox_imessage_send` (`agent_identity_id`, `recipient` E.164, `text`, optional `send_style`)
- Readiness/consent: `inkbox_channel_status_get`, `inkbox_sms_consent_get`, `inkbox_imessage_consent_get`, `inkbox_imessage_assignments_list`

## Gotchas (learned the hard way)

- **iMessage is consent-gated — inbound first.** The agent can only iMessage someone
  **after that person has messaged `lineup` first** (`imessage_awaiting_inbound`
  otherwise). This doubles as opt-in: a player's first text opens their thread.
- **The operator device ≠ a recipient.** The phone that runs `connect @lineup`
  (here Clark's, +15555550111) is the operator; messaging the triage number from it
  reaches Inkbox's triage assistant, not a lineup thread. Test iMessage with a *different*
  person, not yourself.
- **Idempotency replays.** Re-sending identical params replays a prior rejection; change
  the text (new key) to genuinely retry.

## Routing policy for lineup

Prefer **iMessage** for players (once provisioned); fall back to **SMS** for recipients
not on iMessage; use **email** for organizer notices and digests. All sends honor
`NotifyOptIn` and the `lineup-etiquette` charter (approval for organizer-initiated mass
sends; bullpen open-slot calls send automatically).
