/**
 * GET /api/seed-agent
 *
 * Seeds the initial agent into the `agents` collection.
 * Idempotent — safe to call multiple times.
 *
 * IMPORTANT: Remove or protect this endpoint after first use in production.
 * You can protect it with a query param secret:
 *   GET /api/seed-agent?secret=<SEED_SECRET>
 *
 * Set SEED_SECRET in your Vercel environment variables.
 */

import { getDb } from "../lib/mongodb.js";
import bcrypt from "bcryptjs";

const SEED_SECRET = process.env.SEED_SECRET;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Optional secret guard — if SEED_SECRET is set, enforce it
  if (SEED_SECRET && req.query.secret !== SEED_SECRET) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const db = await getDb();
    const collection = db.collection("agents");

    // Create unique index on email if not exists
    await collection.createIndex({ email: 1 }, { unique: true });

    const email = "agente@lollalabs.com";
    const existing = await collection.findOne({ email });

    if (existing) {
      return res.status(200).json({
        message: "Agente já existe — nenhuma alteração realizada.",
        email,
      });
    }

    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash("lolla2025", SALT_ROUNDS);

    await collection.insertOne({
      email,
      passwordHash,
      name: "Agente Lolla",
      role: "agent",
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Agente criado com sucesso.",
      email,
    });
  } catch (err) {
    console.error("[seed-agent]", err);
    return res.status(500).json({ error: "Erro ao criar agente" });
  }
}
