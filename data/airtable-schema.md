# lineup — Airtable data model

The shared source of truth for **lineup** (SportsCopilot platform). All skills read and write these tables via
the Airtable MCP tool (see `tools/airtable.mcp.json`). Create one Airtable **base**
named `SportsCopilot` with the tables below.

## Tables

### Groups

| Field | Type | Notes |
|-------|------|-------|
| `Name` | Single line text | e.g., "Tuesday Pickleball" |
| `Sport` | Single select | Pickleball, Tennis, Basketball, … |
| `DefaultVenue` | Single line text | default court/location |
| `SkillTiers` | Single line text | e.g., "2.5–3.0, 3.5–4.0, 4.0+" |
| `Rules` | Long text | house rules, cancellation policy |
| `Organizers` | Link → Members | who can schedule/cancel |
| `CreatedAt` | Created time | |

### Members

| Field | Type | Notes |
|-------|------|-------|
| `Name` | Single line text | |
| `Phone` | Phone number | E.164 (e.g., +1512…) — used for SMS |
| `Email` | Email | optional |
| `SkillLevel` | Number (1 dp) | DUPR-style, e.g., 3.5 |
| `Group` | Link → Groups | a member can belong to multiple groups |
| `Role` | Single select | Organizer, Player |
| `NotifyOptIn` | Checkbox | **must be true to receive SMS** |
| `CreatedAt` | Created time | |

### Events

| Field | Type | Notes |
|-------|------|-------|
| `Title` | Single line text | e.g., "Tue 6pm Open Play" |
| `Group` | Link → Groups | |
| `DateTime` | Date (with time) | start time |
| `Venue` | Single line text | court/location |
| `Capacity` | Number (integer) | max `In` players |
| `SkillLevel` | Single line text | required tier, optional |
| `Cost` | Currency | per-player court fee, optional |
| `Status` | Single select | Scheduled, Full, Cancelled, Completed |
| `Notes` | Long text | |
| `CreatedAt` | Created time | |

### RSVPs  *(the join table — the heart of lineup)*

| Field | Type | Notes |
|-------|------|-------|
| `Event` | Link → Events | |
| `Member` | Link → Members | |
| `Status` | Single select | In, Out, Bullpen |
| `Position` | Number (integer) | **reserved** — unused in bullpen mode; only for the optional ordered-waitlist mode |
| `Timestamp` | Last modified time | when they joined the bullpen (display only, not a promotion order) |

**Uniqueness:** at most one RSVP row per (`Event`, `Member`). Skills upsert on that pair.

## Core logic (referenced by the skills)

- **Headcount:** an event's `In` count = number of RSVPs with `Status = In` for that Event.
- **Capacity gate (`lineup-rsvp`):** on a new/updated "I'm in," if `In < Capacity` → set
  `Status = In`; else set `Status = Bullpen` (no position — the bullpen is unordered).
  Set the Event `Status = Full` when `In` reaches `Capacity`.
- **Open slot (`lineup-bullpen`):** when an `In` player goes `Out` (or the event grows),
  flip the Event back to `Scheduled` if it was `Full`, then **broadcast the open slot to
  the whole opted-in bullpen** via `lineup-notify` ("first to reply IN gets it"). The
  **first valid claim wins** — accept a claim only while `In < Capacity`; once `In`
  reaches `Capacity` again, set the Event `Status = Full` and decline the rest ("still
  in the bullpen"). Gating on live headcount makes it first-come-first-served and
  overfill-proof. (An ordered-waitlist mode using `Position` is an optional future toggle.)
- **Cancellation (`lineup-event`):** set Event `Status = Cancelled` and notify everyone
  who is `In` or in the `Bullpen`.
- **Privacy:** never expose a member's `Phone`/`Email` in shared output; identify by `Name`.
