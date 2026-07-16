// Full-edit rights (fields + photos) are intentionally narrower than
// status-update rights: any active agent can advance a shipment's status,
// but only an admin or the agent who originally created the order can
// rewrite its details.
export function canEditOrder(
  user: { id: string; role: string },
  order: { createdById: string }
): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "AGENT" && user.id === order.createdById;
}
