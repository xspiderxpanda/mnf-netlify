import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("moneyflow");
  const raw = await store.get("transactions");
  const list = raw ? JSON.parse(raw) : [];
  return Response.json({ items: list });
};
