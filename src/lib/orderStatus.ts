import { OrderStatus } from "@prisma/client";

// Linear lifecycle: PENDING -> IN_TRANSIT -> AT_PORT -> AT_WAREHOUSE -> PICKED_UP
export const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "IN_TRANSIT",
  "AT_PORT",
  "AT_WAREHOUSE",
  "PICKED_UP",
];

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  // only allow moving forward one step at a time
  return toIndex === fromIndex + 1;
}

// Each forward transition stamps the corresponding timestamp field on Order.
export const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  IN_TRANSIT: "shippedAt",
  AT_PORT: "arrivedAtPortAt",
  AT_WAREHOUSE: "arrivedAtWarehouseAt",
  PICKED_UP: "pickedUpAt",
};
