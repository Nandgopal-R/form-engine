import { requireAuth } from "../auth/requireAuth";
import { getAllForms, createForm, getFormById, updateForm } from "./controller";
import { createFormDTO, getFormByIdDTO, updateFormDTO } from "../../types/forms";
import { Elysia } from "elysia";

export const formRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .get("/", getAllForms)
  .post("/", createForm, createFormDTO)
  .get("/:id", getFormById, getFormByIdDTO)
  .put("/:id", updateForm, updateFormDTO);


