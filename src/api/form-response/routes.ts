import { Elysia } from "elysia";
import {
  formResponseDTO,
  formResponseForFormOwnerDTO,
  getSubmittedResponseDTO,
} from "../../types/form-response";
import { requireAuth } from "../auth/requireAuth";
import {
<<<<<<< HEAD
  getDraftResponse,
=======
  getAllUserResponses,
>>>>>>> 1e9d4e8 (fix: fix getFormById and form-responses for integration)
  getResponseForFormOwner,
  getSubmittedResponse,
  saveDraftResponse,
  submitResponse,
} from "./controller";

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(requireAuth)
<<<<<<< HEAD
  .post("/submit/:formId", submitResponse, formResponseDTO)
  .post("/draft/:formId", saveDraftResponse, formResponseDTO)
=======
  .get("/my", getAllUserResponses) // Get all responses for current user
  .post("/:formId", submitResponse, formResponseDTO)
  .put("/resume/:responseId", resumeResponse, resumeResponseDTO)
>>>>>>> 1e9d4e8 (fix: fix getFormById and form-responses for integration)
  .get("/:formId", getResponseForFormOwner, formResponseForFormOwnerDTO)
  .get("/user/:formId", getSubmittedResponse, getSubmittedResponseDTO)
  .get("/draft/:formId", getDraftResponse, getSubmittedResponseDTO);
