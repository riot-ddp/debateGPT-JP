import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const expectedToken = process.env.APP_ACCESS_TOKEN;
  if (expectedToken && req.headers["x-app-access-token"] !== expectedToken) {
    return sendJson(res, 401, { error: "アクセスキーが正しくありません。" });
  }

  if (!process.env.POSTGRES_URL) {
    return sendJson(res, 501, {
      error: "POSTGRES_URL が未設定です。Vercel StorageでPostgresを接続してください。",
    });
  }

  try {
    await ensureTable();

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, created_at, topic, model, user_side, ai_side, personalized, pre_agreement, post_agreement
        FROM debate_sessions
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return sendJson(res, 200, { sessions: rows.rows });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const result = await sql`
        INSERT INTO debate_sessions (
          topic, model, user_side, ai_side, personalized, profile,
          pre_agreement, post_agreement, log
        )
        VALUES (
          ${body.topic || ""},
          ${body.model || ""},
          ${body.userSide || ""},
          ${body.aiSide || ""},
          ${Boolean(body.personalized)},
          ${JSON.stringify(body.profile || {})}::jsonb,
          ${body.preAgreement || null},
          ${body.postAgreement || null},
          ${JSON.stringify(body.log || [])}::jsonb
        )
        RETURNING id, created_at
      `;
      return sendJson(res, 200, { session: result.rows[0] });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS debate_sessions (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      topic TEXT NOT NULL,
      model TEXT NOT NULL,
      user_side TEXT NOT NULL,
      ai_side TEXT NOT NULL,
      personalized BOOLEAN NOT NULL DEFAULT FALSE,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      pre_agreement TEXT,
      post_agreement TEXT,
      log JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `;
}

function sendJson(res, status, data) {
  res.status(status).setHeader("content-type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}
