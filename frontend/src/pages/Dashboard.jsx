import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return money.format(Number(value) || 0);
}
function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function MetricCard({ label, amount, note, accent, icon, isPercent = false }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/45">{label}</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            {isPercent ? `${Number(amount) || 0}%` : formatMoney(amount)}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl border text-lg ${accent}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-xs text-white/35">{note}</p>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("spendwise_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetch(`${API_BASE}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("spendwise_token");
          localStorage.removeItem("spendwise_user");
          navigate("/login", { replace: true });
          return null;
        }
        if (!response.ok || !result.success)
          throw new Error(result.message || "Could not load your dashboard.");
        return result.data;
      })
      .then((result) => {
        if (result) setData(result);
      })
      .catch((requestError) =>
        setError(requestError.message || "Could not connect to the backend."),
      )
      .finally(() => setLoading(false));
  }, [navigate]);

  const categories = useMemo(() => data?.expenseDistribution || [], [data]);
  const maxCategoryAmount = Math.max(
    1,
    ...categories.map((item) => Number(item.amount) || 0),
  );
  const transactions = data?.recentTransactions || [];

  return (
    <Layout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
            Monthly overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your money, at a glance
          </h1>
          <p className="mt-2 text-sm text-white/40">
            A clear view of what came in and where it went.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/transactions?add=income")}
            className="rounded-xl border border-emerald-200/15 bg-emerald-300/[0.07] px-3 py-2.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-300/[0.12]"
          >
            ＋ Add income
          </button>
          <button
            onClick={() => navigate("/transactions?add=expense")}
            className="rounded-xl border border-rose-200/15 bg-rose-300/[0.05] px-3 py-2.5 text-xs font-medium text-rose-200 transition hover:bg-rose-300/[0.1]"
          >
            ＋ Add expense
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100"
        >
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-rose-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
            />
          ))}
        </div>
      ) : (
        data && (
          <>
            <section
              aria-label="Monthly totals"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Income"
                amount={data.monthlyIncome}
                note="Money received this month"
                icon="↗"
                accent="border-emerald-200/10 bg-emerald-300/[0.08] text-emerald-200"
              />
              <MetricCard
                label="Expenses"
                amount={data.monthlyExpense}
                note="Money spent this month"
                icon="↘"
                accent="border-rose-200/10 bg-rose-300/[0.07] text-rose-200"
              />
              <MetricCard
                label="Savings"
                amount={data.savings}
                note="Income minus expenses"
                icon="◈"
                accent="border-cyan-200/10 bg-cyan-300/[0.07] text-cyan-200"
              />
              <MetricCard
                label="Savings rate"
                amount={data.savingsRate}
                isPercent
                note="Share of income remaining"
                icon="％"
                accent="border-lime-200/10 bg-lime-300/[0.07] text-lime-200"
              />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Spending by category</h2>
                    <p className="mt-1 text-xs text-white/40">
                      How this month’s expenses are divided
                    </p>
                  </div>
                  <span className="text-xs text-white/35">
                    {categories.length}{" "}
                    {categories.length === 1 ? "category" : "categories"}
                  </span>
                </div>
                {categories.length ? (
                  <div className="mt-7 space-y-5">
                    {categories
                      .slice()
                      .sort((a, b) => b.amount - a.amount)
                      .map((item) => (
                        <div key={item.category}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-white/75">
                              {item.category}
                            </span>
                            <span className="shrink-0 text-white/55">
                              {formatMoney(item.amount)}{" "}
                              <span className="ml-1 text-xs text-white/30">
                                {item.percent}%
                              </span>
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(110,231,168,0.28)]"
                              style={{
                                width: `${Math.max(2, (Number(item.amount) / maxCategoryAmount) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="mt-7 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                    <p className="text-sm text-white/55">
                      No spending categories yet
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Expense categories will appear here as you add expenses.
                    </p>
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Recent transactions</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Your latest activity this month
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-200/10 bg-emerald-300/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-emerald-200/75">
                    {transactions.length} records
                  </span>
                </div>
                {transactions.length ? (
                  <div className="mt-5 divide-y divide-white/[0.06]">
                    {transactions.slice(0, 6).map((item) => {
                      const isIncome = item.type === "income";
                      return (
                        <div
                          key={`${item.type}-${item._id}`}
                          className="flex items-center gap-3 py-3.5"
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm ${isIncome ? "bg-emerald-300/[0.08] text-emerald-200" : "bg-rose-300/[0.07] text-rose-200"}`}
                          >
                            {isIncome ? "↗" : "↘"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white/80">
                              {item.description ||
                                item.category ||
                                "Transaction"}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/35">
                              {item.category ||
                                (isIncome ? "Income" : "Expense")}{" "}
                              · {formatDate(item.date)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm font-medium ${isIncome ? "text-emerald-200" : "text-white/70"}`}
                          >
                            {isIncome ? "+" : "−"}
                            {formatMoney(item.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                    <p className="text-sm text-white/55">Nothing to show yet</p>
                    <p className="mt-1 text-xs text-white/30">
                      Your transactions will appear here once added.
                    </p>
                  </div>
                )}
              </article>
            </section>
          </>
        )
      )}
    </Layout>
  );
}
