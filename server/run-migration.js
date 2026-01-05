import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true,
  });
 
  const migrationsDir = "./migrations";
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith(".sql")) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await connection.query(sql);
      console.log(`✅ ${file} completed`);
    }
  }
  await connection.end();
  console.log("🎉 All migrations complete!");
}

const command = process.argv[2];

if (command === "status") {
  // Add status checking logic here
  console.log("Status check not yet implemented");
} else {
  // Default: run migrations
  runMigrations().catch(console.error);
}

runMigrations().catch(console.error);
