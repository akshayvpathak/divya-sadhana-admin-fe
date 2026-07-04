import { z } from "zod";
import { userSchema } from "./payments.schema";

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
  courier_name: z.string().nullable().optional(),
  tracking_url: z.string().nullable().optional(),
  shipping_status: z.string().optional(),
  user: z.union([z.string(), userSchema]).nullable().optional(),
});

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
