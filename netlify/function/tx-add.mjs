import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { type, amount, category, note, date } = body ?? {};
  if (!["income", "expense"].includes(type)) return new Response("Invalid type", { status: 400 });

  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return new Response("Invalid amount", { status: 400 });

  const tx = {
    id: crypto.randomUUID(),
    type,
    amount: Math.round(num * 100) / 100,
    category: String(category ?? "อื่นๆ"),
    note: String(note ?? ""),
    date: String(date ?? new Date().toISOString().slice(0, 10)), // YYYY-MM-DD
    createdAt: new Date().toISOString(),
  };

  const store = getStore("moneyflow");
  const raw = await store.get("transactions");
  const list = raw ? JSON.parse(raw) : [];
  list.unshift(tx);

  await store.set("transactions", JSON.stringify(list));
  return Response.json({ ok: true, tx });
};
