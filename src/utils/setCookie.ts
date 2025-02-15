import { HttpResponse } from "uWebSockets.js";
import logger from "../config/logger.config"; // Importing logger
import { attachAbortHandler } from "./abortHandler"; // Importing abort handler

export const setCookieMiddleware = (
  res: HttpResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
    domain?: string;
    maxAge?: number;
  } = {}
) => {
  const isAborted = attachAbortHandler(res); // Track aborted request

  res.cork(() => {
    if (isAborted()) {
      logger.warn(`Request aborted before setting cookie: ${name}`);
      return;
    }

    let cookie = `${name}=${encodeURIComponent(value)}`; // Ensure value is URL-encoded

    if (options.httpOnly) cookie += "; HttpOnly";
    if (options.secure) cookie += "; Secure";

    // Ensure SameSite=None requires Secure (to prevent browser warnings)
    if (options.sameSite) {
      if (options.sameSite === "None" && !options.secure) {
        logger.warn(`SameSite=None requires Secure=true. Setting Secure flag for ${name}.`);
        cookie += "; Secure";
      }
      cookie += `; SameSite=${options.sameSite}`;
    }

    if (options.path) cookie += `; Path=${options.path}`;
    if (options.domain) cookie += `; Domain=${options.domain}`;
    if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;

    res.writeHeader("Set-Cookie", cookie);
    logger.info(`Set-Cookie header set: ${cookie}`);
  });
};
