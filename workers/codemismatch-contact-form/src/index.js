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

function eventStreamResponse(body, origin) {
  const headers = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(body, { status: 200, headers });
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
      if (!env.ZAI_API_KEY) {
        return jsonResponse({ error: "The Architect's free GLM model is not configured yet." }, 503, origin);
      }

      const encoder = new TextEncoder();
      const abortController = new AbortController();
      let cancelled = false;
      const stream = new ReadableStream({
        start(controller) {
          const sendEvent = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          sendEvent({ progress: "waiting_for_model" });
          const pump = async () => {
            try {
              for (const model of ["glm-4.7-flash", "glm-4.5-flash"]) {
                const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${env.ZAI_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    model,
                    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
                    max_tokens: 800,
                    ...(model === "glm-4.7-flash" ? { thinking: { type: "disabled" } } : {}),
                    stream: true
                  }),
                  signal: abortController.signal
                });
                if (!response.ok) {
                  const failure = await response.json().catch(() => ({}));
                  const providerCode = String(failure.error?.code || failure.code || "unknown").slice(0, 40);
                  console.error("Z.ai chat request failed", model, response.status, providerCode);
                  if (model === "glm-4.7-flash" && ["1302", "1305"].includes(providerCode)) continue;
                  sendEvent({ error: "The free GLM models are temporarily unavailable." });
                  controller.close();
                  return;
                }
                if (!response.body) {
                  sendEvent({ error: "The model did not provide a response stream." });
                  controller.close();
                  return;
                }
                console.log("Z.ai chat stream started", model);
                sendEvent({ progress: "model_ready", model });
                const reader = response.body.getReader();
                while (true) {
                  const { value, done } = await reader.read();
                  if (done || cancelled) break;
                  controller.enqueue(value);
                }
                if (!cancelled) controller.close();
                return;
              }
              sendEvent({ error: "The free GLM models are temporarily unavailable." });
              controller.close();
            } catch (error) {
              if (!cancelled) {
                console.error("Z.ai chat request failed", error);
                sendEvent({ error: "The Architect is temporarily unavailable." });
                controller.close();
              }
            }
          };
          pump();
        },
        cancel() {
          cancelled = true;
          abortController.abort();
        }
      });
      return eventStreamResponse(stream, origin);
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
