import { getReminders } from "../controllers/reminders/getReminder.controller"; 
import { completeReminder } from "../controllers/reminders/completeReminder.controller";

/**
 * Configures routes for handling reminders.
 * @param app - uWebSockets.js app instance
 */
export const configureReminderRoutes = (app: any) => {
  app.get("/api/reminders", (res: any, req: any) => getReminders(res, req));
  app.post("/api/reminders/complete", (res: any, req: any) => completeReminder(res, req));

  console.log("✅ Reminder routes configured successfully.");
};
