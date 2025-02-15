import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig";
import { DoctorNote } from "../../entities/doctorNotes.entity";
import { User } from "../../entities/user.entity";
import { ActionableStep } from "../../entities/actionableStep.entity";
import { Reminder } from "../../entities/reminder.entity"; // ✅ Import Reminder Entity
import { UserRole } from "../../enums/userRole.enum";
import { ActionableStepType } from "../../enums/actionableStepType.enum";
import { encryptNote } from "../../services/encryptDecrypt"; 
import { generateActionableSteps } from "../../services/geminiService"; 
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler";
import { handleError } from "../../utils/handleError";
import { parseRequestBody } from "../../utils/parseRequestBody";
import { getStatusText } from "../../utils/getStatusText";
import { corsMiddleware } from "../../services/cors";
import { protectRoute } from "../../services/protectRoute";

/**
 * Allows a doctor to submit a note for an assigned patient and generate actionable steps.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const submitDoctorNote = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res);
  corsMiddleware(res, req);

  protectRoute(res, req, async () => {
  try {
    // ✅ Parse request body
    const body = await parseRequestBody(res);
    const { doctorId, patientId, note } = body;

    if (!doctorId || !patientId || !note) {
      logger.warn("❌ Missing doctorId, patientId, or note.");
      res.cork(() => {
        res.writeStatus("400 Bad Request").end(
          JSON.stringify({ success: false, message: "doctorId, patientId, and note are required." })
        );
      });
      return;
    }

    if (doctorId === patientId) {
      logger.warn("❌ Doctor tried to assign a note to themselves.");
      res.cork(() => {
        res.writeStatus("400 Bad Request").end(
          JSON.stringify({ success: false, message: "You cannot assign a note to yourself." })
        );
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const doctorNoteRepository = AppDataSource.getRepository(DoctorNote);
    const actionableStepRepository = AppDataSource.getRepository(ActionableStep);
    const reminderRepository = AppDataSource.getRepository(Reminder);

    // ✅ Ensure the doctor exists
    const doctor = await userRepository.findOne({ where: { id: doctorId, role: UserRole.DOCTOR } });
    if (!doctor) {
      logger.warn(`❌ Doctor ID '${doctorId}' not found.`);
      res.cork(() => {
        res.writeStatus("404 Not Found").end(JSON.stringify({ success: false, message: "Doctor not found." }));
      });
      return;
    }

    // ✅ Ensure the patient exists
    const patient = await userRepository.findOne({ where: { id: patientId, role: UserRole.PATIENT } });
    if (!patient) {
      logger.warn(`❌ Patient ID '${patientId}' not found.`);
      res.cork(() => {
        res.writeStatus("404 Not Found").end(JSON.stringify({ success: false, message: "Patient not found." }));
      });
      return;
    }

    // ✅ Encrypt note before saving
    const encryptedNote = encryptNote(note);

    // ✅ Generate actionable steps using Gemini AI
    const { checklist, plan } = await generateActionableSteps(note);

    // ✅ Save doctor note
    const newNote = doctorNoteRepository.create({
      doctor,
      patient,
      encryptedNote,
    });

    await doctorNoteRepository.save(newNote);

    // ✅ Convert string `"checklist"` & `"plan"` into enum values
    const actionableSteps = [
      ...checklist.map((step) => ({
        note: newNote,
        type: ActionableStepType.CHECKLIST, 
        description: step,
      })),
      ...plan.map((step) => ({
        note: newNote,
        type: ActionableStepType.PLAN, 
        description: step,
      })),
    ];

    // ✅ Save actionable steps
    const savedSteps = await actionableStepRepository.save(actionableSteps);

    // ✅ Schedule reminders with proper delays
    const currentDate = new Date();
    const reminders = savedSteps.map((step, index) => {
      let scheduleTime = new Date(currentDate);

      if (step.type === ActionableStepType.PLAN) {
        scheduleTime.setDate(scheduleTime.getDate() + index); // Increment each plan step by 1 day
      } else {
        scheduleTime.setSeconds(scheduleTime.getSeconds() + 10); // Immediate task (10 sec delay)
      }

      return reminderRepository.create({
        step,
        scheduleTime,
      });
    });

    await reminderRepository.save(reminders);

    logger.info(`📌 Doctor ID '${doctorId}' submitted a note for patient ID '${patientId}' with actionable steps.`);
    logger.info(`📅 Scheduled ${reminders.length} reminders.`);

    res.cork(() => {
      res.writeStatus(`201 ${getStatusText(201)}`).end(
        JSON.stringify({
          success: true,
          message: "Doctor note submitted successfully.",
          data: {
            checklist,
            plan,
            remindersScheduled: reminders.length,
          },
        })
      );
    });

  } catch (error) {
    logger.error("❌ Doctor note submission failed due to server error.", { error });
    handleError(res, { statusCode: 500, message: "Internal server error." });
  }
});
};
