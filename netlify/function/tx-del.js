import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const store = getStore("moneyflow");
  const raw = await store.get("transactions");
  const list = raw ? JSON.parse(raw) : [];

  const next = list.filter((x) => x.id !== id);
  await store.set("transactions", JSON.stringify(next));

  return Response.json({ ok: true, removed: id });
};
