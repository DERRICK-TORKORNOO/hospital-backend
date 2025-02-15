import {  TemplatedApp } from "uWebSockets.js";
import { login } from "../controllers/auth/login.controller";
import { signup } from "../controllers/auth/signup.controller";
import { updatePassword } from "../controllers/auth/updatePassword.controller";

/**
 * Configures authentication-related routes.
 * @param app - uWebSockets.js app instance
 */
export const configureAuthRoutes = (app: TemplatedApp) => {
  app.post("/api/auth/login", (res: any, req: any) => login(res, req));
  app.post("/api/auth/signup", (res: any, req: any) => signup(res, req));
  app.post("/api/auth/update-password", (res: any, req: any) => updatePassword(res, req));

  console.log("✅ Authentication routes configured successfully.");
};
