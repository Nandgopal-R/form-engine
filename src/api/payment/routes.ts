import { Elysia } from "elysia";
import {
  createOrderDTO,
  getPaymentStatusDTO,
  verifyPaymentDTO,
} from "../../types/payment";
import { requireAuth } from "../auth/requireAuth";
import {
  createPaymentOrder,
  getConfig,
  getPaymentStatus,
  handleWebhook,
  verifyPayment,
} from "./controller";

// Webhook route — no auth, raw body for signature verification
const webhookRoutes = new Elysia({ prefix: "/payments" }).post(
  "/webhook",
  handleWebhook,
  { parse: "text" },
);

// Authenticated payment routes
const authedPaymentRoutes = new Elysia({ prefix: "/payments" })
  .use(requireAuth)
  .post("/order/:formId/:fieldId", createPaymentOrder, createOrderDTO)
  .post("/verify", verifyPayment, verifyPaymentDTO)
  .get("/status/:orderId", getPaymentStatus, getPaymentStatusDTO)
  .get("/config", getConfig);

export const paymentRoutes = new Elysia()
  .use(webhookRoutes)
  .use(authedPaymentRoutes);
