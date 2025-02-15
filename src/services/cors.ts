import { HttpRequest, HttpResponse } from "uWebSockets.js";
import logger from "../config/logger.config"; // Importing logger

type CorsOptions = {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

const defaultOptions: CorsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400, // 1 day
};

// Helper to check if the origin is allowed
const isOriginAllowed = (
  origin: string,
  allowedOrigin: string | string[] | ((origin: string) => boolean) | undefined
): boolean => {
  logger.debug(`Checking if origin is allowed: ${origin}`, { allowedOrigin });

  if (!allowedOrigin) {
    logger.debug("No allowedOrigin defined, defaulting to allow all origins.");
    return true;
  }
  if (Array.isArray(allowedOrigin)) {
    const allowed = allowedOrigin.includes(origin);
    logger.debug(`Array of allowed origins. Origin allowed: ${allowed}`);
    return allowed;
  }
  if (typeof allowedOrigin === "function") {
    const allowed = allowedOrigin(origin);
    logger.debug(`Function for allowed origins. Origin allowed: ${allowed}`);
    return allowed;
  }
  const allowed = origin === allowedOrigin || allowedOrigin === "*";
  logger.debug(`Static string for allowed origin. Origin allowed: ${allowed}`);
  return allowed;
};

// Create CORS middleware
export const createCorsMiddleware = (userOptions: CorsOptions) => {
  const options = { ...defaultOptions, ...userOptions };

  logger.info("CORS middleware created with options", options);

  return (res: HttpResponse, req: HttpRequest) => {
    res.cork(() => {
      try {
        // Log incoming request details
        logger.debug("Incoming request details", { method: req.getMethod(), url: req.getUrl() });
        const origin = req.getHeader("origin");

        if (origin && !isOriginAllowed(origin, options.origin)) {
          logger.warn(`Origin not allowed by CORS policy: ${origin}`);
          res.cork(() => {
            res.writeStatus("403 Forbidden").end(
              JSON.stringify({ success: false, message: "CORS policy does not allow this origin." })
            );
          });
          return;
        }

        // Set CORS headers within `res.cork()`
        res.cork(() => {
          res.writeHeader("Access-Control-Allow-Origin", origin || "*");
          logger.debug(`Access-Control-Allow-Origin: ${origin || "*"}`);

          // Set other CORS headers
          const methods = Array.isArray(options.methods) ? options.methods.join(",") : options.methods;
          res.writeHeader("Access-Control-Allow-Methods", methods || "GET,HEAD,PUT,PATCH,POST,DELETE");
          logger.debug(`Access-Control-Allow-Methods: ${methods}`);

          const allowedHeaders = Array.isArray(options.allowedHeaders)
            ? options.allowedHeaders.join(",")
            : options.allowedHeaders;
          res.writeHeader("Access-Control-Allow-Headers", allowedHeaders || "");
          logger.debug(`Access-Control-Allow-Headers: ${allowedHeaders}`);

          if (options.credentials) {
            res.writeHeader("Access-Control-Allow-Credentials", "true");
            logger.debug("Access-Control-Allow-Credentials: true");
          }

          if (options.maxAge) {
            res.writeHeader("Access-Control-Max-Age", options.maxAge.toString());
            logger.debug(`Access-Control-Max-Age: ${options.maxAge}`);
          }

          if (options.exposedHeaders) {
            const exposedHeaders = Array.isArray(options.exposedHeaders)
              ? options.exposedHeaders.join(",")
              : options.exposedHeaders;
            res.writeHeader("Access-Control-Expose-Headers", exposedHeaders);
            logger.debug(`Access-Control-Expose-Headers: ${exposedHeaders}`);
          }

          // Handle preflight (OPTIONS) requests
          if (req.getMethod() === "OPTIONS") {
            logger.debug("Preflight request detected. Sending 204 No Content.");
            res.writeStatus("204 No Content").end();
            return;
          }

          // Log successful CORS application
          logger.info("CORS headers applied successfully");
        });
      } catch (error) {
        logger.error("Error in CORS middleware", { error });
        res.cork(() => {
          res.writeStatus("500 Internal Server Error").end("CORS middleware error.");
        });
      }
    });
  };
};

// Usage Example: Allow specific origins for production
export const corsMiddleware = createCorsMiddleware({
  origin: ["http://localhost:3000", "https://facial.akwaabahr.com"], // Allowed origins
  methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Custom-Header"],
  credentials: false, // Disable credentials
});
