// Linear progress track for an exchange request. FAILED is a terminal
// side-branch off PENDING or PROCESSING and is handled separately by the
// timeline component rather than being part of this ordered list.
export const EXCHANGE_STATUS_ORDER = ["PENDING", "PROCESSING", "COMPLETED"] as const;
