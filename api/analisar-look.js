import { getDb } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lolla-labs-secret-dev';

/**
 * PATCH /api/analisar-look
 * Body: { id, status, comentario_agente? }
 * Requires Authorization: Bearer <token>
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Auth guard
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  let agentInfo;
  try {
    agentInfo = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  const { id, status, comentario_agente } = req.body || {};

  if (!id || !status) {
    return res.status(400).json({ error: 'ID e status são obrigatórios' });
  }

  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ error: 'Status deve ser "aprovado" ou "rejeitado"' });
  }

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const db = await getDb();

    const update = {
      $set: {
        status,
        comentario_agente: comentario_agente?.trim() || null,
        analisado_em: new Date().toISOString(),
        analisado_por: agentInfo.email
      }
    };

    const result = await db.collection('looks').updateOne(
      { _id: objectId },
      update
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Look não encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: `Look ${status} com sucesso`
    });

  } catch (err) {
    console.error('[analisar-look]', err);
    return res.status(500).json({ error: 'Erro ao analisar look' });
  }
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
