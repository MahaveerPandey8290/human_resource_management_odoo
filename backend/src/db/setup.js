import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

async function runSetup() {
  process.stdout.write("Running database setup...\n");
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${env.DB_NAME}\`;`);

    const schemaPath = path.resolve("src/db/schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await connection.query(sql);

    process.stdout.write("Database setup completed successfully.\n");
  } catch (err) {
    process.stderr.write(`Database setup failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSetup();
