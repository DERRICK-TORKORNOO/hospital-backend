import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig"; 
import { User } from "../../entities/user.entity"; 
import bcrypt from "bcrypt";
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler"; 
import { handleError } from "../../utils/handleError"; 
import { parseRequestBody } from "../../utils/parseRequestBody"; 
import { getStatusText } from "../../utils/getStatusText";
import { corsMiddleware } from "../../services/cors";
import { protectRoute } from "../../services/protectRoute";

/**
 * Handles password update securely.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const updatePassword = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res); // ✅ Prevents processing aborted requests
  corsMiddleware(res, req); // ✅ Apply CORS middleware

  protectRoute(res, req, async (user) => {
    try {
      // ✅ Parse request body
      const body = await parseRequestBody(res);
      const { oldPassword, newPassword } = body;

      // ✅ Validate required fields
      if (!oldPassword || !newPassword) {
        logger.warn(`Password update failed: Missing old or new password for user ID ${user.userId}`);
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(JSON.stringify({
            success: false,
            message: "Both oldPassword and newPassword are required.",
          }));
        });
        return;
      }

      // ✅ Fetch user from DB
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ where: { id: user.userId } });

      if (!existingUser) {
        logger.warn(`Password update failed: User ID ${user.userId} not found.`);
        res.cork(() => {
          res.writeStatus("404 Not Found").end(JSON.stringify({
            success: false,
            message: "User not found.",
          }));
        });
        return;
      }

      // ✅ Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);
      if (!isPasswordValid) {
        logger.warn(`Password update failed: Incorrect old password for user ID ${user.userId}`);
        res.cork(() => {
          res.writeStatus("401 Unauthorized").end(JSON.stringify({
            success: false,
            message: "Old password is incorrect.",
          }));
        });
        return;
      }

      // ✅ Ensure new password is different
      const isSameAsOld = await bcrypt.compare(newPassword, existingUser.password);
      if (isSameAsOld) {
        logger.warn(`Password update failed: New password matches old password for user ID ${user.userId}`);
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(JSON.stringify({
            success: false,
            message: "New password cannot be the same as the old password.",
          }));
        });
        return;
      }

      // ✅ Hash new password securely
      existingUser.password = await bcrypt.hash(newPassword, 10);

      // ✅ Save updated password
      await userRepository.save(existingUser);

      logger.info(`Password updated successfully for user ID ${user.userId}`);
      res.cork(() => {
        res.writeStatus(`200 ${getStatusText(200)}`).end(JSON.stringify({
          success: true,
          message: "Password updated successfully.",
        }));
      });

    } catch (error) {
      logger.error("Password update failed due to server error.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  });
};
