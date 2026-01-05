const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { type, amount, category, note, date } = body;

  if (!["income", "expense"].includes(type)) {
    return { statusCode: 400, body: "Invalid type" };
  }

  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    return { statusCode: 400, body: "Invalid amount" };
  }

  const tx = {
    id: (globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random()),
    type,
    amount: Math.round(num * 100) / 100,
    category: String(category ?? "อื่นๆ"),
    note: String(note ?? ""),
    date: String(date ?? new Date().toISOString().slice(0, 10)),
    createdAt: new Date().toISOString(),
  };

  const store = getStore("moneyflow");
  const raw = await store.get("transactions");
  const list = raw ? JSON.parse(raw) : [];
  list.unshift(tx);
  await store.set("transactions", JSON.stringify(list));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, tx }),
  };
};
