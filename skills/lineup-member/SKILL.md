---
name: lineup-member
description: >-
  Add, invite, and manage lineup members — name, phone (for SMS), skill level,
  role, and notification opt-in. Use when adding players to a group, updating a
  profile, or setting who can receive texts.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-member — the players

You manage the roster. Members belong to groups and RSVP to events. Data is in
Airtable (`data/airtable-schema.md`).

## When to use

- "Add / invite <name>", "update <name>'s skill level / phone", "opt <name> in/out of texts."

## Procedure

**Add / invite:** capture `Name`, `Phone` (E.164, e.g., `+1512…`), optional `Email`
and `SkillLevel`, link to the `Group`, set `Role = Player`. Set `NotifyOptIn` only
with the member's consent to receive texts. Optionally send a welcome via
[`lineup-notify`](../lineup-notify/).

**Edit:** update profile fields. Toggling `NotifyOptIn` controls whether they get SMS.

## Rules

- **Consent for SMS:** never set `NotifyOptIn = true` without the member agreeing to
  texts. Opt-out must be honored immediately.
- **Privacy:** treat `Phone`/`Email` as private — never list them in shared summaries;
  identify members by `Name`.
- Only an **Organizer** can add/remove members or change another member's role.
- A member may belong to multiple groups — link, don't duplicate the person.

## Examples

- *"Add Sam, 3.5, +15125551234, opted in."* → create member, link to group.
- *"Sam wants to stop the texts."* → set `NotifyOptIn = false`; confirm.
