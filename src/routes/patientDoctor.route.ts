import { App } from "uWebSockets.js";
import { assignDoctor } from "../controllers/patientDoctor/assignDoctor.controller";
import { getPatients } from "../controllers/patientDoctor/getPatients.controller";

/**
 * Configures routes for handling patient-doctor assignments.
 * @param app - uWebSockets.js app instance
 */
export const configurePatientDoctorRoutes = (app: any) => {
  app.post("/api/patient-doctor/assign", (res: any, req: any) => assignDoctor(res, req));
  app.post("/api/patient-doctor/get-patients", (res: any, req: any) => getPatients(res, req));

  console.log("✅ Patient-Doctor routes configured successfully.");
};
