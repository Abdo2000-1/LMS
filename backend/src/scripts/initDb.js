import { config } from "../config.js";
import { sql, sqlConfig } from "../db.js";

const createUsersTableSql = `
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    email NVARCHAR(190) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')),
    grade NVARCHAR(120) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );

  CREATE UNIQUE INDEX uq_users_email ON dbo.users(email);
END;
`;

async function run() {
  const adminPool = await new sql.ConnectionPool({
    ...sqlConfig,
    database: "master",
  }).connect();

  const safeDbName = config.db.name.replace(/]/g, "]]");
  await adminPool.request().query(`IF DB_ID(N'${safeDbName}') IS NULL CREATE DATABASE [${safeDbName}]`);
  await adminPool.close();

  const appPool = await new sql.ConnectionPool(sqlConfig).connect();
  await appPool.request().query(createUsersTableSql);
  console.log("Database initialized successfully.");
  await appPool.close();
}

run().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exit(1);
});
