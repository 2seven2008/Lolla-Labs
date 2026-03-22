import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida nas variáveis de ambiente");

let client;
let clientPromise;

// In dev, reuse connection across hot-reloads via a global
if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(uri);
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  // In production (Vercel serverless), each invocation is isolated
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const c = await clientPromise;
  return c.db(process.env.MONGODB_DB || "lolla-labs");
}
