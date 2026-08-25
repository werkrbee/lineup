# lineup — project state

_Working note so a fresh chat can pick up instantly. Last updated: 2026-08-19._

## What this is

**lineup** — the RSVP product of the **SportsCopilot** platform. Organizes pickup
sports (pickleball first): groups, members, events, and the RSVP loop. Built as an
agent-run app on the werkrbee [House of Hives](https://github.com/werkrbee/ai-hive)
(Barry orchestrates, Patricia governs). Data in Airtable; notifications by SMS.

Hierarchy: **SportsCopilot** (platform) → **lineup** (product) → **In / Out / Bullpen** (RSVP statuses).

The **bullpen** replaced the old waitlist: an unordered on-call pool. When a slot
opens it's broadcast to the whole bullpen; the **first valid claim wins** (accepted
only while `In < Capacity`, so it's FCFS and overfill-proof). Ordered waitlist is a
documented optional future mode (uses RSVP `Position`).

## Repo layout (`~/Projects/lineup/`)

- `skills/` — `lineup-group`, `lineup-member`, `lineup-event`, `lineup-rsvp`, `lineup-bullpen`, `lineup-notify` (portable `SKILL.md`; `metadata.app: lineup`)
- `rules/lineup-etiquette/AGENTS.md` — governance (opt-in, privacy, approvals, FCFS fairness)
- `data/airtable-schema.md` — data model
- `tools/` — `airtable.mcp.json`, `inkbox.md`
- `assets/` — `lineup-logo.svg`, `lineup-icon.svg`, `lineup-app-icon.svg`, `lineup-favicon.svg`, `favicon.ico`, `favicons/` (16–512, apple-touch, PWA, `site.webmanifest`, `head-snippet.html`)
- `README.md` (logo embedded), this file

## Live Airtable IDs

- **Account/workspace:** "My First Workspace" `wsp_REDACTED` (note: connector's Airtable login, not necessarily the browser session — base opens at https://airtable.com/app_LINEUP_BASE)
- **Base:** `SportsCopilot` = `app_LINEUP_BASE`
- **Connector:** Airtable MCP server UUID `AIRTABLE_CONNECTOR_UUID`

### Tables + key fields

**Groups** `tbl_GROUPS` — Name `fld_REDACTED`, Sport `fld_REDACTED`, DefaultVenue `fld_REDACTED`

**Members** `tbl_MEMBERS` — Name `fld_REDACTED`, Phone `fld_REDACTED`, Email `fld_REDACTED`, SkillLevel `fld_REDACTED`, NotifyOptIn `fld_REDACTED`, Group `fld_REDACTED`

**Events** `tbl_EVENTS` — Title `fld_REDACTED`, Group `fld_REDACTED`, DateTime `fld_REDACTED`, Venue `fld_REDACTED`, Capacity `fld_REDACTED`, Status `fld_REDACTED` (singleSelect: Scheduled/Full/Cancelled/Completed — option IDs not cached), Notes `fld_REDACTED`

**RSVPs** `tbl_RSVPS` — Label `fld_REDACTED` (primary), Event `fld_REDACTED`, Member `fld_REDACTED`, Status `fld_REDACTED`, Position `fld_REDACTED`
  - Status option IDs: **In** `sel_REDACTED`, **Out** `sel_REDACTED`, **Bullpen** `sel_REDACTED` (this option was renamed from "Waitlisted" in the UI — same ID)

> Cross-references (Group/Event/Member) are **single-line text**, not linked records — the connector couldn't create linked-record fields at base-creation time. Future upgrade: convert to real links.

### Interface (dashboard)

- **Interface:** `SportsCopilot Dashboard` `pbd_DASHBOARD` — https://airtable.com/app_LINEUP_BASE/pbd_DASHBOARD
- Pages: **At a Glance** `pag_AT_A_GLANCE` (dashboard tiles) · **Tonight's Game & Bullpen** `pag_KANBAN` (kanban by Status) · **Group Roster** `pag_ROSTER` (grid)

## Current data state

**Group:** OG-Pickleball · Pickleball · Midtown

**Members (6, all OG-Pickleball, opt-in ✓):**

> Names, phone numbers, and emails below are **fictionalized** for the public repo
> (superhero pseudonyms, `555` numbers, `example.com` emails), and all infrastructure
> IDs (base, tables, records, fields, options, connector UUIDs) are **redacted**. The
> live Airtable base and Inkbox identity hold the real values.

| Name | Record | Phone | Email |
|------|--------|-------|-------|
| Clark Kent | `rec_REDACTED` | +15555550111 | clark.kent@example.com |
| Peter Parker | `rec_REDACTED` | +15555550122 | — |
| Bruce Banner | `rec_REDACTED` | +15555550133 | — |
| Ororo Munroe | `rec_REDACTED` | +15555550144 | — |
| Scott Summers | `rec_REDACTED` | +15555550155 | scott.summers@example.com |
| Jean Grey | `rec_REDACTED` | +15555550166 | — |

**Event:** "OG-Pickleball — Mon 8/17 7:30 PM" `rec_REDACTED` · Court 3A (Midtown) · Capacity 4 · Status Full

**RSVPs (after the bullpen demo — Full 4/4):**
- In: Clark `rec_REDACTED`, Peter `rec_REDACTED`, Bruce `rec_REDACTED`, Jean `rec_REDACTED`
- Out: Ororo `rec_REDACTED`
- Bullpen: Scott `rec_REDACTED`

> This reflects a **demo** run (Ororo dropped, Jean claimed the spot). If Monday is a real game, reset to: Ororo → In, Jean & Scott → Bullpen.

## Connector constraints (don't re-learn these)

- Airtable connector **can't** add/rename select options, set option colors, or set interface theme; `update_field` only edits formulas. Appearance/schema-color changes are manual UI steps.
- **Inkbox** is the notification connector (replaced the Twilio placeholder — Twilio's MCP is search-only). Identity `lineup` `INKBOX_IDENTITY_ID`, connector UUID `INKBOX_CONNECTOR_UUID`. **Email live & tested** (`lineup@inkboxmail.com`); **iMessage** operator-linked but provisioning + consent-gated (recipient must text `lineup` first; not self-testable from the operator phone +15555550111); **SMS** needs a number + A2P registration. `lineup-notify` wired to Inkbox (iMessage → SMS → email).
- Cowork can't push to GitHub (no credentials) — user runs `git`/`gh` themselves.

## Open next-steps

1. **Theme the dashboard (manual, ~2 min):** RSVPs → Status field colors → In = Gray dark (ink), Bullpen = Yellow (honey), Out = Gray light; interface accent → Orange/Yellow. Kanban + tiles recolor automatically.
2. **README brand section** — document the logo/favicon set (offered, not yet done).
3. **Dashboard scaling** — add a date filter / Events page so "tonight" means tonight once there's more than one event.
4. **Real SMS** — connect Inkbox to actually send the bullpen call (approval-gated); currently drafts only.
5. **Reset demo → real game** if Monday is live (see RSVP note above).
6. **Future skills** (roadmap): `lineup-checkin`, `lineup-availability`, `lineup-matchmaking`, `lineup-standings`, `lineup-payments`, `lineup-venue`, `lineup-digest`.
7. **Push to GitHub** under the `werkrbee` org (user action).

## How to resume

Read this file + `README.md` + `data/airtable-schema.md`. The Airtable base is the
live source of truth. IDs here are redacted for the public repo — restore the real
base/table/record IDs from the connected Airtable (e.g. `list_bases` →
`list_tables_for_base` → `list_records_for_table`) before querying.
