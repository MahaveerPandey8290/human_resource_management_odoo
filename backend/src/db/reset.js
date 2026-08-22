import mysql from "mysql2/promise";
import { env } from "../config/env.js";

async function runReset() {
  process.stdout.write("Resetting database...\n");
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${env.DB_NAME}\`;`);
    process.stdout.write(`Database ${env.DB_NAME} dropped.\n`);
  } catch (err) {
    process.stderr.write(`Database reset failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runReset();
