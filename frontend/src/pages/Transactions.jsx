import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const blankForm = () => ({
  type: "expense",
  description: "",
  amount: "",
  category: "",
  date: localDate(),
});
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : localDate();
}
function displayDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Date unavailable";
}

export default function Transactions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);

  const loadRecords = useCallback(async () => {
    const token = localStorage.getItem("spendwise_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [incomeResponse, expenseResponse] = await Promise.all([
        fetch(`${API_BASE}/api/income/get`, { headers }),
        fetch(`${API_BASE}/api/expense/get`, { headers }),
      ]);
      if (incomeResponse.status === 401 || expenseResponse.status === 401) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login", { replace: true });
        return;
      }
      const [income, expenses] = await Promise.all([
        incomeResponse.json(),
        expenseResponse.json(),
      ]);
      if (!incomeResponse.ok || !expenseResponse.ok)
        throw new Error(
          income.message || expenses.message || "Could not load transactions.",
        );
      setRecords(
        [
          ...(Array.isArray(income)
            ? income.map((item) => ({ ...item, type: "income" }))
            : []),
          ...(Array.isArray(expenses)
            ? expenses.map((item) => ({ ...item, type: "expense" }))
            : []),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)),
      );
    } catch (loadError) {
      setError(loadError.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const addType = searchParams.get("add");
    if (addType === "income" || addType === "expense") {
      setEditing(null);
      setForm({ ...blankForm(), type: addType });
      setError("");
      setModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const visibleRecords = useMemo(
    () =>
      records.filter((item) => {
        const matchesType = filter === "all" || item.type === filter;
        const text =
          `${item.description || ""} ${item.category || ""}`.toLowerCase();
        return matchesType && text.includes(query.trim().toLowerCase());
      }),
    [records, filter, query],
  );
  const totals = useMemo(
    () =>
      visibleRecords.reduce(
        (result, item) => {
          result[item.type] += Number(item.amount) || 0;
          return result;
        },
        { income: 0, expense: 0 },
      ),
    [visibleRecords],
  );

  function openCreate() {
    setEditing(null);
    setForm(blankForm());
    setError("");
    setModal(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({
      type: item.type,
      description: item.description || "",
      amount: String(item.amount ?? ""),
      category: item.category || "",
      date: dateInput(item.date),
    });
    setError("");
    setModal(true);
  }
  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const token = localStorage.getItem("spendwise_token");
    const kind = editing ? editing.type : form.type;
    const base = kind === "income" ? "income" : "expense";
    const endpoint = editing ? `${base}/update/${editing._id}` : `${base}/add`;
    try {
      const response = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: form.description.trim(),
          amount: Number(form.amount),
          category: form.category.trim(),
          date: form.date,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false)
        throw new Error(result.message || "Could not save this transaction.");
      setModal(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError.message || "Could not connect to the backend.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(item) {
    if (!window.confirm(`Delete “${item.description}”? This cannot be undone.`))
      return;
    setError("");
    const token = localStorage.getItem("spendwise_token");
    const kind = item.type === "income" ? "income" : "expense";
    try {
      const response = await fetch(
        `${API_BASE}/api/${kind}/delete/${item._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok || result.success === false)
        throw new Error(result.message || "Could not delete this transaction.");
      await loadRecords();
    } catch (deleteError) {
      setError(deleteError.message || "Could not connect to the backend.");
    }
  }

  return (
    <Layout>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
            Your activity
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-white/40">
            All your income and expenses in one place.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07110b] shadow-[0_0_24px_rgba(76,255,165,0.12)] transition hover:bg-emerald-200"
        >
          ＋ Add transaction
        </button>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1410] px-5 py-4">
          <p className="text-xs text-white/40">Showing</p>
          <p className="mt-2 text-lg font-semibold">
            {visibleRecords.length}{" "}
            <span className="text-sm font-normal text-white/40">records</span>
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/[0.08] bg-[#0c1410] px-5 py-4">
          <p className="text-xs text-white/40">Income in view</p>
          <p className="mt-2 text-lg font-semibold text-emerald-200">
            {currency.format(totals.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200/[0.08] bg-[#0c1410] px-5 py-4">
          <p className="text-xs text-white/40">Expenses in view</p>
          <p className="mt-2 text-lg font-semibold text-rose-200">
            {currency.format(totals.expense)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1410]">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div
            className="flex gap-1 rounded-xl bg-black/20 p-1"
            aria-label="Filter transactions"
          >
            {[
              ["all", "All"],
              ["income", "Income"],
              ["expense", "Expenses"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${filter === value ? "bg-emerald-300/10 text-emerald-200" : "text-white/45 hover:text-white/75"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">Search transactions</span>
            <span
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            >
              ⌕
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search description or category"
              className="w-full rounded-xl border border-white/10 bg-[#080e0b] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-300/40"
            />
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[68px] animate-pulse rounded-xl bg-white/[0.03]"
              />
            ))}
          </div>
        ) : visibleRecords.length ? (
          <div className="divide-y divide-white/[0.06] px-4 sm:px-5">
            {visibleRecords.map((item) => {
              const isIncome = item.type === "income";
              return (
                <article
                  key={`${item.type}-${item._id}`}
                  className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base ${isIncome ? "bg-emerald-300/[0.08] text-emerald-200" : "bg-rose-300/[0.07] text-rose-200"}`}
                  >
                    {isIncome ? "↗" : "↘"}
                  </span>
                  <div className="min-w-[130px] flex-1">
                    <p className="text-sm font-medium text-white/85">
                      {item.description || item.category || "Transaction"}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      {item.category || (isIncome ? "Income" : "Expense")} ·{" "}
                      {displayDate(item.date)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${isIncome ? "bg-emerald-300/[0.08] text-emerald-200" : "bg-rose-300/[0.07] text-rose-200"}`}
                  >
                    {isIncome ? "Income" : "Expense"}
                  </span>
                  <p
                    className={`w-32 text-right text-sm font-semibold ${isIncome ? "text-emerald-200" : "text-white/80"}`}
                  >
                    {isIncome ? "+" : "−"}
                    {currency.format(Number(item.amount) || 0)}
                  </p>
                  <div className="ml-auto flex gap-1 sm:ml-1">
                    <button
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.description}`}
                      className="rounded-lg px-2.5 py-2 text-xs text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(item)}
                      aria-label={`Delete ${item.description}`}
                      className="rounded-lg px-2.5 py-2 text-xs text-white/40 transition hover:bg-rose-300/[0.08] hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-xl text-emerald-200/70">
              ↕
            </div>
            <h2 className="mt-4 text-sm font-medium text-white/75">
              {query ? "No matching transactions" : "No transactions yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/35">
              {query
                ? "Try a different search term or filter."
                : "Add your first income or expense to start seeing your activity here."}
            </p>
            {!query && (
              <button
                onClick={openCreate}
                className="mt-5 rounded-lg border border-emerald-200/20 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-300/[0.07]"
              >
                Add your first transaction
              </button>
            )}
          </div>
        )}
      </section>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-title"
            className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1410] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                  Transaction details
                </p>
                <h2
                  id="transaction-title"
                  className="mt-2 text-xl font-semibold"
                >
                  {editing ? "Edit transaction" : "Add transaction"}
                </h2>
              </div>
              <button
                onClick={() => setModal(false)}
                aria-label="Close"
                className="rounded-lg px-2 py-1 text-xl text-white/40 hover:bg-white/[0.06] hover:text-white"
              >
                ×
              </button>
            </div>
            {!editing && (
              <div className="mt-5 grid grid-cols-2 rounded-xl bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, type: "expense" }))
                  }
                  aria-pressed={form.type === "expense"}
                  className={`rounded-lg py-2.5 text-sm font-medium ${form.type === "expense" ? "bg-rose-300/10 text-rose-200" : "text-white/45"}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, type: "income" }))
                  }
                  aria-pressed={form.type === "income"}
                  className={`rounded-lg py-2.5 text-sm font-medium ${form.type === "income" ? "bg-emerald-300/10 text-emerald-200" : "text-white/45"}`}
                >
                  Income
                </button>
              </div>
            )}
            <form onSubmit={submitForm} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="transaction-description"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  Description
                </label>
                <input
                  id="transaction-description"
                  name="description"
                  required
                  value={form.description}
                  onChange={updateField}
                  placeholder=""
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="transaction-amount"
                    className="mb-1.5 block text-xs text-white/65"
                  >
                    Amount (₹)
                  </label>
                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={updateField}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="transaction-date"
                    className="mb-1.5 block text-xs text-white/65"
                  >
                    Date
                  </label>
                  <input
                    id="transaction-date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={updateField}
                    className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="transaction-category"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  Category
                </label>
                <input
                  id="transaction-category"
                  name="category"
                  required
                  value={form.category}
                  onChange={updateField}
                  placeholder={
                    form.type === "income" ? "e.g. Salary" : "e.g. Food"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/50"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-3 py-2 text-xs text-rose-100"
                >
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55 hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07110b] transition hover:bg-emerald-200 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Add transaction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </Layout>
  );
}
