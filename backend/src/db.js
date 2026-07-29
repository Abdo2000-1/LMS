import { createRequire } from "module";
import { config } from "./config.js";

const require = createRequire(import.meta.url);
const sql = config.db.trustedConnection ? require("mssql/msnodesqlv8") : require("mssql");

function getBaseSqlConfig() {
  const base = {
    server: config.db.host,
    database: config.db.name,
    options: {
      encrypt: config.db.encrypt,
      trustServerCertificate: config.db.trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  if (config.db.trustedConnection) {
    const trustedConnectionString = [
      "Driver={ODBC Driver 18 for SQL Server}",
      `Server=${config.db.host}`,
      `Database=${config.db.name}`,
      "Trusted_Connection=Yes",
      `TrustServerCertificate=${config.db.trustServerCertificate ? "Yes" : "No"}`,
    ].join(";");

    return {
      ...base,
      driver: "msnodesqlv8",
      connectionString: trustedConnectionString,
      options: {
        ...base.options,
        trustedConnection: true,
      },
    };
  }

  return {
    ...base,
    user: config.db.user,
    password: config.db.password,
    port: config.db.port,
  };
}

export const sqlConfig = getBaseSqlConfig();

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(sqlConfig);
    poolPromise = pool.connect();
  }
  return poolPromise;
}

export async function query(statement, params = {}) {
  const pool = await getPool();
  const request = pool.request();

  for (const [name, value] of Object.entries(params)) {
    request.input(name, value);
  }

  return request.query(statement);
}

export async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}

export { sql };
