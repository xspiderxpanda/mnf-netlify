const $ = (id) => document.getElementById(id);

function fmt(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ===== Toast =====
function toast(message, type = "info") {
  const root = $("toast-container");
  if (!root) return;

  const el = document.createElement("div");
  const base =
    "animate-fade-in-up px-4 py-2 rounded-xl text-sm border shadow-lg shadow-black/40 backdrop-blur max-w-[92vw]";
  const theme =
    type === "success"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
      : type === "error"
      ? "bg-rose-500/15 text-rose-100 border-rose-500/30"
      : "bg-slate-800/60 text-slate-100 border-slate-700";

  el.className = `${base} ${theme}`;
  el.innerHTML = message;
  root.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "all .25s ease";
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

// ===== Data / Rendering =====
let items = [];

async function loadSummary() {
  const s = await api("/.netlify/functions/tx-summary");
  $("sum-income").textContent = fmt(s.income);
  $("sum-expense").textContent = fmt(s.expense);
  $("sum-balance").textContent = fmt(s.balance);
}

function typeBadge(type) {
  if (type === "income") {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      <i class="fa-solid fa-circle-arrow-down text-[11px]"></i> รายรับ
    </span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-500/15 text-rose-200 border border-rose-500/30">
    <i class="fa-solid fa-circle-arrow-up text-[11px]"></i> รายจ่าย
  </span>`;
}

function renderTable() {
  const tbody = $("txn-list");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-3 py-6 text-center text-slate-500 text-sm">
          ยังไม่มีรายการ
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items
    .map((t) => {
      const isIncome = t.type === "income";
      const amountClass = isIncome ? "text-emerald-300" : "text-rose-200";
      const sign = isIncome ? "+" : "-";

      return `
        <tr class="border-b border-slate-800 hover:bg-slate-950/40">
          <td class="px-3 py-3 text-slate-100">
            <div class="font-medium">${esc(t.category || "-")}</div>
          </td>
          <td class="px-3 py-3 text-center">
            ${typeBadge(t.type)}
          </td>
          <td class="px-3 py-3 text-right font-semibold ${amountClass}">
            ${sign}${fmt(t.amount)}
          </td>
          <td class="px-3 py-3 text-center text-slate-300">
            ${esc(t.date || "")}
          </td>
          <td class="px-3 py-3 text-slate-300">
            <div class="truncate max-w-[240px] md:max-w-[360px]" title="${esc(t.note || "")}">
              ${esc(t.note || "")}
            </div>
          </td>
          <td class="px-3 py-3 text-right">
            <button
              data-del="${esc(t.id)}"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                     bg-rose-500/15 text-rose-100 border border-rose-500/25 hover:bg-rose-500/25 transition">
              <i class="fa-solid fa-trash"></i> ลบ
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  // bind delete buttons
  tbody.querySelectorAll("button[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!id) return;

      try {
        btn.disabled = true;
        btn.classList.add("opacity-60");
        await api(`/.netlify/functions/tx-del?id=${encodeURIComponent(id)}`, {
          method: "POST",
        });
        toast("ลบรายการแล้ว ✅", "success");
        await refresh();
      } catch (e) {
        toast("ลบไม่สำเร็จ: " + e.message, "error");
      } finally {
        btn.disabled = false;
        btn.classList.remove("opacity-60");
      }
    });
  });
}

async function refresh() {
  const r = await api("/.netlify/functions/tx-list");
  items = r.items || [];
  renderTable();
  await loadSummary();
}

// ===== Form submit =====
function initForm() {
  const form = $("txn-form");
  if (!form) return;

  const dateEl = $("txn-date");
  if (dateEl && !dateEl.value) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = $("txn-title")?.value?.trim();
    const type = $("txn-type")?.value;
    const amount = $("txn-amount")?.value;
    const date = $("txn-date")?.value;
    const note = $("txn-note")?.value?.trim();

    if (!title) return toast("กรุณากรอกชื่อรายการ", "error");

    try {
      await api("/.netlify/functions/tx-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          category: title,
          note: note || "",
          date,
        }),
      });

      toast("บันทึกแล้ว ✅", "success");
      $("txn-amount").value = "";
      $("txn-note").value = "";
      $("txn-title").focus();

      await refresh();
    } catch (err) {
      toast("บันทึกไม่สำเร็จ: " + err.message, "error");
    }
  });
}

// ===== Boot =====
document.addEventListener("DOMContentLoaded", async () => {
  initForm();
  try {
    await refresh();
  } catch (e) {
    toast("โหลดข้อมูลไม่สำเร็จ: " + e.message, "error");
  }
});
