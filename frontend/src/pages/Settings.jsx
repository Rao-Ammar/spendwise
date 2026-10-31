import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function sendJson(path, token, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: body ? "PUT" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (response.status === 401)
    throw Object.assign(
      new Error("Your session has expired. Please sign in again."),
      { status: 401 },
    );
  if (!response.ok || result.success === false)
    throw new Error(
      result.message || "Something went wrong. Please try again.",
    );
  return result;
}

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pageError, setPageError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("spendwise_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    sendJson("/api/user/me", token)
      .then((result) => {
        const user = result.user || {};
        setProfile({ name: user.name || "", email: user.email || "" });
        localStorage.setItem(
          "spendwise_user",
          JSON.stringify({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
          }),
        );
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem("spendwise_token");
          localStorage.removeItem("spendwise_user");
          navigate("/login", { replace: true });
        } else
          setPageError(error.message || "Could not load your account details.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const result = await sendJson(
        "/api/user/profile",
        localStorage.getItem("spendwise_token"),
        profile,
      );
      const user = result.user || profile;
      setProfile({
        name: user.name || profile.name,
        email: user.email || profile.email,
      });
      localStorage.setItem(
        "spendwise_user",
        JSON.stringify({
          id: user._id || user.id,
          name: user.name || profile.name,
          email: user.email || profile.email,
        }),
      );
      setProfileMessage(result.message || "Profile updated successfully.");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("spendwise_token");
        navigate("/login", { replace: true });
      } else setProfileError(error.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");
    try {
      const result = await sendJson(
        "/api/user/password",
        localStorage.getItem("spendwise_token"),
        password,
      );
      setPassword({ currentPassword: "", newPassword: "" });
      setPasswordMessage(result.message || "Password updated successfully.");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("spendwise_token");
        navigate("/login", { replace: true });
      } else
        setPasswordError(error.message || "Could not update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Layout>
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Profile & settings
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Manage your personal details and account security.
        </p>
      </div>
      {pageError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100"
        >
          {pageError}
        </div>
      )}
      {loading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" />
          <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6">
            <div className="mb-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-200/10 bg-emerald-300/[0.07] text-lg text-emerald-200">
                ◉
              </div>
              <h2 className="mt-4 font-semibold">Personal information</h2>
              <p className="mt-1 text-xs text-white/40">
                Update the name and email linked to your account.
              </p>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  Name
                </label>
                <input
                  id="profile-name"
                  autoComplete="name"
                  required
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  Email address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                />
              </div>
              {profileError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-3 py-2 text-xs text-rose-100"
                >
                  {profileError}
                </p>
              )}
              {profileMessage && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs text-emerald-200"
                >
                  {profileMessage}
                </p>
              )}
              <button
                disabled={savingProfile}
                className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07110b] transition hover:bg-emerald-200 disabled:opacity-60"
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0c1410] p-5 sm:p-6">
            <div className="mb-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-200/10 bg-cyan-300/[0.07] text-lg text-cyan-200">
                ⌑
              </div>
              <h2 className="mt-4 font-semibold">Change password</h2>
              <p className="mt-1 text-xs text-white/40">
                Confirm your current password before choosing a new one.
              </p>
            </div>
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password.currentPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs text-white/65"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password.newPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080e0b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                />
                <p className="mt-1.5 text-[11px] text-white/35">
                  Use at least 6 characters.
                </p>
              </div>
              {passwordError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-3 py-2 text-xs text-rose-100"
                >
                  {passwordError}
                </p>
              )}
              {passwordMessage && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs text-emerald-200"
                >
                  {passwordMessage}
                </p>
              )}
              <button
                disabled={savingPassword}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/75 transition hover:border-cyan-200/20 hover:text-cyan-100 disabled:opacity-60"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
        </div>
      )}
    </Layout>
  );
}
