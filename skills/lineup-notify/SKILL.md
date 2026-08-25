---
name: lineup-notify
description: >-
  Send lineup notifications via Inkbox (iMessage, SMS, email) — invites, reminders,
  "a spot opened," time/venue changes, and cancellations. Use when players need to be
  told about an event. Respects opt-in and requires approval for mass sends.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-notify — the text

You compose and send messages via the **Inkbox** MCP connector (see `tools/inkbox.md`).
You only message members whose `NotifyOptIn = true`. Data is in Airtable
(`data/airtable-schema.md`).

## Channels & routing

Inkbox gives lineup three channels. Route per recipient:

1. **iMessage** — preferred for players (blue-bubble, group-friendly). Tool:
   `inkbox_imessage_send`. **Consent gate:** you can only iMessage someone *after they
   have messaged `lineup` first* — otherwise Inkbox returns `imessage_awaiting_inbound`.
   That first inbound text is their opt-in.
2. **SMS** — fallback for recipients not reachable on iMessage. Tool: `inkbox_text_send`
   (needs a provisioned number; not yet available).
3. **Email** — organizer notices and digests. Tool: `inkbox_email_send` (live now).

If a player hasn't opened an iMessage thread yet, don't fail silently — fall back to
SMS (when available) or flag them for an opt-in invite.

## Message types

| Trigger | Audience | Approval |
|---------|----------|----------|
| Event invite | group members opted in | organizer confirms (mass) |
| Reminder (e.g., day-of) | players who are `In` | organizer confirms (mass) |
| **Spot opened** (bullpen call) | the whole opted-in **bullpen** | auto — event-driven |
| Time/venue change | `In` + `Bullpen` | organizer confirms (mass) |
| Cancellation | `In` + `Bullpen` | organizer confirms (mass) |

## Procedure

1. Build the recipient list from Airtable, **excluding anyone with `NotifyOptIn = false`**.
2. Compose a short, clear message (who/what/when/where + how to respond, e.g., reply
   "IN"/"OUT"). Include the event title and time; never include other members' numbers.
3. **Pick the channel** per recipient (iMessage → SMS → email fallback). For iMessage,
   confirm an inbound thread exists (`inkbox_imessage_assignments_list` / a prior message);
   if not, the recipient needs to opt in by texting `lineup` first.
4. **Mass sends** (invites, reminders, changes, cancellations): show the organizer the
   message, the recipient **count**, and the estimated cost, and **get explicit approval
   before sending** — a consequential, externally visible action (the lineup charter /
   Patricia's Charter). **Bullpen open-slot calls are the exception:** event-driven (a
   real spot opened), expected, and opt-in, so they send automatically to the whole
   bullpen without a fresh approval — that speed is the point.
5. Send via Inkbox; report how many delivered/failed. Do not retry failed recipients in a
   loop (and note: re-sending identical text replays Inkbox's idempotency result — change
   the wording to genuinely retry).

## Rules

- **Opt-in only.** No messages to members who haven't consented. For iMessage, the
  consent gate enforces this automatically (they must text first).
- **Approve before mass send.** Never blast the group without the organizer's OK.
- **Privacy.** One recipient per message; never expose the roster's numbers.
- Keep it rare and useful — no spam. Honor opt-outs immediately.

## Examples

- Bullpen call: a spot opens → auto-message the opted-in bullpen "Spot open for Tue 6pm — first to reply IN gets it!" (iMessage where threads exist, SMS otherwise).
- Invite: organizer says "invite the group" → draft + show count → on approval, send; players not yet on iMessage get an opt-in nudge to text `lineup`.
- Organizer digest: weekly summary → email to the organizer via `inkbox_email_send`.
