const SITE = "https://codemismatch.com";
const CONTACT = "contact@codemismatch.com";
const RECIPIENTS = ["contact@codemismatch.com", "partnerships@codemismatch.com"];
const ALLOWED_ORIGINS = new Set([SITE, "https://www.codemismatch.com"]);

const SYSTEM_PROMPT = "You are The Architect, CodeMismatch's AI consulting advisor. CodeMismatch helps businesses use AI and automation to improve real operations. Our current target market is accounting firms. Help them identify practical automations for intake, document collection and classification, bookkeeping workflows, reconciliations, month-end close, reporting, client communication, and handoffs. Treat confidentiality, auditability, and human review as core design requirements. Ask focused questions when details are missing, state assumptions, and give concrete options and trade-offs. Do not promise unconfirmed capabilities or results. You may also advise on broader AI consulting, enterprise architecture, legacy modernization, and cloud strategy. Keep answers clear, practical, and professional.";

function jsonResponse(data, status, origin) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
    if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse({ error: "Origin not allowed" }, 403, origin);

    const path = new URL(request.url).pathname;
    if (path === "/chat") {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);
      let data;
      try { data = await request.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400, origin); }
      if (!Array.isArray(data.messages) || data.messages.length < 1 || data.messages.length > 12) {
        return jsonResponse({ error: "Invalid message history" }, 400, origin);
      }
      const messages = data.messages.map((item) => ({
        role: item && (item.role === "assistant" || item.role === "user") ? item.role : "invalid",
        content: typeof (item && item.content) === "string" ? item.content.slice(0, 3000) : ""
      }));
      if (messages.some((item) => item.role === "invalid" || !item.content.trim()) || messages[messages.length - 1].role !== "user") {
        return jsonResponse({ error: "Invalid messages" }, 400, origin);
      }
      try {
        const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 800
        });
        return jsonResponse({ text: result.response || "I could not formulate a response. Please try again." }, 200, origin);
      } catch (error) {
        console.error("Workers AI request failed", error);
        return jsonResponse({ error: "The Architect is temporarily unavailable." }, 503, origin);
      }
    }

    if (path !== "/" && path !== "/contact") return jsonResponse({ error: "Not found" }, 404, origin);
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

    let data;
    try { data = await request.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400, origin); }
    const name = String(data.name || "").trim().slice(0, 200);
    const email = String(data.email || "").trim().slice(0, 254);
    const message = String(data.message || "").trim().slice(0, 5000);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      return jsonResponse({ error: "Name, valid email, and message are required" }, 400, origin);
    }

    try {
      const result = await env.EMAIL.send({
        from: `CodeMismatch <${CONTACT}>`,
        to: RECIPIENTS,
        replyTo: email,
        subject: "CodeMismatch contact form: " + name.replace(/[\r\n]+/g, " "),
        text: `From: ${name} <${email}>\n\n${message}`
      });
      return jsonResponse({ ok: true, messageId: result.messageId }, 200, origin);
    } catch (error) {
      console.error("Cloudflare Email send failed", error);
      return jsonResponse({ error: "Unable to send message" }, 502, origin);
    }
  }
};
