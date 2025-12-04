import { InsufficientCreditsError } from "../../ai/errors";
import type { AiUsage } from "../types";

export interface CreditAccountRef {
  userId?: string;
  workspaceId?: string;
}

export interface CreditTransaction extends CreditAccountRef {
  id: string;
  type: "charge" | "refund" | "hold" | "release";
  amountUsd: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const DEFAULT_STARTING_BALANCE_USD = Number(
  process.env.AI_CREDITS_DEFAULT_BALANCE ?? 25,
);

const balances = new Map<string, number>();
const transactions: CreditTransaction[] = [];

function keyFromAccountRef(ref: CreditAccountRef): string {
  return `${ref.userId ?? "anonymous"}::${ref.workspaceId ?? "global"}`;
}

function getBalance(ref: CreditAccountRef): number {
  const key = keyFromAccountRef(ref);
  if (!balances.has(key)) {
    balances.set(key, DEFAULT_STARTING_BALANCE_USD);
  }
  return balances.get(key)!;
}

function setBalance(ref: CreditAccountRef, balance: number): void {
  balances.set(keyFromAccountRef(ref), balance);
}

function recordTransaction(tx: Omit<CreditTransaction, "id" | "createdAt">) {
  const transaction: CreditTransaction = {
    id: `credit_${transactions.length + 1}`,
    createdAt: new Date(),
    ...tx,
  };
  transactions.push(transaction);
  return transaction;
}

export interface EnsureBalanceOptions extends CreditAccountRef {
  estimatedCostUsd: number;
}

export async function ensureBalance(
  options: EnsureBalanceOptions,
): Promise<void> {
  const { estimatedCostUsd } = options;
  if (estimatedCostUsd <= 0) return;
  const balance = getBalance(options);
  if (balance < estimatedCostUsd) {
    throw new InsufficientCreditsError();
  }
}

export interface ChargeCreditsOptions extends CreditAccountRef {
  amountUsd: number;
  metadata?: Record<string, unknown>;
}

export async function chargeCredits(
  options: ChargeCreditsOptions,
): Promise<CreditTransaction> {
  const { amountUsd } = options;
  if (amountUsd <= 0) {
    throw new Error("Charge amount must be positive");
  }
  const balance = getBalance(options);
  if (balance < amountUsd) {
    throw new InsufficientCreditsError();
  }
  const newBalance = balance - amountUsd;
  setBalance(options, newBalance);
  return recordTransaction({
    ...options,
    type: "charge",
    amountUsd,
    balanceAfter: newBalance,
  });
}

export async function refundCredits(
  options: ChargeCreditsOptions,
): Promise<CreditTransaction> {
  const balance = getBalance(options);
  const newBalance = balance + Math.abs(options.amountUsd);
  setBalance(options, newBalance);
  return recordTransaction({
    ...options,
    type: "refund",
    amountUsd: Math.abs(options.amountUsd),
    balanceAfter: newBalance,
  });
}

export interface CreditChargeFromUsageOptions extends CreditAccountRef {
  usage?: AiUsage;
  unitCostUsd?: number;
}

export async function chargeFromUsage(
  options: CreditChargeFromUsageOptions,
): Promise<CreditTransaction | null> {
  if (!options.usage || !options.unitCostUsd) {
    return null;
  }
  const amountUsd = options.unitCostUsd;
  return chargeCredits({
    ...options,
    amountUsd,
  });
}

export function getCreditBalance(ref: CreditAccountRef): number {
  return getBalance(ref);
}

export function listTransactions(): CreditTransaction[] {
  return [...transactions];
}

