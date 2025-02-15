import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig";
import { DoctorPatient } from "../../entities/doctorPatient.entity";
import { User } from "../../entities/user.entity";
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler";
import { handleError } from "../../utils/handleError";
import { getStatusText } from "../../utils/getStatusText";
import { protectRoute } from "../../services/protectRoute";
import { corsMiddleware } from "../../services/cors";
import { parseRequestBody } from "../../utils/parseRequestBody";

/**
 * Retrieves a paginated list of patients assigned to a doctor.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const getPatients = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  attachAbortHandler(res);
  corsMiddleware(res, req);

  protectRoute(res, req, async () => {
    try {
      // ✅ Parse request body
      const body = await parseRequestBody(res);
      const { doctorId, page = 1, limit = 10 } = body;

      // ✅ Validate required fields
      if (!doctorId) {
        logger.warn("Fetching patients failed: Missing doctorId.");
        res.cork(() => {
          res.writeStatus("400 Bad Request").end(
            JSON.stringify({
              success: false,
              message: "doctorId is required.",
            })
          );
        });
        return;
      }

      // ✅ Ensure doctor exists
      const doctorRepository = AppDataSource.getRepository(User);
      const doctor = await doctorRepository.findOne({ where: { id: doctorId } });

      if (!doctor) {
        logger.warn(`Fetching patients failed: Doctor ID '${doctorId}' not found.`);
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

      const doctorPatientRepository = AppDataSource.getRepository(DoctorPatient);

      // ✅ Count total patients assigned to the doctor
      const totalPatients = await doctorPatientRepository.count({
        where: { doctor: { id: doctorId } },
      });

      if (totalPatients === 0) {
        res.cork(() => {
          res.writeStatus("200 OK").end(
            JSON.stringify({
              success: true,
              message: "No patients assigned.",
              data: [],
              meta: {
                totalPatients: 0,
                currentPage: 1,
                nextPage: null,
              },
            })
          );
        });
        return;
      }

      // ✅ Retrieve paginated list of assigned patients
      const assignedPatients = await doctorPatientRepository.find({
        where: { doctor: { id: doctorId } },
        relations: ["patient"],
        take: limit,
        skip: (page - 1) * limit,
        order: { id: "ASC" }, // Ensures consistent ordering
      });

      // ✅ Extract relevant patient details
      const patientList = assignedPatients.map((assignment) => ({
        id: assignment.patient.id,
        name: assignment.patient.name,
        email: assignment.patient.email,
      }));

      // ✅ Calculate pagination metadata
      const nextPage = page * limit < totalPatients ? page + 1 : null;

      logger.info(`Doctor ID '${doctorId}' retrieved ${patientList.length} patients (Page: ${page}).`);
      res.cork(() => {
        res.writeStatus(`200 ${getStatusText(200)}`).end(
          JSON.stringify({
            success: true,
            message: "Patients retrieved successfully.",
            data: patientList,
            meta: {
              totalPatients,
              currentPage: page,
              nextPage,
            },
          })
        );
      });

    } catch (error) {
      logger.error("Fetching patients failed due to server error.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  });
};
