---
name: lineup-bullpen
description: >-
  Manage a lineup event's bullpen — the on-call pool that fills open slots first
  come, first served. When a spot opens, broadcast it to the whole bullpen; the
  first valid claim wins. Use when a spot frees up, capacity changes, or someone
  asks about the bullpen. Works alongside lineup-rsvp.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-bullpen — first come, first served

You run the **bullpen**: the on-call pool of players who want in when a spot
opens. Unlike a ranked waitlist, the bullpen is **unordered** — when a slot frees
up you offer it to *everyone* in the bullpen at once and the **first valid claim
wins**. This matches real pickup sports: availability changes by the minute, so
the fastest yes fills the game. Data is in Airtable (`data/airtable-schema.md`).

## When to use

- An `In` player drops out, or an event's `Capacity` increases → a slot opens.
- A player wants to be **on call** for a full event → put them in the bullpen.
- Someone asks **who's in the bullpen** or "any spots yet?"

## Procedure

**When a slot opens** (an `In` player goes `Out`, or capacity grows):

1. **Recompute headcount** (`In` count vs `Capacity`). Open slots = `Capacity − In`.
2. **Reopen the event:** if it was `Full` and now `In < Capacity`, set Event
   `Status = Scheduled`.
3. **Broadcast to the bullpen:** trigger [`lineup-notify`](../lineup-notify/) to the
   **whole opted-in bullpen** at once — "A spot just opened for <event>. First to
   reply IN gets it." This is an event-driven, expected call, so it sends
   automatically (not an organizer marketing blast — see `lineup-notify`).

**When a bullpen player claims** ("IN" / "I'll take it"):

4. **Gate on live headcount** — accept the claim **only while `In < Capacity`**:
   - `In < Capacity` → flip that player `Bullpen → In`. Confirm "you're in (N/Cap)."
     If `In` now equals `Capacity`, set Event `Status = Full` and the race is over.
   - `In ≥ Capacity` (someone beat them to it) → the player **stays in the
     bullpen**. Tell them plainly: "That spot's already filled — you're still in
     the bullpen for the next one."

Because acceptance is gated purely on live `In < Capacity`, the fill is naturally
first-come, first-served and **can never overfill**, no matter how many claims
arrive at once.

## Rules

- **First valid claim wins.** No reserved order, no saved position, no skipping.
- **Never overfill:** accept a claim only when `In < Capacity` at the moment it's
  processed; recheck the count on every claim.
- **Never bump an `In` player** to make room.
- The open-slot broadcast to the bullpen sends automatically (event-driven,
  opt-in). A general blast the organizer initiates still needs approval (`lineup-notify`).

## Bullpen vs. ordered waitlist (future mode)

The bullpen is the default and reflects reality. An **ordered waitlist** —
promote strictly by position/earliest signup — is a documented optional mode for
groups that prefer a guaranteed queue. If enabled, use the RSVP `Position` field
(reserved for this) and auto-promote #1 instead of broadcasting. Not active by default.

## Examples

- Player #4 (of 4) drops → event reopens (3/4) → text goes to all 3 bullpen players
  → first to reply IN takes the seat (4/4, Full again); the other two stay on call.
- Organizer raises capacity 4→6 → two slots open → bullpen gets "2 spots open, first
  come first served" → first two valid claims fill them.
- Two players reply "IN" seconds apart for one seat → the first processed gets in;
  the second is told it's filled and remains in the bullpen.
