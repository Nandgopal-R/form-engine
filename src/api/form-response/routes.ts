import { Elysia } from "elysia";
import {
  formResponseDTO,
  formResponseForFormOwnerDTO,
  getSubmittedResponseDTO,
} from "../../types/form-response";
import { requireAuth } from "../auth/requireAuth";
import {
  getDraftResponse,
  getResponseForFormOwner,
  getSubmittedResponse,
  saveDraftResponse,
  submitResponse,
} from "./controller";

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(requireAuth)
  .post("/submit/:formId", submitResponse, formResponseDTO)
  .post("/draft/:formId", saveDraftResponse, formResponseDTO)
  .get("/:formId", getResponseForFormOwner, formResponseForFormOwnerDTO)
  .get("/user/:formId", getSubmittedResponse, getSubmittedResponseDTO)
  .get("/draft/:formId", getDraftResponse, getSubmittedResponseDTO);
