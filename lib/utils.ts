import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// Compute net balances per user within a group
export type Balance = {
  userId: string;
  name: string;
  image: string | null;
  amount: number; // positive = owed money, negative = owes money
};

export type Settlement = {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
};

// Simplify debts algorithm — find minimum transactions to settle
export function simplifyDebts(balances: Balance[]): Settlement[] {
  const positive = balances
    .filter((b) => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount);
  const negative = balances
    .filter((b) => b.amount < -0.01)
    .sort((a, b) => a.amount - b.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < positive.length && j < negative.length) {
    const creditor = positive[i];
    const debtor = negative[j];
    const amount = Math.min(creditor.amount, -debtor.amount);

    settlements.push({
      from: { id: debtor.userId, name: debtor.name },
      to: { id: creditor.userId, name: creditor.name },
      amount: Math.round(amount * 100) / 100,
    });

    creditor.amount -= amount;
    debtor.amount += amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount > -0.01) j++;
  }

  return settlements;
}
