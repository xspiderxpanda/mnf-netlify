import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("moneyflow");
  const raw = await store.get("transactions");
  const list = raw ? JSON.parse(raw) : [];

  let income = 0, expense = 0;
  for (const t of list) {
    if (t.type === "income") income += Number(t.amount) || 0;
    if (t.type === "expense") expense += Number(t.amount) || 0;
  }
  const balance = income - expense;

  return Response.json({
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    count: list.length,
  });
};
