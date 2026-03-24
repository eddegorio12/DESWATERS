export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "GCASH", "MAYA", "CARD"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
