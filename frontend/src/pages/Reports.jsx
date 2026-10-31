import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const ranges = [
  ["daily", "Today"],
  ["weekly", "This week"],
  ["monthly", "This month"],
  ["yearly", "This year"],
];
const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";

export default function Reports() {
  const navigate = useNavigate();
  const [range, setRange] = useState("monthly");
  const [income, setIncome] = useState(null);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
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
        fetch(`${API_BASE}/api/income/overview?range=${range}`, { headers }),
        fetch(`${API_BASE}/api/expense/overview?range=${range}`, { headers }),
      ]);
      if (incomeResponse.status === 401 || expenseResponse.status === 401) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login", { replace: true });
        return;
      }
      const [incomeResult, expenseResult] = await Promise.all([
        incomeResponse.json(),
        expenseResponse.json(),
      ]);
      if (
        !incomeResponse.ok ||
        !incomeResult.success ||
        !expenseResponse.ok ||
        !expenseResult.success
      )
        throw new Error(
          incomeResult.message ||
            expenseResult.message ||
            "Could not load this report.",
        );
      setIncome(incomeResult.data);
      setExpense(expenseResult.data);
    } catch (loadError) {
      setError(loadError.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, [navigate, range]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function download(kind) {
    setDownloading(kind);
    setError("");
    try {
      const token = localStorage.getItem("spendwise_token");
      const response = await fetch(`${API_BASE}/api/${kind}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let message = `Could not download ${kind}.`;
        try {
          message = (await response.json()).message || message;
        } catch {
          /* response was not JSON */
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}_data.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Could not download the file.");
    } finally {
      setDownloading("");
    }
  }

  const totalIncome = Number(income?.totalIncome) || 0;
  const totalExpense = Number(expense?.totalExpense) || 0;
  const net = totalIncome - totalExpense;
  const transactionCount =
    (Number(income?.numberoftransactions) || 0) +
    (Number(expense?.numberoftransactions) || 0);
  const incomeRows = income?.recenttransactions || [];
  const expenseRows = expense?.recenttransactions || [];

  return (
    <Layout>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
            Your numbers
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reports
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Explore your income and spending over time.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c1410] px-3.5 py-2.5 text-xs text-white/45">
          <span>Period</span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="bg-transparent text-sm font-medium text-white/80 outline-none"
          >
            {ranges.map(([value, label]) => (
              <option key={value} value={value} className="bg-[#0c1410]">
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100"
        >
          <span>{error}</span>
          <button
            onClick={loadReport}
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
              className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
            />
          ))}
        </div>
      ) : (
        <>
          <section
            aria-label="Report summary"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5">
              <p className="text-sm text-white/45">Total income</p>
              <p className="mt-4 text-2xl font-semibold text-emerald-200">
                {currency.format(totalIncome)}
              </p>
              <p className="mt-3 text-xs text-white/35">
                {income?.numberoftransactions || 0} income records
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5">
              <p className="text-sm text-white/45">Total expenses</p>
              <p className="mt-4 text-2xl font-semibold text-rose-200">
                {currency.format(totalExpense)}
              </p>
              <p className="mt-3 text-xs text-white/35">
                {expense?.numberoftransactions || 0} expense records
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5">
              <p className="text-sm text-white/45">Net savings</p>
              <p
                className={`mt-4 text-2xl font-semibold ${net >= 0 ? "text-emerald-200" : "text-rose-200"}`}
              >
                {currency.format(net)}
              </p>
              <p className="mt-3 text-xs text-white/35">
                Income after expenses
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5">
              <p className="text-sm text-white/45">Transactions</p>
              <p className="mt-4 text-2xl font-semibold text-white/85">
                {transactionCount}
              </p>
              <p className="mt-3 text-xs text-white/35">
                {ranges.find(([value]) => value === range)?.[1]} activity
              </p>
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            {[
              {
                kind: "income",
                title: "Income details",
                color: "text-emerald-200",
                amount: income?.totalIncome,
                average: income?.averageIncome,
                count: income?.numberoftransactions,
                rows: incomeRows,
              },
              {
                kind: "expense",
                title: "Expense details",
                color: "text-rose-200",
                amount: expense?.totalExpense,
                average: expense?.averageExpense,
                count: expense?.numberoftransactions,
                rows: expenseRows,
              },
            ].map((report) => (
              <article
                key={report.kind}
                className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{report.title}</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Average per record:{" "}
                      {currency.format(Number(report.average) || 0)}
                    </p>
                  </div>
                  <button
                    onClick={() => download(report.kind)}
                    disabled={downloading === report.kind}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-emerald-200/20 hover:text-emerald-200 disabled:opacity-50"
                  >
                    {downloading === report.kind
                      ? "Preparing…"
                      : "Download Excel"}
                  </button>
                </div>
                <p className={`mt-5 text-2xl font-semibold ${report.color}`}>
                  {currency.format(Number(report.amount) || 0)}{" "}
                  <span className="text-xs font-normal text-white/35">
                    · {report.count || 0} records
                  </span>
                </p>
                {report.rows.length ? (
                  <div className="mt-4 divide-y divide-white/[0.06]">
                    {report.rows.map((item, index) => (
                      <div
                        key={`${item.description}-${item.date}-${index}`}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/75">
                            {item.description || item.category || "Transaction"}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {item.category ||
                              (report.kind === "income"
                                ? "Income"
                                : "Expense")}{" "}
                            · {dateLabel(item.date)}
                          </p>
                        </div>
                        <p
                          className={`shrink-0 text-sm font-medium ${report.color}`}
                        >
                          {currency.format(Number(item.amount) || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">
                    No {report.kind} records in this period.
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </Layout>
  );
}
