import { Elysia } from "elysia";
import {
  formResponseDTO,
  formResponseForFormOwnerDTO,
  getSubmittedResponseDTO,
  resumeResponseDTO,
} from "../../types/form-response";
import { requireAuth } from "../auth/requireAuth";
import {
  getAllUserResponses,
  getResponseForFormOwner,
  getSubmittedResponse,
  resumeResponse,
  submitResponse,
} from "./controller";

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(requireAuth)
  .post("/submit/:formId", submitResponse, formResponseDTO)
  .post("/draft/:formId", submitResponse, formResponseDTO)
  .put("/resume/:responseId", resumeResponse, resumeResponseDTO)
  .get("/my", getAllUserResponses)
  .get("/:formId", getResponseForFormOwner, formResponseForFormOwnerDTO)
  .get("/user/:formId", getSubmittedResponse, getSubmittedResponseDTO);
