<p align="center">
  <img src="assets/lineup-logo.svg" alt="lineup — the RSVP product of SportsCopilot, first come first served" width="620">
</p>

# lineup — "I'm in"

Organize pickup sports (pickleball first) — groups, members, events, and the RSVP
loop. **lineup** is the RSVP product of the **SportsCopilot** platform, built as an agent-run app on the werkrbee [House of Hives](https://github.com/werkrbee/ai-hive).
Barry orchestrates; Patricia governs; the data lives in Airtable and reminders go
out by SMS.

> **The loop:** schedule → invite → *"I'm in"* → fill / bullpen → remind → check in.

> **Note:** names, contact details, and infrastructure IDs in this repo are
> **fictionalized/redacted** — superhero pseudonyms, `555` numbers, `example.com`
> emails, and placeholder Airtable/Inkbox IDs. The real roster and live IDs live in the
> connected **Airtable** base and **Inkbox** identity, not in this repo.

## What's here

```text
lineup/
├── skills/                       # the verbs (portable SKILL.md)
│   ├── lineup-group/              # create/manage a club
│   ├── lineup-member/             # roster: invite, profile, SMS opt-in
│   ├── lineup-event/              # schedule / edit / cancel a session
│   ├── lineup-rsvp/               # the heart: "I'm in / out", capacity
│   ├── lineup-bullpen/            # on-call pool: open slots go first-come-first-served
│   └── lineup-notify/             # SMS invites, reminders, spot-open alerts
├── data/
│   └── airtable-schema.md        # the shared data model (Groups/Members/Events/RSVPs)
├── rules/
│   └── lineup-etiquette/AGENTS.md # governance: opt-in, privacy, approvals, fairness
├── tools/
│   ├── airtable.mcp.json         # data store (MCP)
│   └── inkbox.md                # notifications: iMessage · SMS · email (MCP)
└── README.md
```

## Stack (MVP)

- **Data:** Airtable (`SportsCopilot` base — see `data/airtable-schema.md`).
- **Notifications:** Inkbox (iMessage · SMS · email; opt-in only, mass sends need organizer approval).
- **Skills:** the six above, the full RSVP loop.
- **Governance:** `lineup-etiquette` under the Queen Bee's Charter.

## Setup

1. **Airtable:** create the `SportsCopilot` base with the tables in `data/airtable-schema.md`;
   make a personal access token; set `AIRTABLE_API_KEY`.
2. **Inkbox:** connect the Inkbox MCP as agent handle `lineup`; email works out of the box, add iMessage/SMS per `tools/inkbox.md`.
3. **Install the skills** into your harness (they're standard `SKILL.md`):
   ```bash
   cp -R skills/lineup-* ~/.cursor/skills/       # or ~/.claude/skills/, etc.
   ```
   (Or add them to skills-hive and install via its `install.sh`.)
4. **Install the ruleset** as instructions — render `rules/lineup-etiquette/AGENTS.md`
   into the project (e.g., via rules-hive's `install.sh --ruleset lineup-etiquette`).

## Using it

Talk to the assistant naturally:

- *"Start a Tuesday Pickleball group at Riverside, 8 spots default."*
- *"Open play Tue 6pm — invite the group."*  → drafts the SMS, shows count/cost, sends on your OK.
- *"Put me in for Tuesday."* / *"I'm out tonight."*  → updates the count; an open slot goes to the bullpen (first come, first served).
- *"Who's coming Saturday?"*  → live headcount + bullpen.

## Roadmap (phase 2)

`lineup-checkin` · `lineup-availability` (best-time polls) · `lineup-matchmaking`
(balanced teams/rotations) · `lineup-standings` (ladder) · `lineup-payments`
(court-fee splits) · `lineup-venue` · `lineup-digest`.

## License

MIT.
