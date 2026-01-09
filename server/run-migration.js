import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function ensureMigrationsTable(connection) {
  // Ensure tracking table exists (in case 000 file is missing or order changes)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query(
    "SELECT filename FROM schema_migrations ORDER BY id ASC"
  );
  return new Set(rows.map((r) => r.filename));
}

async function markMigrationApplied(connection, filename) {
  await connection.query(
    "INSERT INTO schema_migrations (filename) VALUES (?)",
    [filename]
  );
}

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  try {
    const migrationsDir = path.resolve("./migrations");
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    await ensureMigrationsTable(connection);

    const applied = await getAppliedMigrations(connection);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => /^\d+_.*\.sql$/.test(file))
      .sort((a, b) => {
        // numeric prefix sort: 000_..., 001_...
        const na = Number(a.split("_")[0]);
        const nb = Number(b.split("_")[0]);
        return na - nb;
      });

    let ranAny = false;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭️  Skipping already applied: ${file}`);
        continue;
      }

      console.log(`▶️  Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await markMigrationApplied(connection, file);
        await connection.commit();
        console.log(`✅ ${file} completed`);
        ranAny = true;
      } catch (err) {
        await connection.rollback();
        console.error(`❌ Migration failed: ${file}`);
        throw err;
      }
    }

    if (!ranAny) {
      console.log("✅ No new migrations to apply.");
    } else {
      console.log("🎉 All pending migrations complete!");
    }
  } finally {
    await connection.end();
  }
}

async function showStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  try {
    await ensureMigrationsTable(connection);
    const applied = await getAppliedMigrations(connection);
    console.log("📌 Applied migrations:");
    for (const f of applied) console.log(" -", f);
  } finally {
    await connection.end();
  }
}

const command = process.argv[2];

if (command === "status") {
  showStatus().catch(console.error);
} else {
  runMigrations().catch(console.error);
}
