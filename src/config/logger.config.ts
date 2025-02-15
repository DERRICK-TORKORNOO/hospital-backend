import pino from "pino";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load .env before initializing logger

const logger = pino({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport: process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined
});

export default logger;
