import { getDb } from "../lib/mongodb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lolla-labs-secret-dev";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  }

  try {
    const db = await getDb();
    const agent = await db
      .collection("agents")
      .findOne({ email: email.toLowerCase().trim() });

    if (!agent) {
      // Timing-safe: always do the comparison even on miss
      await bcrypt.compare(password, "$2b$10$invalidhashfortimingatk000000000");
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const valid = await bcrypt.compare(password, agent.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { email: agent.email, name: agent.name, role: agent.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(200).json({
      token,
      email: agent.email,
      name: agent.name,
      expiresIn: JWT_EXPIRES,
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
