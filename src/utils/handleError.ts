import { HttpResponse } from "uWebSockets.js";
import { getStatusText } from "./getStatusText"; // Centralized status text utility
import { attachAbortHandler } from "./abortHandler"; // Importing abort handler
import logger from "../config/logger.config"; // Logging system

export const handleError = (res: HttpResponse, error: any): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Attach abort handler and check if response has been aborted
  const isAborted = attachAbortHandler(res);
  
  if (isAborted()) {
    logger.warn("Attempted to handle error, but response was already aborted.");
    return;
  }

  logger.error(`Error ${statusCode}: ${message}`, { statusCode, error });

  res.cork(() => {
    res.writeStatus(`${statusCode} ${getStatusText(statusCode)}`);
    res.end(JSON.stringify({ success: false, message }));
  });
};
