import { HttpResponse } from "uWebSockets.js";
import logger from "../config/logger.config"; // Importing logger
import { attachAbortHandler } from "./abortHandler"; // Importing abort handler

/**
 * Utility function to delete cookies by setting them with a past expiration date.
 * @param res HttpResponse - uWebSockets.js response object
 * @param name string - Name of the cookie
 * @param domain string - Cookie domain (optional)
 */
export const deleteCookie = (res: HttpResponse, name: string, domain?: string): void => {
  const isAborted = attachAbortHandler(res); // Track if request is aborted

  res.cork(() => {
    if (isAborted()) {
      logger.warn(`Request aborted before deleting cookie: ${name}`);
      return;
    }

    const cookie = `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; ${domain ? `Domain=${domain};` : ""}`;
    res.writeHeader("Set-Cookie", cookie);
    logger.info(`Deleted Cookie: ${cookie}`);
  });
};
