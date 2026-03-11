import { Elysia } from "elysia";
import {
  formResponseDTO,
  formResponseForFormOwnerDTO,
  getSubmittedResponseDTO,
  resumeResponseDTO,
} from "../../types/form-response";
import { optionalAuth, requireAuth } from "../auth/requireAuth";
import {
  getAllReceivedResponses,
  getAllUserResponses,
  getResponseForFormOwner,
  getSubmittedResponse,
  resumeResponse,
  submitResponse,
} from "./controller";

const publicResponseRoutes = new Elysia()
  .use(optionalAuth)
  .post("/submit/:formId", submitResponse, formResponseDTO)
  .post("/draft/:formId", submitResponse, formResponseDTO);

const protectedResponseRoutes = new Elysia()
  .use(requireAuth)
  .put("/resume/:responseId", resumeResponse, resumeResponseDTO)
  .get("/my", getAllUserResponses)
  .get("/received", getAllReceivedResponses)
  .get("/:formId", getResponseForFormOwner, formResponseForFormOwnerDTO)
  .get("/user/:formId", getSubmittedResponse, getSubmittedResponseDTO);

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(publicResponseRoutes)
  .use(protectedResponseRoutes);
