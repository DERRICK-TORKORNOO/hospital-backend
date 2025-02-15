import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig";
import { Reminder } from "../../entities/reminder.entity";
import logger from "../../config/logger.config";
import { parseRequestBody } from "../../utils/parseRequestBody";
import { handleError } from "../../utils/handleError";
import { corsMiddleware } from "../../services/cors";
import { attachAbortHandler } from "../../utils/abortHandler";
import { protectRoute } from "../../services/protectRoute";

/**
 * Fetches reminders for a given patient.
 */
export const getReminders = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res);
  corsMiddleware(res, req);

  protectRoute(res, req, async () => {
  try {
    // ✅ Extract `patientId`, `page`, and `limit` from query params
    const patientId = req.getQuery("patientId");
    const page = parseInt(req.getQuery("page") || "1", 10);
    const limit = parseInt(req.getQuery("limit") || "10", 10);

    if (!patientId) {
      logger.warn("Reminder retrieval failed: Missing patientId in query params.");
      res.cork(() => {
        res.writeStatus("400 Bad Request").end(
          JSON.stringify({ success: false, message: "Patient ID is required in query parameters." })
        );
      });
      return;
    }

    const reminderRepo = AppDataSource.getRepository(Reminder);

    // ✅ Fetch reminders with pagination
    const [reminders, total] = await reminderRepo.findAndCount({
      where: { step: { note: { patient: { id: patientId } } } },
      relations: ["step"],
      order: { scheduleTime: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    logger.info(`Reminders retrieved for patient ID '${patientId}'.`);

    // ✅ Return paginated results with metadata
    res.cork(() => {
      res.writeStatus("200 OK").end(
        JSON.stringify({
          success: true,
          message: "Reminders retrieved successfully.",
          data: reminders,
          metadata: {
            total,
            page,
            nextPage: total > page * limit ? page + 1 : null,
          },
        })
      );
    });
  } catch (error) {
    logger.error("Failed to fetch reminders.", { error });
    handleError(res, { statusCode: 500, message: "Internal server error." });
  }
});
};
