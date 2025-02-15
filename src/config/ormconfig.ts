import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

// ✅ Load .env file before accessing `ENV`
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DB_HOST) {
  throw new Error("❌ Missing environment variables. Ensure `.env` file is loaded.");
}

export const AppDataSource = new DataSource({
  synchronize: false,
  type: "postgres",
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  logging: true, // ✅ Enable detailed logging for debugging
  entities: [
    path.join(__dirname, "../entities/**/*.js"), // ✅ Ensure correct path for compiled entities
  ],
  migrations: [
    path.join(__dirname, "../migrations/**/*.js"), // ✅ Ensure correct path for compiled migrations
  ],
  ssl: false,
});

export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connected successfully");
    }
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    throw error;
  }
}
