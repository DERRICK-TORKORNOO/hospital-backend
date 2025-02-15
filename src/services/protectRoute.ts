import jwt from "jsonwebtoken";
import { HttpRequest, HttpResponse } from "uWebSockets.js";
import { handleError } from "../utils/handleError"; 
import { attachAbortHandler } from "../utils/abortHandler"; 
import logger from "../config/logger.config";
import { parseCookies } from "../utils/parseCookie";


/**
 * Middleware to authenticate users via JWT in cookies or headers
 */
export const protectRoute = (
  res: HttpResponse,
  req: HttpRequest,
  next: (user?: any) => void
): void => {
  const isAborted = attachAbortHandler(res); // Track if request is aborted

  res.cork(() => {
    try {
      if (isAborted()) {
        logger.warn("Request aborted before authentication could complete.");
        return;
      }

      let token: string | undefined;

      // Step 1: Check for token in cookies
      const cookieHeader = req.getHeader("cookie");
      logger.debug("Checking authentication...");

      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        logger.debug("Parsed Cookies:", cookies);
        token = cookies.authToken; // Adjust 'authToken' to match your setup
      }

      // Step 2: Fallback to Authorization header if no cookie token is found
      if (!token) {
        const authHeader = req.getHeader("authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        }
      }

      // Step 3: Reject if no token is found
      if (!token) {
        logger.warn("Token not found in cookies or headers.");
        handleError(res, { message: "Unauthorized: Token not found", statusCode: 401 });
        return;
      }

      // Step 4: Verify the token
      logger.debug("Verifying token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      logger.info("User authenticated successfully", { user: decoded });

      // Attach decoded user to the request
      (req as any).user = decoded;

      // Step 5: Proceed to the next middleware or handler
      next(decoded);
    } catch (error: any) {
      logger.error("Authentication error:", { message: error.message });
      handleError(res, { message: `Forbidden: ${error.message}`, statusCode: 403 });
    }
  });
};
