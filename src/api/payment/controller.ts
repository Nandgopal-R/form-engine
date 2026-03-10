import { prisma } from "../../db/prisma";
import { logger } from "../../logger";
import {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../../services/razorpay";
import type {
  CreateOrderContext,
  GetPaymentStatusContext,
  VerifyPaymentContext,
  WebhookContext,
} from "../../types/payment";

/**
 * Create a Razorpay order for a payment field
 */
export async function createPaymentOrder({
  params,
  body,
  user,
  set,
}: CreateOrderContext) {
  const { formId, fieldId } = params;

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    set.status = 404;
    return { success: false, message: "Form not found" };
  }

  const field = await prisma.formFields.findFirst({
    where: { id: fieldId, formId },
  });

  if (!field || field.fieldType !== "payment") {
    set.status = 404;
    return { success: false, message: "Payment field not found" };
  }

  const fieldOptions = field.options as {
    amount: number;
    currency?: string;
    description?: string;
  } | null;

  const amount = body.amount || fieldOptions?.amount || 0;
  const currency = body.currency || fieldOptions?.currency || "INR";

  if (amount <= 0) {
    set.status = 400;
    return { success: false, message: "Invalid amount" };
  }

  try {
    const order = await createOrder({
      amount,
      currency,
      receipt: `form_${formId}_${Date.now()}`,
      notes: {
        formId,
        fieldId,
        userId: user.id,
        responseId: body.responseId || "",
      },
    });

    await prisma.payment.create({
      data: {
        amount,
        currency,
        status: "pending",
        razorpayOrderId: order.id,
        formId,
        formFieldId: fieldId,
        respondentId: user.id,
        metadata: {
          description:
            fieldOptions?.description || `Payment for form: ${form.title}`,
        },
      },
    });

    logger.info(
      `Created Razorpay order ${order.id} for user ${user.id}, form ${formId}`,
    );

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    };
  } catch (error) {
    logger.error(`Failed to create Razorpay order: ${error}`);
    set.status = 500;
    return { success: false, message: "Failed to create payment order" };
  }
}

/**
 * Verify payment after Razorpay checkout success callback
 */
export async function verifyPayment({ body, user, set }: VerifyPaymentContext) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    responseId,
  } = body;

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    set.status = 400;
    return { success: false, message: "Invalid payment signature" };
  }

  try {
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: "completed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    if (responseId) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
      });
      if (payment) {
        await prisma.formResponse.update({
          where: { id: responseId },
          data: { paymentId: payment.id },
        });
      }
    }

    logger.info(
      `Payment verified for order ${razorpay_order_id}, user ${user.id}`,
    );

    return {
      success: true,
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "completed",
      },
    };
  } catch (error) {
    logger.error(`Payment verification failed: ${error}`);
    set.status = 500;
    return { success: false, message: "Payment verification failed" };
  }
}

/**
 * Get payment status by Razorpay order ID
 */
export async function getPaymentStatus({ params }: GetPaymentStatusContext) {
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: params.orderId },
  });

  if (!payment) {
    return { success: false, message: "Payment not found" };
  }

  return {
    success: true,
    data: {
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
    },
  };
}

/**
 * Handle Razorpay webhook events
 */
export async function handleWebhook({ body, set, request }: WebhookContext) {
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    set.status = 400;
    return { success: false, message: "Missing x-razorpay-signature header" };
  }

  try {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const isValid = verifyWebhookSignature(payload, signature);

    if (!isValid) {
      set.status = 400;
      return { success: false, message: "Invalid webhook signature" };
    }

    const event = JSON.parse(payload);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;

        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            status: "completed",
            razorpayPaymentId: paymentEntity.id,
          },
        });

        logger.info(`Webhook: Payment captured for order ${orderId}`);
      }
    }

    return { success: true };
  } catch (error) {
    logger.error(`Webhook error: ${error}`);
    set.status = 400;
    return { success: false, message: "Webhook processing failed" };
  }
}

/**
 * Get Razorpay key ID for frontend config
 */
export function getConfig() {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) {
    return { success: false, message: "Razorpay is not configured" };
  }
  return {
    success: true,
    data: { keyId: key },
  };
}
