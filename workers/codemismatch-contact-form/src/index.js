const SITE = "https://codemismatch.com";
const CONTACT = "contact@codemismatch.com";
const RECIPIENTS = ["contact@codemismatch.com", "partnerships@codemismatch.com"];
const ALLOWED_ORIGINS = new Set([SITE, "https://www.codemismatch.com"]);

const SYSTEM_PROMPT = "You are The Architect, CodeMismatch's AI consulting advisor. CodeMismatch helps businesses use AI and automation to improve real operations. Our current target market is accounting firms. Help them identify practical automations for intake, document collection and classification, bookkeeping workflows, reconciliations, month-end close, reporting, client communication, and handoffs. Treat confidentiality, auditability, and human review as core design requirements. Ask focused questions when details are missing, state assumptions, and give concrete options and trade-offs. Do not promise unconfirmed capabilities or results. You may also advise on broader AI consulting, enterprise architecture, legacy modernization, and cloud strategy. Keep answers clear, practical, and professional.";

const CHAT_MODELS = new Set([
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
  "@cf/google/gemma-4-26b-a4b-it",
  "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
  "@cf/zai-org/glm-4.7-flash",
  "@cf/openai/gpt-oss-120b",
  "@cf/openai/gpt-oss-20b",
  "@cf/ibm-granite/granite-4.0-h-micro",
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  "@cf/meta/llama-3.2-11b-vision-instruct",
  "@cf/meta/llama-3.2-1b-instruct",
  "@cf/meta/llama-3.2-3b-instruct",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
  "@cf/nvidia/nemotron-3-120b-a12b",
  "@cf/qwen/qwen2.5-coder-32b-instruct",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/qwen/qwen3.8-27b",
  "@cf/qwen/qwq-32b"
]);
const DEFAULT_CHAT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

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
      const model = CHAT_MODELS.has(data.model) ? data.model : DEFAULT_CHAT_MODEL;
      const messages = data.messages.map((item) => ({
        role: item && (item.role === "assistant" || item.role === "user") ? item.role : "invalid",
        content: typeof (item && item.content) === "string" ? item.content.slice(0, 3000) : ""
      }));
      if (messages.some((item) => item.role === "invalid" || !item.content.trim()) || messages[messages.length - 1].role !== "user") {
        return jsonResponse({ error: "Invalid messages" }, 400, origin);
      }
      try {
        const result = await env.AI.run(model, {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_completion_tokens: 800,
          ...(model === "@cf/openai/gpt-oss-120b" || model === "@cf/openai/gpt-oss-20b" ? { reasoning_effort: "medium" } : {}),
          ...(model === "@cf/qwen/qwen3.8-27b" ? { reasoning_effort: "low" } : {})
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
