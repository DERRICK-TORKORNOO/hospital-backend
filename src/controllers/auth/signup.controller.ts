import { HttpResponse, HttpRequest } from "uWebSockets.js";
import { AppDataSource } from "../../config/ormconfig"; 
import { User } from "../../entities/user.entity"; 
import { UserRole } from "../../enums/userRole.enum"; 
import bcrypt from "bcrypt";
import logger from "../../config/logger.config";
import { attachAbortHandler } from "../../utils/abortHandler"; 
import { handleError } from "../../utils/handleError"; 
import { parseRequestBody } from "../../utils/parseRequestBody"; 
import { getStatusText } from "../../utils/getStatusText";
import { corsMiddleware } from "../../services/cors";
import { protectRoute } from "../../services/protectRoute";

/**
 * Handles user signup for Patients and Doctors.
 * @param res - uWebSockets response object
 * @param req - uWebSockets request object
 */
export const signup = async (res: HttpResponse, req: HttpRequest): Promise<void> => {
  corsMiddleware(res, req); // ✅ Apply CORS middleware
  const isAborted = attachAbortHandler(res); // ✅ Track if request is aborted

  protectRoute(res, req, async () => {
    try {
      const body = await parseRequestBody(res); // ✅ Parse request body

      if (isAborted()) {
        logger.warn("Signup request aborted by client.");
        return;
      }

      const { name, email, password, role } = body;

      // ✅ Validate required fields
      if (!name || !email || !password || !role) {
        logger.warn("Signup failed: Missing required fields.");
        handleError(res, { statusCode: 400, message: "All fields (name, email, password, role) are required." });
        return;
      }

      // ✅ Validate role
      if (![UserRole.PATIENT, UserRole.DOCTOR].includes(role)) {
        logger.warn(`Signup failed: Invalid role '${role}' provided.`);
        handleError(res, { statusCode: 400, message: "Invalid role. Must be either 'patient' or 'doctor'." });
        return;
      }

      // ✅ Check if email already exists
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        logger.warn(`Signup failed: Email '${email}' is already in use.`);
        handleError(res, { statusCode: 409, message: "Email is already registered." });
        return;
      }

      // ✅ Hash password securely
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Create new user
      const newUser = userRepository.create({ name, email, password: hashedPassword, role });
      await userRepository.save(newUser);

      logger.info(`New user registered: ${email} as ${role}`);

      // ✅ Remove password before returning user data
      const { password: _, ...userData } = newUser;

      res.cork(() => {
        res.writeStatus(`201 ${getStatusText(201)}`).end(JSON.stringify({
          success: true,
          message: "User registered successfully.",
          data: userData
        }));
      });

    } catch (error) {
      logger.error("Signup failed due to server error.", { error });
      handleError(res, { statusCode: 500, message: "Internal server error." });
    }
  }); // ✅ Pass `res`, `req`, and `next` callback
};
