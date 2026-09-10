import { z } from "zod";
import { userSchema } from "./payments.schema";

const moneyLoose = z.union([z.number(), z.string()]).nullish();

export const commissionBreakdownSliceSchema = z
  .object({
    kind: z.string().optional(),
    role: z.string().optional(),
    percent: moneyLoose,
    amount: moneyLoose,
    beneficiary_name: z.string().nullable().optional(),
    beneficiary_id: z.string().nullable().optional(),
    is_retained: z.boolean().optional(),
    is_fallback_to_admin: z.boolean().optional(),
    retention_reason: z.string().nullable().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const commissionBreakdownSchema = z
  .object({
    base_amount: moneyLoose,
    pool_percent: moneyLoose,
    commissionable: z.boolean().optional(),
    slices: z.array(commissionBreakdownSliceSchema).optional().default([]),
    totals: z
      .object({
        paid_to_network: moneyLoose,
        retained_by_admin: moneyLoose,
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  is_deleted: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  product_name_snapshot: z.string().optional(),
  sku_snapshot: z.string().optional(),
  unit_price_snapshot: z.union([z.number(), z.string()]).optional(),
  quantity: z.number().optional(),
  line_total: z.union([z.number(), z.string()]).optional(),
  order: z.string().uuid().optional(),
  product: z.string().uuid().optional(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(orderItemSchema).optional(),
  is_deleted: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  order_number: z.string(),
  status: z.string().optional(),
  payment_status: z.string().optional(),
  source: z.string().optional(),
  currency: z.string().optional(),
  subtotal_amount: z.union([z.number(), z.string()]).transform((v) => parseFloat(String(v))).optional(),
  discount_amount: z.union([z.number(), z.string()]).transform((v) => parseFloat(String(v))).optional(),
  tax_amount: z.union([z.number(), z.string()]).transform((v) => parseFloat(String(v))).optional(),
  shipping_amount: z.union([z.number(), z.string()]).transform((v) => parseFloat(String(v))).optional(),
  total_amount: z.union([z.number(), z.string()]).transform((v) => parseFloat(String(v))).optional(),
  notes: z.string().nullable().optional(),
  shiprocket_order_id: z.string().nullable().optional(),
  shiprocket_shipment_id: z.string().nullable().optional(),
  awb_code: z.string().nullable().optional(),
  courier_partner: z.string().nullable().optional(),
  courier_name: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  tracking_url: z.string().nullable().optional(),
  shipping_status: z.string().optional(),
  dispatched_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  returned_at: z.string().nullable().optional(),
  is_returned: z.boolean().optional(),
  shipping_name: z.string().nullable().optional(),
  shipping_phone: z.string().nullable().optional(),
  shipping_email: z.string().nullable().optional(),
  shipping_line1: z.string().nullable().optional(),
  shipping_line2: z.string().nullable().optional(),
  shipping_locality: z.string().nullable().optional(),
  shipping_city: z.string().nullable().optional(),
  shipping_state: z.string().nullable().optional(),
  shipping_pincode: z.string().nullable().optional(),
  shipping_country: z.string().nullable().optional(),
  tracking_summary: z
    .object({
      shipping_status: z.string().nullable().optional(),
      shipping_status_label: z.string().nullable().optional(),
      is_dispatched: z.boolean().optional(),
      is_delivered: z.boolean().optional(),
      courier_name: z.string().nullable().optional(),
      tracking_number: z.string().nullable().optional(),
      estimated_delivery_max: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  user: z.union([z.string(), userSchema]).nullable().optional(),
  commission_breakdown: commissionBreakdownSchema.nullable().optional(),
});

export const courierPartnerOptions = [
  { value: "india_post", label: "India Post" },
  { value: "anjani", label: "Shree Anjani Courier" },
  { value: "other", label: "Other Courier" },
] as const;

export type CourierPartner = (typeof courierPartnerOptions)[number]["value"];

export const shippingStatusChoices = [
  "pending",
  "shipped",
  "delivered",
  "rto",
  "cancelled",
] as const;

export type ShippingStatusChoice = (typeof shippingStatusChoices)[number];

export const updateOrderShippingSchema = z.object({
  shipping_status: z.enum(shippingStatusChoices).optional(),
  courier_partner: z.enum(["india_post", "anjani", "other", ""]).optional(),
  courier_name: z.string().nullable().optional(),
  tracking_number: z.string().optional(),
  dispatched_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  returned_at: z.string().nullable().optional(),
  is_returned: z.boolean().optional(),
});

export type UpdateOrderShippingPayload = z.infer<typeof updateOrderShippingSchema>;

export const ordersListSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(orderSchema),
  }),
});

export type Order = z.infer<typeof orderSchema>;
export type OrdersList = z.infer<typeof ordersListSchema>;
export type CommissionBreakdownSlice = z.infer<typeof commissionBreakdownSliceSchema>;
export type CommissionBreakdown = z.infer<typeof commissionBreakdownSchema>;
