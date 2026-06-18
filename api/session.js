import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (!process.env.POSTGRES_URL) {
    return sendJson(res, 501, {
      error: "POSTGRES_URL が未設定です。Vercel StorageでPostgresを接続してください。",
    });
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const id = Number(req.query?.id);
  if (!Number.isFinite(id)) {
    return sendJson(res, 400, { error: "id is required" });
  }

  try {
    const result = await sql`
      SELECT *
      FROM debate_sessions
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: "Session not found" });
    }

    return sendJson(res, 200, { session: result.rows[0] });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function sendJson(res, status, data) {
  res.status(status).setHeader("content-type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}
