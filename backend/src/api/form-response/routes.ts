import { Elysia } from "elysia";
import {
  formResponseDTO,
  formResponseForFormOwnerDTO,
  resumeResponseDTO,
} from "../../types/form-response";
import { requireAuth } from "../auth/requireAuth";
import {
  getResponseForFormOwner,
  resumeResponse,
  submitResponse,
} from "./controller";

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(requireAuth)
  .post("/:formId", submitResponse, formResponseDTO)
  .put("/resume/:responseId", resumeResponse, resumeResponseDTO)
  .get(
    "/responses/:formId",
    getResponseForFormOwner,
    formResponseForFormOwnerDTO,
  );
