import { AppDataSource } from "../config/ormconfig";
import { Reminder } from "../entities/reminder.entity";
import { ActionableStep } from "../entities/actionableStep.entity";
import logger from "../config/logger.config";

/**
 * Schedules reminders for an actionable step.
 * @param actionableSteps - The steps requiring reminders.
 */
export const scheduleReminders = async (actionableSteps: ActionableStep[]): Promise<void> => {
  try {
    const reminderRepo = AppDataSource.getRepository(Reminder);

    const remindersToSave = actionableSteps.flatMap((step) => {
      if (step.type === "checklist") {
        // One-time task (no recurring reminder)
        return [
          {
            step,
            scheduleTime: new Date(), // Set immediate reminder
            completed: false,
          }
        ];
      } else if (step.type === "plan") {
        // Recurring reminders
        const reminders = [];
        for (let i = 0; i < 7; i++) { // Example: 7-day reminders
          const scheduleTime = new Date();
          scheduleTime.setDate(scheduleTime.getDate() + i);
          reminders.push({ step, scheduleTime, completed: false });
        }
        return reminders;
      }
      return [];
    });

    await reminderRepo.save(remindersToSave);
    logger.info(`Scheduled ${remindersToSave.length} reminders.`);
  } catch (error) {
    logger.error("Failed to schedule reminders:", { error });
  }
};
