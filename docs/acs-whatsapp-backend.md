# lineup on Azure Communication Services + WhatsApp — design & build plan

_A deeper dive on what it would take to move lineup's player-facing channel from
Inkbox (iMessage) to a WhatsApp backend on Azure Communication Services (ACS)._

## TL;DR

- **ACS is Azure's Inkbox equivalent** for SMS/email/**WhatsApp** — but it's a
  **backend platform (SDK/APIs), not an agent connector.** There's no ACS MCP, so the
  agent can't call it directly; you build a small service and lineup triggers it.
- **WhatsApp solves the operator-device problem.** No relay, no connected phone, no
  "you can't be operator and player." Every participant — including Clark — is a
  normal recipient. It's cross-platform (Android too), officially supported, and
  compliant.
- **The real cost isn't the plumbing — it's an architecture shift.** WhatsApp's 24-hour
  window and instant-RSVP needs push lineup from an *agent-run app* (agent is the
  runtime) toward a *backend service* (always-on Functions are the runtime; the agent
  becomes the admin/ops console). That's the big decision, not the ACS wiring.
- **Effort:** ~1–2 days provisioning + template approval wait; ~1–2 weeks for a solid
  backend (send + inbound handler + bullpen logic + Airtable/DB). MCP wrapper optional (~1 day).

## What changes conceptually

Today lineup is **agent-run**: the Cowork agent (Barry) is the runtime — it reads
Airtable, decides, and sends via the Inkbox MCP while a session is open. That's perfect
for dogfooding, but it only acts when the agent is running.

WhatsApp forces **always-on**:

- **The 24-hour window.** If a player messages you, you may reply free-form for 24h;
  outside that, business-initiated messages (invite, reminder, spot-open) must use a
  **pre-approved template**. Handling this reliably needs a service that's always
  listening, not an agent session.
- **Instant RSVP + bullpen claims.** "First to reply IN gets the seat" is a real-time
  race. It must be resolved server-side the moment a message arrives — not whenever an
  agent next runs.

So the production shape is: **Azure Functions own the runtime logic; the agent becomes
the admin surface** (set up games, review rosters, compose/adjust templates, handle
exceptions). lineup's skills/rules/data model stay the source of truth for *behavior*;
the Functions are a faithful implementation of them.

## Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │                  Azure                        │
   WhatsApp      │  ┌───────────────┐      ┌──────────────────┐  │
   users  ◄──────┼─►│ ACS Advanced  │◄────►│ Azure Functions  │  │
  (players)      │  │ Messaging     │ Event│  - outbound send │  │
                 │  │ (WhatsApp ch.)│ Grid │  - inbound handler│  │
                 │  └───────────────┘      │  - RSVP/bullpen  │  │
                 │        ▲                 │    state machine │  │
                 │        │ Meta Cloud API  └────────┬─────────┘  │
                 └────────┼──────────────────────────┼───────────┘
                          │                           │
                   Meta WhatsApp                 Data store
                   Business Account         (Airtable now → DB later)
                                                      ▲
                                                      │ admin / setup / exceptions
                                                 lineup agent (Cowork / Barry)
```

Components:

1. **ACS resource** + **Advanced Messaging (WhatsApp) channel**.
2. **Meta Business Account + WhatsApp Business Account (WABA)**, a phone number (from ACS
   or BYO) that can receive SMS for Meta verification, and acceptance of the Meta Cloud
   API + WhatsApp terms. (Display-name review isn't required to start sending.)
3. **Azure Functions** (serverless — cheap, event-driven, right-sized):
   - **Outbound send** — HTTP-triggered; the lineup agent (or a scheduler) calls it to
     send a template or session message via the ACS Messages SDK.
   - **Inbound handler** — subscribed to **Event Grid** WhatsApp events; parses replies
     (IN / OUT), runs the RSVP/bullpen logic, writes state, and replies within the 24h
     window.
4. **Data store** — Airtable stays fine for the MVP/roster; see the concurrency note
   below for why the bullpen may want a real DB at scale.
5. **Message templates** — pre-registered, Meta-approved templates for business-initiated
   messages (invite, reminder, spot-open, cancellation).

## WhatsApp / Meta specifics that shape the build

- **Opt-in is mandatory.** WhatsApp requires prior opt-in before business-initiated
  messages. Maps cleanly to `NotifyOptIn` — a player's first inbound (or an explicit
  opt-in) unlocks messaging.
- **Templates vs. session messages.** This maps *beautifully* onto lineup's flows:
  - *Business-initiated* (must be an approved template): **event invite, day-of
    reminder, bullpen spot-open call, cancellation.** These need Meta approval up front
    (utility category; approval is usually quick but not instant, and categorization
    affects pricing/limits).
  - *Session/free-form* (within 24h of a player's message): **RSVP confirmations**
    ("You're in, 3/4", "You're in the bullpen"). Since the player just texted IN, the
    window is open — no template needed.
- **Inbound via Event Grid.** Delivery/read receipts and inbound messages arrive as
  Event Grid events; a Function (or Logic App / webhook) processes them in real time.
- **A verified sender number** is required (ACS-provisioned or BYO, SMS-reachable for
  the Meta verification code).

## The bullpen concurrency problem (important)

"First valid claim wins" is a race across multiple inbound messages. Server-side this
needs an **atomic seat check-and-fill**. Airtable is convenient but is *not* a strong
concurrency primitive — two near-simultaneous IN replies could both read `In=3 < 4` and
both be accepted before either write lands, overfilling the seat.

Options, in order of effort:

- **Serialize per event** — process inbound events for a given event through a single
  queue/partition (e.g., Azure Storage Queue or Service Bus session by `event_id`) so
  claims are handled one at a time. Keeps Airtable, adds a queue. Recommended first step.
- **Move state to a transactional DB** — Azure SQL, Postgres, or Cosmos DB with a
  conditional update (`UPDATE ... WHERE in_count < capacity`) for a true atomic claim.
  The right long-term home; Airtable becomes a mirror/admin view.

This is the single most important engineering detail: the bullpen's whole promise is
"overfill-proof," and that guarantee has to move from the agent's careful sequencing
into the backend.

## How it plugs into lineup

- **Skills/rules/data model are unchanged as the spec.** `lineup-rsvp`, `lineup-bullpen`,
  `lineup-notify`, and `lineup-etiquette` describe the behavior the Functions implement.
- **`lineup-notify` gets a second adapter.** Today it targets Inkbox; add an ACS path
  (send via the outbound Function). The skill's routing note becomes:
  iMessage/Inkbox (MVP) **or** WhatsApp/ACS (production).
- **Optional MCP wrapper.** To let the agent trigger sends the same way it calls Inkbox,
  wrap the outbound Function in a tiny MCP server (`tools/acs-whatsapp.mcp.json`). ~1 day.
  Not required if the agent calls the Function over plain HTTPS.
- **The agent's role narrows to admin:** scheduling games, editing templates, reviewing
  rosters, and handling exceptions — while the Functions run the day-to-day loop.

## Build phases

1. **Provision (½–1 day work + approval wait).** Create ACS resource + Advanced Messaging
   channel; create/connect WABA; verify a number; accept Meta terms; submit the 3–4
   templates (invite, reminder, spot-open, cancellation) for approval.
2. **Outbound send (1–2 days).** Function using the ACS Messages SDK; send template +
   session messages; wire `lineup-notify` to it; test to a real WhatsApp number.
3. **Inbound handler (2–4 days).** Event Grid subscription → Function; parse IN/OUT;
   update `NotifyOptIn`/RSVP; reply within the 24h window.
4. **Bullpen concurrency (2–3 days).** Add per-event serialization (queue) or move seat
   state to a transactional DB; port the FCFS claim + event Full/Scheduled flips.
5. **Hardening (ongoing).** Opt-in/opt-out handling, template edge cases, delivery-failure
   reporting, observability (App Insights), and the `lineup-etiquette` approval gates.

Rough total: **~1–2 weeks of focused engineering** past provisioning, mostly in phases
3–4. An MVP that only sends WhatsApp (phase 1–2) is a couple of days.

## Costs (verify current rates)

Two stacked costs: **ACS per-message/channel fees** + **Meta's WhatsApp pricing**
(conversation/per-message, categorized as utility/marketing/authentication/service).
Rates change and vary by country, so pull current numbers from the ACS pricing page and
Meta's WhatsApp pricing before committing. For a single family Mahjong group the volume
is trivially cheap; the point of pricing diligence is the *multi-group* future.

## Risks & decisions to make

- **Architecture commitment.** This is the step from "agent-run prototype" to "hosted
  service." Worth doing only when you want lineup to run without an agent session open.
- **Template rigidity.** Business-initiated messages must fit approved templates —
  less free-form than iMessage. Design the 3–4 templates with variables up front.
- **Data store.** Decide early whether Airtable-plus-a-queue is enough or the bullpen
  warrants a real DB. Cheaper to choose now than to migrate later.
- **Channel strategy.** WhatsApp is great for many families/friend groups, but not
  universal in the US. Consider WhatsApp (ACS) + SMS fallback (ACS) as the pair, and
  keep Inkbox/iMessage as an optional nicety, not the backbone.

## Recommendation

Keep **Inkbox/iMessage for this week's real-people Mahjong test** — it's already
wired and needs no build. In parallel, treat **ACS + WhatsApp as the production channel
track**: it removes the operator-device conflict entirely, is cross-platform and
compliant, and runs on infrastructure werkrbee already owns. Start with **phases 1–2**
(provision + outbound) as a low-commitment spike to validate WhatsApp delivery to a real
number, then decide on the always-on backend (phases 3–4) once the MVP proves people
actually use lineup.

## Sources

- [What is Azure Communication Services?](https://learn.microsoft.com/en-us/azure/communication-services/overview)
- [Advanced Messaging for WhatsApp — overview](https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview)
- [Register a WhatsApp Business Account with ACS](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/advanced-messaging/whatsapp/connect-whatsapp-business-account)
- [Handle Advanced Messaging events (Event Grid)](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/advanced-messaging/whatsapp/handle-advanced-messaging-events)
- [Try the WhatsApp sandbox](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/advanced-messaging/whatsapp/whatsapp-sandbox-quickstart)
