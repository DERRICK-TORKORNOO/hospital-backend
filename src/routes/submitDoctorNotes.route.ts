import { App } from "uWebSockets.js";
import { submitDoctorNote } from "../controllers/doctorNotes/submitDoctorNotes";

/**
 * Configures routes for handling doctor notes.
 * @param app - uWebSockets.js app instance
 */
export const configureDoctorNotesRoutes = (app: any) => {
  app.post("/api/doctor-notes/submit", (res: any, req: any) => submitDoctorNote(res, req));

  console.log("✅ Doctor Notes routes configured successfully.");
};
