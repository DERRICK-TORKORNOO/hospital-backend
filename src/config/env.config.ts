import dotenv from "dotenv";
import { z } from "zod";
import logger from "./logger.config"; // Using pino logger
import path from "path";

// ✅ Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DB_HOST) {
  throw new Error("❌ Missing environment variables. Ensure `.env` file is loaded.");
}


// Define schema for environment variables
const envSchema = z.object({
    DB_HOST: z.string().min(1, "DB_HOST is required"),
    DB_PORT: z.string().refine((port) => !isNaN(Number(port)), { message: "DB_PORT must be a number" }),
    DB_USER: z.string().min(1, "DB_USER is required"),
    DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
    DB_NAME: z.string().min(1, "DB_NAME is required"),
    JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters long"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    ENCRYPTION_SECRET: z.string().min(1, "ENCRYPTION_SECRET is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required") // ✅ Added Google Gemini API Key validation
});

// Validate environment variables
const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
    logger.error("❌ Invalid environment variables:", envValidation.error.format());
    process.exit(1); // Stop execution if env variables are invalid
}

// Export validated environment variables
export const ENV = envValidation.data;

// Log success message
logger.info(`✅ Environment variables validated successfully (Mode: ${ENV.NODE_ENV})`);
