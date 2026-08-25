// lineup — outbound WhatsApp send (Azure Communication Services)
// Phase 1-2 skeleton. HTTP-triggered. Sends either an approved template
// (business-initiated) or a free-form session text (within the 24h window).
//
// Env:
//   ACS_CONNECTION_STRING  - ACS resource connection string
//   WHATSAPP_CHANNEL_ID    - WhatsApp channel registration GUID
//
// NOTE: the template.bindings/values shape depends on the installed
// @azure/communication-messages version and must match each approved Meta
// template's variables. Treat this as a skeleton and reconcile with the SDK docs.

const { app } = require("@azure/functions");
const { NotificationMessagesClient } = require("@azure/communication-messages");

const client = new NotificationMessagesClient(process.env.ACS_CONNECTION_STRING);
const channelId = process.env.WHATSAPP_CHANNEL_ID;

// lineup message type -> approved Meta template name
const TEMPLATES = {
  invite: "lineup_event_invite",
  reminder: "lineup_reminder",
  spot_open: "lineup_spot_open",
  cancellation: "lineup_cancellation",
};

app.http("sendWhatsApp", {
  methods: ["POST"],
  authLevel: "function",
  handler: async (request, context) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: "invalid JSON body" } };
    }

    const { to, kind } = body;
    if (!to || !kind) {
      return { status: 400, jsonBody: { error: "required: 'to' (E.164) and 'kind'" } };
    }
    const recipients = Array.isArray(to) ? to : [to];

    try {
      let result;

      if (kind === "text") {
        // Free-form session message — valid only within 24h of the recipient's last inbound.
        if (!body.message) {
          return { status: 400, jsonBody: { error: "'message' required for kind=text" } };
        }
        result = await client.send({
          channelRegistrationId: channelId,
          to: recipients,
          kind: "text",
          message: body.message,
        });
      } else {
        // Business-initiated — must map to an approved template.
        const templateName = TEMPLATES[kind];
        if (!templateName) {
          return { status: 400, jsonBody: { error: `unknown kind: ${kind}` } };
        }
        result = await client.send({
          channelRegistrationId: channelId,
          to: recipients,
          kind: "template",
          template: {
            name: templateName,
            language: body.language || "en_US",
            // 'values' = positional {{1}},{{2}}... in the approved template.
            // Some SDK versions want structured 'bindings' instead — match your template.
            values: body.values,
            bindings: body.bindings,
          },
        });
      }

      const messageIds = (result.receipts || []).map((r) => r.messageId);
      context.log(`lineup: sent ${kind} to ${recipients.length} recipient(s)`, messageIds);
      return { status: 200, jsonBody: { ok: true, kind, messageIds } };
    } catch (err) {
      context.error("lineup: WhatsApp send failed", err);
      return { status: 502, jsonBody: { ok: false, error: err.message } };
    }
  },
});
