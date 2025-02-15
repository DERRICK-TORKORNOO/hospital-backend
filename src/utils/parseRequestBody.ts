import { HttpResponse } from "uWebSockets.js";
import { attachAbortHandler } from "./abortHandler"; // Handles aborted requests
import logger from "../config/logger.config" // Logging system
import { handleError } from "./handleError"; // Standardized error handling
import { getStatusText } from "./getStatusText"; // Status text utility

/**
 * Parses the JSON request body from an HTTP request.
 * @param res - The uWebSockets.js HttpResponse object.
 * @returns A promise resolving to the parsed JSON body or an error message.
 */
export async function parseRequestBody(res: HttpResponse): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const isAborted = attachAbortHandler(res); // Attach the abort handler

    res.onData((chunk: ArrayBuffer, isLast: boolean) => {
      if (isAborted()) {
        logger.warn("Request aborted before data was fully received.");
        return;
      }

      buffer += Buffer.from(chunk).toString();

      if (isLast) {
        try {
          if (!buffer.trim()) {
            logger.warn("No request body was provided.");
            res.cork(() => {
              res.writeStatus(`400 ${getStatusText(400)}`).end(
                JSON.stringify({
                  success: false,
                  message: "No request body was provided.",
                })
              );
            });
            return;
          }

          resolve(JSON.parse(buffer));
        } catch (err) {
          logger.error("Invalid JSON format in request body.");
          res.cork(() => {
            res.writeStatus(`400 ${getStatusText(400)}`).end(
              JSON.stringify({
                success: false,
                message: "Invalid JSON format.",
              })
            );
          });
        }
      }
    });

    res.onAborted(() => {
      logger.warn("Request aborted before completion.");
      handleError(res, { statusCode: 400, message: "Request aborted before completion." });
      reject(new Error("Request aborted"));
    });
  });
}
