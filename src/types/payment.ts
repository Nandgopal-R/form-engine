import { type Static, t } from "elysia";

export const createOrderDTO = {
  params: t.Object({
    formId: t.String({
      format: "uuid",
    }),
    fieldId: t.String({
      format: "uuid",
    }),
  }),
  body: t.Object({
    amount: t.Number(),
    currency: t.Optional(t.String()),
    responseId: t.Optional(t.String()),
  }),
};

export interface CreateOrderContext {
  params: Static<typeof createOrderDTO.params>;
  body: Static<typeof createOrderDTO.body>;
  user: { id: string };
  set: { status?: number | string };
}

export const verifyPaymentDTO = {
  body: t.Object({
    razorpay_order_id: t.String(),
    razorpay_payment_id: t.String(),
    razorpay_signature: t.String(),
    formId: t.String(),
    fieldId: t.String(),
    responseId: t.Optional(t.String()),
  }),
};

export interface VerifyPaymentContext {
  body: Static<typeof verifyPaymentDTO.body>;
  user: { id: string };
  set: { status?: number | string };
}

export const getPaymentStatusDTO = {
  params: t.Object({
    orderId: t.String(),
  }),
};

export interface GetPaymentStatusContext {
  params: Static<typeof getPaymentStatusDTO.params>;
}

export interface WebhookContext {
  body: unknown;
  set: { status?: number | string };
  request: Request;
}
