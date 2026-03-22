import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET  = process.env.JWT_SECRET  || 'lolla-labs-secret-dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// Agents are stored in env vars for simplicity.
// In production, add more agents or use a DB collection.
// Format: AGENTS_JSON = '[{"email":"x","hash":"bcrypt_hash","name":"Name"}]'
function getAgents() {
  try {
    const raw = process.env.AGENTS_JSON;
    if (raw) return JSON.parse(raw);
  } catch {}

  // Default demo agent (password: lolla2025)
  return [
    {
      email: 'agente@lollalabs.com',
      // bcrypt hash of 'lolla2025', rounds=10
      hash: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0YDynZkBeom',
      name: 'Agente Lolla',
      role: 'agent'
    }
  ];
}

/**
 * POST /api/login
 * Body: { email, password }
 * Returns: { token, email, name }
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  const agents = getAgents();
  const agent = agents.find(a => a.email.toLowerCase() === email.toLowerCase().trim());

  if (!agent) {
    // Delay to prevent timing attacks
    await new Promise(r => setTimeout(r, 400));
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const valid = await bcrypt.compare(password, agent.hash);

  if (!valid) {
    await new Promise(r => setTimeout(r, 400));
    return res.status(401).json({ error: 'Credenciais inválidas' });
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
    expiresIn: JWT_EXPIRES
  });
}
