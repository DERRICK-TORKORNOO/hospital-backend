import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig"; 
import { User } from "../../entities/user.entity"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler"; 
import { handleError } from "../../utils/handleError"; 
import { parseRequestBody } from "../../utils/parseRequestBody"; 
import { getStatusText } from "../../utils/getStatusText";
import { corsMiddleware } from "../../services/cors";
import { setCookieMiddleware } from "../../utils/setCookie";
import { protectRoute } from "../../services/protectRoute";
import { ENV } from "../../config/env.config";

/**
 * Handles user login with authentication and session handling.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const login = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res); // ✅ Prevents processing aborted requests
  corsMiddleware(res, req); // ✅ Apply CORS middleware

  // protectRoute(res, req, async () => {
    try {
      // ✅ Extract origin for dynamic cookie domain handling
      const origin = req.getHeader("origin") || "https://example.com";
      const hostname = new URL(origin).hostname;
      const domain = hostname.includes(".")
        ? `.${hostname.split(".").slice(-2).join(".")}` // Extract base domain (e.g., .akwaabahr.com)
        : ".example.com";

      // ✅ Parse request body
      const body = await parseRequestBody(res);
      const { email, password } = body;

      // ✅ Validate required fields
      if (!email || !password) {
        logger.warn("Login failed: Missing email or password.");
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(JSON.stringify({
            success: false,
            message: "Email and password are required.",
          }));
        });
        return;
      }

      // ✅ Check if user exists
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        logger.warn(`Login failed: User not found with email '${email}'.`);
        res.cork(() => {
          res.writeStatus("401 Unauthorized").end(JSON.stringify({
            success: false,
            message: "Invalid email or password.",
          }));
        });
        return;
      }

      // ✅ Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login failed: Incorrect password for email '${email}'.`);
        res.cork(() => {
          res.writeStatus("401 Unauthorized").end(JSON.stringify({
            success: false,
            message: "Invalid email or password.",
          }));
        });
        return;
      }

      // ✅ Generate JWT Token
      const token = jwt.sign({ userId: user.id, role: user.role }, ENV.JWT_SECRET, { expiresIn: "1d" });

      if (!token) {
        logger.error("Login failed: JWT token generation failed.");
        res.cork(() => {
          res.writeStatus("500 Internal Server Error").end(JSON.stringify({
            success: false,
            message: "Token generation failed.",
          }));
        });
        return;
      }

      // ✅ Set authToken cookie securely
      setCookieMiddleware(res, "authToken", token, {
        httpOnly: true, // Prevent JavaScript access
        secure: true, // Send only over HTTPS
        sameSite: "None", // Allow cross-site cookies
        path: "/", // Cookie is valid for the entire site
        domain, // Dynamically resolved or default domain
        maxAge: 60 * 60 * 24, // 1 day in seconds
      });

      // ✅ Remove password before returning user data
      const { password: _, ...userData } = user;

      // ✅ Send success response
      logger.info(`User logged in: ${email}`);
      res.cork(() => {
        res.writeStatus(`200 ${getStatusText(200)}`).end(JSON.stringify({
          success: true,
          message: "Login successful.",
          data: {
            token,
            user: userData,
          },
        }));
      });

    } catch (error) {
      logger.error("Login failed due to server error.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  // });
};
