import { getDb } from "../lib/mongodb.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lolla-labs-secret-dev";

/**
 * GET /api/looks
 * Returns all looks. Requires Authorization header with Bearer token.
 * Query params: status (pendente|aprovado|rejeitado), categoria
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Auth guard
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Não autorizado" });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  try {
    const db = await getDb();

    // Build query
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.categoria) query.categoria = req.query.categoria;

    const looks = await db
      .collection("looks")
      .find(query)
      .sort({ data_envio: -1 })
      .limit(200)
      .toArray();

    return res.status(200).json({ looks, total: looks.length });
  } catch (err) {
    console.error("[looks]", err);
    return res.status(500).json({ error: "Erro ao buscar looks" });
  }
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
