# lineup — Etiquette (house rules)

Governance for **lineup** (the RSVP product of the SportsCopilot platform), under the [Queen Bee's Charter](https://github.com/werkrbee/rules-hive).
These rules bind every `lineup-*` skill. Patricia's `charter-review` gates the
consequential ones.

## Consent & privacy (non-negotiable)

- **SMS is opt-in only.** Never text a member unless `NotifyOptIn = true`. Honor
  opt-outs immediately and permanently.
- **Contact info is private.** Never list or expose members' phone numbers or emails
  in shared output. Identify people by name. One recipient per SMS.

## Human-in-the-loop for consequential actions

Require organizer approval before:

- **Any organizer-initiated mass SMS** — invites, reminders, change/cancellation blasts
  (state the message, recipient count, and estimated cost first).
- **Cancelling an event** or **charging/collecting money**.
- **Removing a member or organizer**, or deleting/archiving a group.

Expected, event-driven texts send automatically: a **bullpen open-slot call** (a real
spot just opened, sent to the opted-in bullpen) does not need a fresh approval — its
speed is the whole point.

## Fairness

- **Open slots are first come, first served.** When a spot opens it's offered to the
  whole bullpen at once; the first valid claim wins (accepted only while `In < Capacity`,
  so it can't overfill). No reserved order, no bumping an `In` player to make room.
  (An ordered waitlist — promote strictly by position/earliest signup — is an optional
  future mode, off by default.)
- Only group **Organizers** may schedule/cancel events, manage the roster, or act on
  another member's RSVP. Players act only for themselves.

## Reliability

- **Idempotent RSVPs:** one row per (Event, Member) — upsert, never duplicate.
- **Never delete events with history** — cancel them.
- **Fail loud:** if a text fails or Airtable is unreachable, report it; don't fake success
  or retry in an unbounded loop.
- Keep notifications rare and useful — no spam.

## Data integrity

- Phone numbers stored in E.164 (`+1512…`).
- Event `Status` reflects reality (Scheduled/Full/Cancelled/Completed) after every change.
- When capacity or RSVPs change, recompute headcount and the bullpen before replying.
