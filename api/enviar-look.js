import { getDb } from "../lib/mongodb.js";
import { uploadImage } from "../lib/cloudinary.js";
import Busboy from "busboy";

export const config = {
  api: {
    bodyParser: false, // We parse multipart manually
  },
};

/**
 * POST /api/enviar-look
 * Accepts multipart/form-data with fields: nome, altura, cidade, categoria, descricao, imagem
 */
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Parse multipart form
    const { fields, file, filename, mimetype } = await parseForm(req);

    // Validate required fields
    const { nome, altura, cidade, categoria, descricao } = fields;
    if (!nome || !altura || !cidade || !categoria || !descricao) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    if (!file) {
      return res.status(400).json({ error: "Imagem é obrigatória" });
    }

    // Validate image type
    if (!mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "O arquivo deve ser uma imagem" });
    }

    // Validate altura
    const alturaNum = parseInt(altura);
    if (isNaN(alturaNum) || alturaNum < 140 || alturaNum > 220) {
      return res
        .status(400)
        .json({ error: "Altura inválida (entre 140 e 220 cm)" });
    }

    // Upload to Cloudinary
    const imagem_url = await uploadImage(file, "lolla-labs/looks");

    // Save to MongoDB
    const db = await getDb();
    const look = {
      nome: nome.trim(),
      altura: alturaNum,
      cidade: cidade.trim(),
      categoria: categoria.toLowerCase().trim(),
      descricao: descricao.trim().slice(0, 500),
      imagem_url,
      data_envio: new Date().toISOString(),
      status: "pendente",
      comentario_agente: null,
    };

    const result = await db.collection("looks").insertOne(look);

    return res.status(201).json({
      success: true,
      id: result.insertedId,
      message: "Look enviado com sucesso! Nossa equipe irá analisar em breve.",
    });
  } catch (err) {
    console.error("[enviar-look]", err);
    return res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
}

/**
 * Parse multipart/form-data using Busboy
 */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    });

    const fields = {};
    let fileBuffer = null;
    let filename = "";
    let mimetype = "";

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (name, stream, info) => {
      filename = info.filename;
      mimetype = info.mimeType;
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", () => {
      resolve({ fields, file: fileBuffer, filename, mimetype });
    });

    bb.on("error", reject);

    req.pipe(bb);
  });
}
