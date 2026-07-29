import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 5000),
  db: {
    host: requireEnv("DB_HOST", "127.0.0.1"),
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    name: requireEnv("DB_NAME"),
    encrypt: String(process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
    trustServerCertificate:
      String(process.env.DB_TRUST_SERVER_CERTIFICATE || "true").toLowerCase() === "true",
    trustedConnection: String(process.env.DB_TRUSTED_CONNECTION || "false").toLowerCase() === "true",
  },
  jwtSecret: requireEnv("JWT_SECRET"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

if (!config.db.trustedConnection && !config.db.user) {
  throw new Error("Missing required environment variable: DB_USER");
}
