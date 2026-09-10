import { toNumber } from '@/lib/currency';
import type { Order } from '@/schemas/orders.schema';

/**
 * Commission arithmetic for one order, from the snapshots the order already
 * carries. Used only until the backend returns `commission_breakdown`, which
 * supersedes every number here.
 *
 * Two things this file exists to get right:
 *
 * 1. The base is `subtotal_amount − discount_amount`, not the total. Commission
 *    is never charged on a rebate the customer did not pay, and shipping and tax
 *    are not commissionable either.
 *
 * 2. `area_commission_percent_snapshot` is the **whole pool** (15.00 on orders
 *    placed under the current rules), not the attributed member's own share. A
 *    trustee's share is 1.50%. Labelling the pool as one person's rate overstates
 *    their earnings by ten times, so the two are kept firmly apart here.
 */

/** What commission is charged on: subtotal less discount. */
export function commissionBase(order: Order): number {
  return Math.max(0, toNumber(order.subtotal_amount) - toNumber(order.discount_amount));
}

/** The pool percent captured at checkout, shared across every role. */
export function poolPercent(order: Order): number {
  return toNumber(order.area_commission_percent_snapshot ?? order.commission_percent_snapshot);
}

/** Rupees in the pool for this order, before it is split between roles. */
export function poolAmount(order: Order): number {
  return round2((commissionBase(order) * poolPercent(order)) / 100);
}

/** One member's share of the base at their own rate. */
export function shareAmount(base: number, percent: number | string | null | undefined): number {
  const pct = toNumber(percent);
  if (!pct) return 0;
  return round2((base * pct) / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
