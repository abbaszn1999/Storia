import { InsufficientCreditsError } from "../../ai/errors";
import type { AiUsage } from "../types";
import { storage } from "../../storage";

// ═══════════════════════════════════════════════════════════════════════════════
// CREDITS SYSTEM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const CREDITS_DISABLED = false;
const CREDITS_PER_USD = Number(process.env.CREDITS_PER_USD ?? 1);

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
  // Skip credit check if disabled
  if (CREDITS_DISABLED) return;
  
  const { estimatedCostUsd, userId } = options;
  if (estimatedCostUsd <= 0) return;
  
  if (!userId) {
    throw new Error("userId is required for credit checking");
  }
  
  const creditsNeeded = estimatedCostUsd * CREDITS_PER_USD; // Exact decimal calculation
  const balance = await storage.getUserCredits(userId);
  
  if (balance < creditsNeeded) {
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
  const { amountUsd, userId } = options;
  
  // Skip credit charging if disabled (return mock transaction)
  if (CREDITS_DISABLED) {
    return {
      id: `credit_skip_${Date.now()}`,
      type: "charge",
      amountUsd: amountUsd > 0 ? amountUsd : 0,
      balanceAfter: 999999,
      createdAt: new Date(),
      userId: options.userId,
      workspaceId: options.workspaceId,
    };
  }
  
  if (amountUsd <= 0) {
    throw new Error("Charge amount must be positive");
  }
  
  if (!userId) {
    throw new Error("userId is required for charging credits");
  }
  
  const creditsToDeduct = amountUsd * CREDITS_PER_USD; // Exact decimal calculation
  const currentBalance = await storage.getUserCredits(userId);
  
  if (currentBalance < creditsToDeduct) {
    throw new InsufficientCreditsError();
  }
  
  const newBalance = await storage.deductUserCredits(userId, creditsToDeduct);
  
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
  if (CREDITS_DISABLED) {
    return {
      id: `credit_refund_skip_${Date.now()}`,
      type: "refund",
      amountUsd: Math.abs(options.amountUsd),
      balanceAfter: 999999,
      createdAt: new Date(),
      userId: options.userId,
      workspaceId: options.workspaceId,
    };
  }
  
  const { userId } = options;
  if (!userId) {
    throw new Error("userId is required for refunding credits");
  }
  
  const creditsToRefund = Math.abs(options.amountUsd) * CREDITS_PER_USD; // Exact decimal calculation
  const currentBalance = await storage.getUserCredits(userId);
  const newBalance = currentBalance + creditsToRefund;
  
  await storage.updateUserCredits(userId, newBalance);
  
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

