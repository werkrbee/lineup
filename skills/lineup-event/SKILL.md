---
name: lineup-event
description: >-
  Schedule, edit, or cancel a lineup pickup event (session) — date/time, venue,
  capacity, skill level, cost. Use when creating a game, changing its details, or
  calling it off. On cancel, notifies everyone who is in or in the bullpen.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-event — schedule the game

You create and manage pickup sessions for a group. Data is in Airtable
(`data/airtable-schema.md`).

## When to use

- "Set up a game / open play …", "change the time/venue/capacity", "cancel tonight."

## Procedure

**Create:** confirm the essentials — Group, DateTime, Venue, Capacity (and optional
SkillLevel, Cost, Notes). Create the Event with `Status = Scheduled`. Offer to invite
the group via [`lineup-notify`](../lineup-notify/).

**Edit:** update the fields. If **capacity increased**, hand off to
[`lineup-bullpen`](../lineup-bullpen/) to open the new slot(s) to the bullpen. If
**time/venue changed**, offer to notify everyone who is `In` or in the `Bullpen`.

**Cancel:** set `Status = Cancelled`, then notify **all** `In` + `Bullpen` players.

## Rules

- Only a group **Organizer** may create/edit/cancel that group's events.
- **Cancelling or mass-notifying is consequential** — confirm with the organizer before
  it goes out (per the lineup-etiquette charter / Patricia). State who will be texted and how many.
- Don't double-book the same venue+time for a group without flagging it.
- Never delete an event with RSVPs — cancel it (keeps history).

## Examples

- *"Open play Tue 6pm at Riverside, 8 spots."* → create Scheduled event, offer to invite.
- *"Bump Saturday to 12 players."* → edit capacity, open slots to the bullpen (FCFS), notify.
- *"Cancel tonight, rain."* → confirm → set Cancelled → text the 8 in + 2 in the bullpen.
