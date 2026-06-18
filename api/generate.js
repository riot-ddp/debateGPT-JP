const DEFAULT_MODEL = "gpt-5.2";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, { error: "Vercel環境変数 OPENAI_API_KEY が未設定です。" });
  }

  try {
    const { model, messages = [], prompt } = req.body || {};
    if (!prompt) return sendJson(res, 400, { error: "prompt is required" });

    const instructions =
      messages.find((message) => message.role === "system")?.content ||
      "あなたは日本語で短く討論するAIです。指定された立場を守り、虚偽の断定を避け、1〜2文で簡潔に答えてください。";
    const input = [
      ...messages.filter((message) => message.role !== "system"),
      { role: "user", content: prompt },
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || process.env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions,
        input,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: data?.error?.message || "OpenAI API request failed.",
      });
    }

    const content = getOutputText(data);
    if (!content) {
      return sendJson(res, 502, { error: "OpenAI APIから空の応答が返りました。" });
    }

    return sendJson(res, 200, { content, model: data.model || model || DEFAULT_MODEL });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function getOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }

  return parts.join("\n").trim();
}

function sendJson(res, status, data) {
  res.status(status).setHeader("content-type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}
