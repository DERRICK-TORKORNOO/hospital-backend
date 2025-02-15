import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig";
import { User } from "../../entities/user.entity";
import { DoctorPatient } from "../../entities/doctorPatient.entity";
import { UserRole } from "../../enums/userRole.enum"; // ✅ Use enum instead of a string
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler";
import { handleError } from "../../utils/handleError";
import { parseRequestBody } from "../../utils/parseRequestBody";
import { getStatusText } from "../../utils/getStatusText";
import { protectRoute } from "../../services/protectRoute";
import { corsMiddleware } from "../../services/cors";

/**
 * Assigns a doctor to a patient.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const assignDoctor = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res);
  corsMiddleware(res, req);

  protectRoute(res, req, async () => {
    try {
      // ✅ Parse request body
      const body = await parseRequestBody(res);
      const { patientId, doctorId } = body;

      // ✅ Validate required fields
      if (!patientId || !doctorId) {
        logger.warn("Doctor assignment failed: Missing patientId or doctorId.");
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(
            JSON.stringify({
              success: false,
              message: "Both patientId and doctorId are required.",
            })
          );
        });
        return;
      }

      if (doctorId === patientId) {
        logger.warn(`Doctor assignment failed: Patient tried to assign themselves.`);
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(
            JSON.stringify({
              success: false,
              message: "You cannot assign yourself as a doctor.",
            })
          );
        });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const doctorPatientRepository = AppDataSource.getRepository(DoctorPatient);

      // ✅ Ensure the patient exists in the database
      const patient = await userRepository.findOne({ where: { id: patientId, role: UserRole.PATIENT } });

      if (!patient) {
        logger.warn(`Doctor assignment failed: Patient ID '${patientId}' not found.`);
        res.cork(() => {
          res.writeStatus("404 Not Found").end(
            JSON.stringify({
              success: false,
              message: "Patient not found.",
            })
          );
        });
        return;
      }

      // ✅ Ensure the doctor exists and has the correct role
      const doctor = await userRepository.findOne({ where: { id: doctorId, role: UserRole.DOCTOR } });

      if (!doctor) {
        logger.warn(`Doctor assignment failed: Doctor ID '${doctorId}' not found.`);
        res.cork(() => {
          res.writeStatus("404 Not Found").end(
            JSON.stringify({
              success: false,
              message: "Doctor not found.",
            })
          );
        });
        return;
      }

      // ✅ Check if the patient has already assigned this doctor
      const existingAssignment = await doctorPatientRepository.findOne({
        where: {
          patient: { id: patient.id },
          doctor: { id: doctor.id },
        },
        relations: ["patient", "doctor"], // Ensure we get the full entities
      });

      if (existingAssignment) {
        logger.warn(`Doctor assignment failed: Doctor ID '${doctorId}' already assigned to patient '${patient.id}'.`);
        res.cork(() => {
          res.writeStatus("409 Conflict").end(
            JSON.stringify({
              success: false,
              message: "Doctor is already assigned to this patient.",
            })
          );
        });
        return;
      }

      // ✅ Assign the doctor to the patient
      const newAssignment = doctorPatientRepository.create({ patient, doctor });

      await doctorPatientRepository.save(newAssignment);

      logger.info(`Doctor ID '${doctorId}' assigned to patient ID '${patient.id}'.`);
      res.cork(() => {
        res.writeStatus(`201 ${getStatusText(201)}`).end(
          JSON.stringify({
            success: true,
            message: "Doctor assigned successfully.",
          })
        );
      });

    } catch (error) {
      logger.error("Doctor assignment failed due to server error.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  });
};
