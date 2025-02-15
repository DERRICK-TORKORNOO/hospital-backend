import { App, TemplatedApp, HttpResponse, HttpRequest } from "uWebSockets.js";
import { initializeDatabase } from "./config/ormconfig";
// import { ENV } from "./config/env.config";
import { corsMiddleware } from "./services/cors";
import logger from "./config/logger.config"; // ✅ Import custom logger
import dotenv from "dotenv";

// Import route configurations
import { configureAuthRoutes } from "./routes/auth.routes";
import { configureDoctorNotesRoutes } from "./routes/submitDoctorNotes.route";
import { configureReminderRoutes } from "./routes/reminder.route";
import { configurePatientDoctorRoutes } from "./routes/patientDoctor.route";

dotenv.config();

const app: TemplatedApp = App();

const allowedOrigins = [
  "https://example.com",
]; // Add allowed origins here

app.options("/*", (res, req) => {
  logger.info("=== Handling Preflight Request ===");
  const origin = req.getHeader("origin");

  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.writeHeader("Access-Control-Allow-Origin", origin); // Set the matching origin
    res.writeHeader("Access-Control-Allow-Credentials", "true"); // Allow cookies/credentials
    res.writeHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.writeHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.writeHeader("Access-Control-Max-Age", "86400"); // Cache for 1 day
    logger.info(`Preflight response sent for origin: ${origin}`);
    res.end();
  } else {
    logger.warn(`CORS policy does not allow this origin: ${origin}`);
    res.writeStatus("403 Forbidden").end("CORS policy does not allow this origin.");
  }
});

// Middleware for health checks
app.get("/health", (res: HttpResponse) => {
  logger.info("=== Health Check Request ===");
  res.onAborted(() => logger.error("Health check request aborted"));
  res.writeStatus("200 OK").end("Server is healthy");
  logger.info("Health check response sent.");
});

// Configure routes
logger.info("Configuring routes...");
configureAuthRoutes(app);
configureDoctorNotesRoutes(app);
configureReminderRoutes(app);
configurePatientDoctorRoutes(app);
logger.info("Routes configured.");

// Fallback for unmatched routes
app.any("/*", (res: HttpResponse, req: HttpRequest) => {
  logger.warn("=== Unmatched Route Handler ===");
  logger.warn(`Request URL: ${req.getUrl()}`);
  logger.warn(`Method: ${req.getMethod()}`);
  logger.warn(`Origin: ${req.getHeader("origin")}`);

  res.onAborted(() => logger.error("Unmatched route request aborted"));
  corsMiddleware(res, req); // Ensure CORS headers are applied

  try {
    const responseBody = JSON.stringify({
      success: false,
      message: "Route not found",
    });

    res.writeHeader("Content-Type", "application/json").end(responseBody);
    logger.warn(`Fallback response sent with message: ${responseBody}`);
  } catch (err) {
    logger.error("Error handling unmatched route:", err);
    if (!res.closed) {
      res.writeStatus("500 Internal Server Error").end("Internal Server Error");
    }
  }
});

// Start server
const PORT = 3000;
logger.info(`Starting server on PORT ${PORT}...`);

app.listen(PORT, async (listenSocket: false | unknown) => {
  if (!listenSocket) {
    logger.error("Failed to start server");
    process.exit(1);
  }

  try {
    logger.info("Initializing database...");
    await initializeDatabase();
    logger.info("Database initialized.");

    logger.info(`🚀 Server running on PORT ${PORT}`);
  } catch (err) {
    logger.error("Error initializing backend components:", err);
    process.exit(1);
  }
});
