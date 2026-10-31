import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/user/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? form : { email: form.email, password: form.password },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          result.message || "Unable to continue. Please try again.",
        );
      localStorage.setItem("spendwise_token", result.token);
      if (result.user)
        localStorage.setItem("spendwise_user", JSON.stringify(result.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not reach the server. Check that the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b09] px-5 py-12 text-white selection:bg-emerald-300/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,91,57,0.24),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-[-10rem] h-96 w-96 rounded-full bg-emerald-500/10 blur-[110px]"
      />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100/10 bg-[#0c1410]/90 shadow-[0_30px_100px_rgba(0,0,0,0.55)] md:min-h-[610px] md:grid-cols-[1fr_0.92fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-emerald-100/10 bg-gradient-to-br from-[#10251b] via-[#0b1711] to-[#09100d] p-10 md:flex lg:p-14">
          <div
            aria-hidden="true"
            className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-emerald-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-8 top-36 h-40 w-40 rounded-full border border-emerald-300/10"
          />
          <img
            src={logo}
            alt="SpendWise"
            className="relative z-10 h-auto w-64 object-contain object-left"
          />
          <div className="relative z-10 max-w-sm pb-6">
            <div className="mb-5 h-px w-12 bg-emerald-300 shadow-[0_0_14px_rgba(110,255,184,0.7)]" />
            <h1 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
              Make every dollar
              <br />
              feel intentional.
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-emerald-50/55">
              A clearer view of your money starts with one simple step.
            </p>
          </div>
          <p className="relative z-10 text-xs tracking-wide text-emerald-50/35">
            YOUR MONEY, IN GOOD HANDS
          </p>
        </div>

        <div className="flex items-center justify-center p-7 sm:p-10 lg:p-14">
          <div className="w-full max-w-sm">
            <img
              src={logo}
              alt="SpendWise"
              className="mx-auto mb-8 h-auto w-48 object-contain md:hidden"
            />
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300/80">
              SpendWise account
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {isRegister
                ? "Start building a clearer picture of your finances."
                : "Sign in to pick up where you left off."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-white/75"
                  >
                    Your name
                  </label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={updateField}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-white/75"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm text-white/75"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  minLength={isRegister ? 6 : undefined}
                  required
                  value={form.password}
                  onChange={updateField}
                  placeholder={
                    isRegister ? "At least 6 characters" : "Enter your password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-[#07110b] shadow-[0_0_24px_rgba(76,255,165,0.12)] transition hover:bg-emerald-200 hover:shadow-[0_0_30px_rgba(76,255,165,0.24)] disabled:cursor-wait disabled:opacity-60"
              >
                {loading
                  ? "Please wait…"
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
                {!loading && (
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-white/50">
              {isRegister ? "Already have an account?" : "New to SpendWise?"}{" "}
              <Link
                to={isRegister ? "/login" : "/register"}
                className="font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                {isRegister ? "Sign in" : "Create an account"}
              </Link>
            </p>
            <p className="mt-10 text-center text-xs leading-5 text-white/30">
              Your financial data belongs to you. We keep your account
              protected.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
