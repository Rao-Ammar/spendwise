import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const pages = [
  { to: '/dashboard', label: 'Overview', short: 'Home', icon: '◫' },
  { to: '/transactions', label: 'Transactions', short: 'Activity', icon: '↕' },
  { to: '/reports', label: 'Reports', short: 'Reports', icon: '▤' },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: '⚙' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const storedUser = localStorage.getItem('spendwise_user')
  let user = null
  try { user = storedUser ? JSON.parse(storedUser) : null } catch { user = null }

  function signOut() {
    localStorage.removeItem('spendwise_token')
    localStorage.removeItem('spendwise_user')
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }) => `flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${isActive ? 'border-emerald-300/15 bg-emerald-300/[0.09] text-emerald-200 shadow-[inset_2px_0_0_#6ee7a8]' : 'border-transparent text-white/50 hover:bg-white/[0.035] hover:text-white/80'}`

  return (
    <div className="min-h-screen bg-[#070b09] text-white lg:flex">
      <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0a100d] px-5 py-7 lg:flex">
        <img src={logo} alt="SpendWise" className="mb-12 w-[190px] object-contain object-left" />
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">
          {pages.map((page) => <NavLink key={page.to} to={page.to} className={navClass}><span aria-hidden="true" className="text-base">{page.icon}</span>{page.label}</NavLink>)}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-emerald-200/20 bg-emerald-300/10 text-sm font-semibold text-emerald-200">{user?.name?.[0]?.toUpperCase() || 'S'}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-white/85">{user?.name || 'SpendWise user'}</p><p className="truncate text-xs text-white/35">Personal account</p></div>
          </div>
          <button onClick={signOut} className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-white/55 transition hover:border-rose-300/20 hover:text-rose-200">Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8 lg:px-10">
          <img src={logo} alt="SpendWise" className="w-40 object-contain object-left lg:hidden" />
          <div className="hidden lg:block"><p className="text-xs text-white/35">Personal finance</p><p className="mt-1 text-sm font-medium text-white/80">Your workspace</p></div>
          <button onClick={signOut} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-rose-300/20 hover:text-rose-200 lg:hidden">Sign out</button>
          <div className="hidden items-center gap-3 lg:flex"><div className="text-right"><p className="text-sm font-medium text-white/80">{user?.name || 'Welcome'}</p><p className="text-xs text-white/35">Good to see you</p></div><div className="grid h-9 w-9 place-items-center rounded-full border border-emerald-200/20 bg-emerald-300/10 text-sm font-semibold text-emerald-200">{user?.name?.[0]?.toUpperCase() || 'S'}</div></div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 pb-24 sm:px-8 sm:py-9 sm:pb-24 lg:px-10 lg:pb-9">{children}</main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/[0.08] bg-[#0a100d]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden">
        {pages.map((page) => <NavLink key={page.to} to={page.to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${isActive ? 'text-emerald-200' : 'text-white/40 hover:text-white/70'}`}><span aria-hidden="true" className="text-base leading-5">{page.icon}</span><span>{page.short}</span></NavLink>)}
      </nav>
    </div>
  )
}
