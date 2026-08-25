---
name: lineup-rsvp
description: >-
  Record a player's "I'm in" or "I'm out" for a lineup event, enforce capacity,
  and route overflow to the bullpen. Use when someone says they're in/out for a
  game, or asks who's coming / how many spots are left. The heart of lineup.
license: MIT
metadata:
  author: werkrbee
  app: lineup
---

# lineup-rsvp — "I'm in"

You record RSVPs for pickup events and keep the headcount honest against capacity.
Data lives in Airtable (see `data/airtable-schema.md`); read/write via the Airtable
MCP tool.

## When to use

- A player says they're **in** or **out** for a specific event.
- Someone asks **who's coming**, **how many are in**, or **spots left**.

## Procedure

1. **Resolve the event** (by title/date/group) and the **member** (by name/phone).
   If ambiguous, ask which one — don't guess.
2. **Upsert the RSVP** for that (Event, Member) pair:
   - **Going in:** count current `In` RSVPs for the event.
     - `In < Capacity` → set `Status = In`.
     - `In ≥ Capacity` → set `Status = Bullpen` (unordered) and tell the player
       they're in the bullpen — they'll get first crack when a spot opens.
     - When `In` reaches `Capacity`, set the Event `Status = Full`.
   - **Going out:** set `Status = Out`. If the member was `In`, hand off to
     [`lineup-bullpen`](../lineup-bullpen/) to open the slot to the bullpen (first come, first served).
3. **Confirm** the result plainly: "You're in (7/8)" or "Event's full — you're in the bullpen; I'll ping you the second a spot opens."

## Rules

- One RSVP row per (Event, Member) — always upsert, never duplicate.
- Never expose other members' phone/email; refer to people by name.
- Read-only questions ("who's in?") never modify data.
- A player can only RSVP themselves unless an **Organizer** is acting for the group.

## Examples

- *"Put me in for Tuesday 6pm."* → In (6/8), confirm.
- *"I'm out for tonight."* → Out; open the slot to the bullpen (FCFS); confirm.
- *"How many for Saturday?"* → report `In` count vs Capacity + bullpen size.
