import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig";
import { Reminder } from "../../entities/reminder.entity";
import logger from "../../config/logger.config";
import { parseRequestBody } from "../../utils/parseRequestBody";
import { handleError } from "../../utils/handleError";
import { corsMiddleware } from "../../services/cors";
import { protectRoute } from "../../services/protectRoute";
import { attachAbortHandler } from "../../utils/abortHandler";

/**
 * Marks a reminder as completed.
 */
export const completeReminder = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res);
  corsMiddleware(res, req);

  protectRoute(res, req, async () => {
    try {
      // ✅ Parse request body
      const body = await parseRequestBody(res);
      const { reminderId, patientId } = body;

      if (!reminderId || !patientId) {
        logger.warn("Reminder completion failed: Missing reminderId or patientId.");
        res.cork(() => res.writeStatus("400 Bad Request").end(JSON.stringify({
          success: false,
          message: "reminderId and patientId are required."
        })));
        return;
      }

      const reminderRepo = AppDataSource.getRepository(Reminder);
      const reminder = await reminderRepo.findOne({
        where: { id: reminderId },
        relations: ["step", "step.note", "step.note.patient"]
      });

      if (!reminder) {
        logger.warn(`Reminder completion failed: Reminder ID '${reminderId}' not found.`);
        res.cork(() => res.writeStatus("404 Not Found").end(JSON.stringify({
          success: false,
          message: "Reminder not found."
        })));
        return;
      }

      // ✅ Ensure the provided patient ID matches the reminder's assigned patient
      if (reminder.step.note.patient.id !== patientId) {
        logger.warn(`Unauthorized attempt by patient ID '${patientId}' to complete reminder ID '${reminderId}'.`);
        res.cork(() => res.writeStatus("403 Forbidden").end(JSON.stringify({
          success: false,
          message: "You do not have permission to complete this reminder."
        })));
        return;
      }

      // ✅ Mark reminder as completed
      reminder.completed = true;
      await reminderRepo.save(reminder);

      logger.info(`Reminder ID '${reminderId}' marked as completed by patient ID '${patientId}'.`);
      res.cork(() => res.writeStatus("200 OK").end(JSON.stringify({
        success: true,
        message: "Reminder completed successfully."
      })));

    } catch (error) {
      logger.error("Failed to complete reminder.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  });
};
