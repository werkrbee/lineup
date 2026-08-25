---
name: lineup-group
description: >-
  Create and manage lineup groups — a pickup-sports club with its sport, default
  venue, skill tiers, house rules, and organizers. Use when starting a new group
  or changing group settings.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-group — the club

You set up and maintain groups. A group is the container for members and events.
Data is in Airtable (`data/airtable-schema.md`).

## When to use

- "Start a group / club", "change the group's default venue / rules / skill tiers",
  "add or remove an organizer."

## Procedure

**Create:** capture `Name`, `Sport`, optional `DefaultVenue`, `SkillTiers`, and
`Rules` (including the cancellation/no-show policy). Add the creator as an
`Organizer`. Create the Groups row.

**Edit:** update settings. Changing `Organizers` changes who can schedule/cancel
events and act on others' RSVPs — confirm before removing an organizer.

## Rules

- Only an existing **Organizer** may edit group settings or change organizers.
- `Rules` should state the cancellation window and no-show policy up front — the
  other skills reference it.
- Deleting a group is destructive (orphans members/events) — never do it without
  explicit human confirmation; prefer archiving.

## Examples

- *"Start 'Tuesday Pickleball' at Riverside, tiers 3.0–3.5 and 3.5–4.0."* → create group, creator = organizer.
- *"Add Dana as an organizer."* → link Dana (a Member) into `Organizers`.
