import { requireAuth } from "../auth/requireAuth";
import { submitResponse, resumeResponse } from "./controller";
import { formResponseDTO, resumeResponseDTO } from "../../types/form-response";

import { Elysia } from "elysia";

export const formResponseRoutes = new Elysia({ prefix: "/responses" })
  .use(requireAuth)
  .post("/:formId", submitResponse, formResponseDTO)
  .put("/resume/:responseId", resumeResponse, resumeResponseDTO);
