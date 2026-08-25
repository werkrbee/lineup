# lineup — STATUS

_Snapshot of the ai-hive implementation for **lineup**. Last updated: 2026-08-19._

**Assessment:** a fully built, live-running MVP that dogfoods the werkrbee House of
Hives. All six skills, governance, tools, brand, and a working Airtable backend are
in place. Outstanding: real SMS sending, dashboard theming, and the GitHub push —
none blocking.

## Where lineup sits in the House

lineup is an **initiative** built on the House of Hives — it consumes the hive
patterns rather than being a hive itself. Barry (King Bee) orchestrates; Patricia
(Queen Bee) governs. Hierarchy: **SportsCopilot** (platform) → **lineup** (product)
→ **In / Out / Bullpen** (RSVP statuses).

## Layer status

| Layer (hive pattern) | lineup component | State |
|----------------------|------------------|-------|
| Capabilities (skills-hive) | 6 `lineup-*` skills | ✅ built |
| Instructions (rules-hive) | `lineup-etiquette` charter | ✅ built |
| Tools — data (mcp-hive) | Airtable MCP | ✅ live |
| Tools — notify (mcp-hive) | Inkbox (iMessage/SMS/email) | 🟡 email live; iMessage/SMS provisioning |
| Actors (agents-hive) | Barry + Patricia | ✅ inherited |
| Runtime / data | Airtable base + dashboard | ✅ live |
| Brand | logo, icon, favicon set | ✅ built |
| Continuity | `PROJECT_STATE.md` | ✅ written |

## Components

**Skills** ✅ — `lineup-group`, `lineup-member`, `lineup-event`, `lineup-rsvp`,
`lineup-bullpen`, `lineup-notify` (portable `SKILL.md`, `metadata.app: lineup`).
The bullpen skill implements first-come-first-served claim (replaced ordered
waitlist; waitlist retained as a documented future mode).

**Governance** ✅ — `rules/lineup-etiquette/AGENTS.md` under the Queen Bee's Charter:
opt-in-only SMS, contact privacy, organizer approval for mass/consequential actions,
FCFS fairness. Carve-out: bullpen open-slot calls send automatically (event-driven);
organizer blasts still need approval.

**Tools** — `tools/airtable.mcp.json` (data, connected & live); `tools/inkbox.md`
(Inkbox connector, connected as agent `lineup` — email live & tested, iMessage/SMS
provisioning; see SMS below).

**Notifications (Inkbox)** — identity `lineup` (`INKBOX_IDENTITY_ID`),
connector UUID `INKBOX_CONNECTOR_UUID`.
- Email ✅ `lineup@inkboxmail.com` — tested, delivered 2026-08-20.
- iMessage ⚠️ operator device linked (+15555550111); dedicated number provisioning;
  **consent-gated** (recipient must text `lineup` first) and **not self-testable** from
  the operator phone.
- SMS ❌ needs a number + A2P registration in the Inkbox dashboard.
- `lineup-notify` is wired to Inkbox (iMessage → SMS → email routing).

**Runtime** ✅ — Airtable base `SportsCopilot` (`app_LINEUP_BASE`), tables
Groups/Members/Events/RSVPs, plus a published Interface dashboard (3 pages:
At a Glance, Tonight's Game & Bullpen, Group Roster). Live data: OG-Pickleball,
6 members (all opt-in), one event Mon 8/17 · Court 3A · cap 4 · Full; RSVPs
In ×4 (Clark, Peter, Bruce, Jean) / Out (Ororo) / Bullpen (Scott) — demo state.

**Brand** ✅ — honey/ink logo, icon, and full favicon/PWA set matching the hive
family; logo embedded in `README.md`.

**Continuity** ✅ — `PROJECT_STATE.md` holds all live IDs + resume instructions.

## Not done / constraints

- **Real SMS** — Inkbox connected; email live & tested. SMS needs a provisioned number + A2P registration; iMessage needs its dedicated number to finish provisioning (and a real recipient to opt in).
- **Dashboard theme** — manual UI step; connector can't set option colors or interface theme.
- **README brand section** — not yet written.
- **Dashboard date filter** — needed once there's more than one event.
- **Airtable cross-references** — single-line text, not linked records (future upgrade).
- **GitHub push** — Cowork can't push; user action under the `werkrbee` org.

## Open next-steps

1. Enable real SMS via Inkbox (in progress), then wire `lineup-notify` to it.
2. Theme the dashboard (honey/ink) — manual.
3. Add a README brand section.
4. Add a date/Events filter to the dashboard.
5. Reset demo → real game if Monday is live.
6. Roadmap skills: `lineup-checkin`, `-availability`, `-matchmaking`, `-standings`, `-payments`, `-venue`, `-digest`.
7. Push to GitHub under `werkrbee`.
8. **Evaluate ACS + WhatsApp as the production channel** (werkrbee Azure account on hand). Solves the operator-device problem, cross-platform, officially supported/compliant. Full design + build plan: [`docs/acs-whatsapp-backend.md`](docs/acs-whatsapp-backend.md). Note: implies an architecture shift from *agent-run app* → *always-on backend service* (Azure Functions run the loop; agent becomes admin).
