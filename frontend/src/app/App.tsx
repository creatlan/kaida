import { useState, useEffect, useRef } from "react";
import {
  Home, BookOpen, Clock, User, Plus, Search, LogOut,
  Edit3, Trash2, Copy, Play, BarChart2, ChevronRight,
  ChevronLeft, Check, X, AlertCircle, Trophy, Star,
  Link, Users, ArrowUp, ArrowDown, Minus, Settings,
  Upload, Eye, Lock, Globe, Shuffle, Timer, Zap,
  TrendingUp, Download, QrCode, Bell, Menu
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

type Screen =
  | "login" | "register" | "dashboard" | "profile"
  | "my-quizzes" | "quiz-create" | "quiz-saved"
  | "quiz-launch" | "waiting-room" | "question"
  | "answer-result" | "organizer-control" | "leaderboard-mid"
  | "leaderboard-final" | "result-details" | "analytics";

const VK_BLUE = "#2787f5";
const GREEN = "#4bb34b";
const RED = "#e64646";
const ORANGE = "#ff9e00";

// ─── Shared primitives ───────────────────────────────────────────────────────

function Avatar({ name, size = 40, color = VK_BLUE }: { name: string; size?: number; color?: string }) {
  const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center text-white font-semibold select-none"
    >
      {initials}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    draft: "#818c99",
    published: GREEN,
    active: VK_BLUE,
  };
  const bg = map[color] || color;
  return (
    <span style={{ backgroundColor: bg + "1a", color: bg }} className="text-xs font-semibold px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

function Btn({
  children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button"
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg"; onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-[#2787f5] text-white hover:bg-[#1c6fd4] active:scale-[0.98]",
    secondary: "bg-[#e8edf3] text-[#19191a] hover:bg-[#dce4ef] active:scale-[0.98]",
    ghost: "bg-transparent text-[#2787f5] hover:bg-[#d6e8ff] active:scale-[0.98]",
    danger: "bg-[#e64646] text-white hover:bg-[#c93a3a] active:scale-[0.98]",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({
  label, type = "text", placeholder, value, onChange, hint, error
}: {
  label?: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hint?: string; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-[#19191a]">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all
          focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5]
          ${error ? "border-[#e64646]" : "border-[rgba(0,0,0,0.12)]"}`}
      />
      {error && <span className="text-xs text-[#e64646]">{error}</span>}
      {hint && !error && <span className="text-xs text-[#818c99]">{hint}</span>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] ${className}`}>
      {children}
    </div>
  );
}


// ─── Navigation ──────────────────────────────────────────────────────────────

function Nav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const items = [
    { id: "dashboard", label: "Главная", icon: Home },
    { id: "my-quizzes", label: "Мои квизы", icon: BookOpen },
    { id: "analytics", label: "Аналитика", icon: BarChart2 },
  ] as const;

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  return (
    <header ref={headerRef} className="bg-white border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 font-bold text-[#2787f5] text-lg tracking-tight outline-none">
          <div className="w-8 h-8 bg-[#2787f5] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          Kaida
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); setScreen(item.id as Screen); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors outline-none
                ${screen === item.id ? "bg-[#d6e8ff] text-[#2787f5]" : "text-[#818c99] hover:text-[#19191a] hover:bg-[#f2f3f5]"}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen("profile")}
            className="outline-none rounded-full hover:opacity-80 transition-opacity"
          >
            <Avatar name="Алексей М" size={32} />
          </button>
          <button
            className="md:hidden w-8 h-8 rounded-full hover:bg-[#f2f3f5] flex items-center justify-center text-[#818c99] outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(0,0,0,0.06)] px-4 py-3 flex flex-col gap-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); setScreen(item.id as Screen); setMobileOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors outline-none
                ${screen === item.id ? "bg-[#d6e8ff] text-[#2787f5]" : "text-[#818c99] hover:text-[#19191a] hover:bg-[#f2f3f5]"}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

// ─── 1. Login ─────────────────────────────────────────────────────────────────

function LoginScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#2787f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#19191a]">Kaida</h1>
          <p className="text-[#818c99] text-sm mt-1">Создавайте и проходите квизы</p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-5">Войти</h2>
          <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); setScreen("dashboard"); }}>
            <Input label="Email" type="email" placeholder="ivan@example.com" value={email} onChange={setEmail} />
            <Input label="Пароль" type="password" placeholder="••••••••" value={password} onChange={setPassword} error={err} />
            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#2787f5] hover:underline">Забыли пароль?</button>
            </div>
            <Btn size="lg" type="submit" className="w-full">Войти</Btn>
          </form>

          <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)] text-center text-sm text-[#818c99]">
            Нет аккаунта?{" "}
            <button onClick={() => setScreen("register")} className="text-[#2787f5] font-semibold hover:underline">
              Зарегистрироваться
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 2. Register ──────────────────────────────────────────────────────────────

function RegisterScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#2787f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#19191a]">Kaida</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-5">Регистрация</h2>
          <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); setScreen("dashboard"); }}>
            <Input label="Имя пользователя" placeholder="ivan_petrov" value={form.name} onChange={f("name")} />
            <Input label="Email" type="email" placeholder="ivan@example.com" value={form.email} onChange={f("email")} />
            <Input label="Пароль" type="password" placeholder="Минимум 8 символов" value={form.password} onChange={f("password")} />
            <Input label="Подтверждение пароля" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={f("confirm")} error={form.confirm && form.confirm !== form.password ? "Пароли не совпадают" : ""} />
            <Btn size="lg" type="submit" className="w-full mt-1">Создать аккаунт</Btn>
          </form>
          <p className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)] text-center text-sm text-[#818c99]">
            Уже есть аккаунт?{" "}
            <button onClick={() => setScreen("login")} className="text-[#2787f5] font-semibold hover:underline">Войти</button>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── 3. Dashboard ─────────────────────────────────────────────────────────────

function DashboardScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [code, setCode] = useState("");
  const recent = [
    { title: "История России XIX–XX вв.", questions: 20, attempts: 142, status: "published" },
    { title: "Математика: базовый уровень", questions: 15, attempts: 89, status: "published" },
    { title: "Черновик: Физика", questions: 8, attempts: 0, status: "draft" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="dashboard" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">

        <Card className="p-5">
          <Tabs defaultValue="frontend" className="gap-4">
            <TabsList className="w-full h-auto p-1.5 bg-[#f2f3f5] rounded-2xl flex flex-wrap gap-1">
              <TabsTrigger value="frontend" className="rounded-xl px-4 py-2 flex-1 min-w-[140px]">Фронтенд</TabsTrigger>
              <TabsTrigger value="design" className="rounded-xl px-4 py-2 flex-1 min-w-[140px]">Дизайн</TabsTrigger>
              <TabsTrigger value="structure" className="rounded-xl px-4 py-2 flex-1 min-w-[140px]">Структура</TabsTrigger>
            </TabsList>

            <TabsContent value="frontend" className="pt-2">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Установка</p>
                  <p className="mt-2 text-sm text-[#19191a]">npm i</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Запуск</p>
                  <p className="mt-2 text-sm text-[#19191a]">npm run dev</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Адрес</p>
                  <p className="mt-2 text-sm text-[#19191a]">http://localhost:5173/</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="design" className="pt-2">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Визуальный стиль</p>
                  <p className="mt-2 text-sm text-[#19191a]">VK-ориентированные светлые карточки, синий акцент и мягкие статусы.</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Интерфейс</p>
                  <p className="mt-2 text-sm text-[#19191a]">Минимальный dashboard, быстрые действия и отдельные экраны для каждого сценария.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="pt-2">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">Основной экран</p>
                  <p className="mt-2 text-sm text-[#19191a]">src/app/App.tsx</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                  <p className="text-xs font-semibold text-[#818c99] uppercase tracking-wide">UI-компоненты</p>
                  <p className="mt-2 text-sm text-[#19191a]">src/app/components/ui</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Join quiz */}
        <Card className="p-8">
          <h2 className="text-xl font-bold text-[#19191a] mb-2">Присоединиться к квизу</h2>
          <p className="text-[#818c99] text-sm mb-5">Введите шестизначный код комнаты</p>
          <div className="flex gap-3 max-w-md">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 px-5 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] text-2xl font-bold tracking-[0.3em] text-center bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] transition-all"
            />
            <Btn size="lg" onClick={() => setScreen("waiting-room")} disabled={code.length !== 6} className="px-8">
              Войти
            </Btn>
          </div>
        </Card>

        {/* Create + Recent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setScreen("quiz-create")}
            className="group bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-8 flex flex-col items-center justify-center gap-3 hover:shadow-[0_4px_20px_rgba(39,135,245,0.15)] hover:border-[#2787f5] border border-transparent transition-all duration-200 text-center"
          >
            <div className="w-14 h-14 bg-[#d6e8ff] rounded-2xl flex items-center justify-center group-hover:bg-[#2787f5] transition-colors">
              <Plus size={24} className="text-[#2787f5] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-[#19191a]">Создать квиз</p>
              <p className="text-xs text-[#818c99] mt-0.5">Новый тест с нуля</p>
            </div>
          </button>

          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#19191a]">Недавние квизы</h3>
              <button onClick={() => setScreen("my-quizzes")} className="text-xs text-[#2787f5] hover:underline flex items-center gap-1">
                Все квизы <ChevronRight size={14} />
              </button>
            </div>
            {recent.map((q, i) => (
              <Card key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ["#d6e8ff", "#d6f5d6", "#fff3d6"][i % 3] }}>
                    <BookOpen size={16} style={{ color: [VK_BLUE, GREEN, ORANGE][i % 3] }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#19191a] truncate">{q.title}</p>
                    <p className="text-xs text-[#818c99]">{q.questions} вопр. · {q.attempts} попыток</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Btn size="sm" variant="ghost" onClick={() => setScreen("quiz-launch")}>
                    <Play size={14} />
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

// ─── 4. Profile ───────────────────────────────────────────────────────────────

function ProfileScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const history = [
    { title: "Всемирная история", date: "22 июля 2026", score: 1840, max: 2000, pos: 3, pct: 91 },
    { title: "Химия ЕГЭ", date: "20 июля 2026", score: 1230, max: 1500, pos: 7, pct: 78 },
    { title: "Английский B2", date: "18 июля 2026", score: 1400, max: 2000, pos: 12, pct: 70 },
    { title: "Физика базовый", date: "15 июля 2026", score: 900, max: 1000, pos: 1, pct: 96 },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="profile" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <Avatar name="Алексей Михайлов" size={72} />
            <div>
              <h2 className="text-xl font-bold">Алексей Михайлов</h2>
              <p className="text-[#818c99] text-sm">alexei@example.com</p>
              <p className="text-[#818c99] text-xs mt-1">На платформе с 14 января 2025</p>
            </div>
            <div className="ml-auto hidden md:flex gap-6">
              {[["47", "Квизов пройдено"], ["12", "Квизов создано"]].map(([v, l], i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-[#2787f5]">{v}</p>
                  <p className="text-xs text-[#818c99]">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <h3 className="font-semibold text-[#19191a]">История участия</h3>
        {history.map((h, i) => (
          <Card key={i} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-[#19191a]">{h.title}</p>
                <p className="text-xs text-[#818c99] mt-0.5">{h.date}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-[#19191a]">{h.score}<span className="text-[#818c99] font-normal">/{h.max}</span></p>
                  <p className="text-xs text-[#818c99]">Баллы</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: h.pos <= 3 ? ORANGE : "#19191a" }}>#{h.pos}</p>
                  <p className="text-xs text-[#818c99]">Позиция</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: h.pct >= 80 ? GREEN : h.pct >= 60 ? ORANGE : RED }}>{h.pct}%</p>
                  <p className="text-xs text-[#818c99]">Верных</p>
                </div>
                <button onClick={() => setScreen("result-details")} className="text-xs text-[#2787f5] hover:underline flex items-center gap-1">
                  Детали <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-[#f2f3f5] rounded-full overflow-hidden">
              <div style={{ width: `${h.pct}%`, backgroundColor: h.pct >= 80 ? GREEN : h.pct >= 60 ? ORANGE : RED }} className="h-full rounded-full transition-all" />
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}

// ─── 5. My Quizzes ────────────────────────────────────────────────────────────

function MyQuizzesScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const quizzes = [
    { title: "История России XIX–XX вв.", questions: 20, status: "published", created: "10 июл 2026", updated: "20 июл 2026", attempts: 142 },
    { title: "Математика: базовый уровень", questions: 15, status: "published", created: "5 июн 2026", updated: "18 июл 2026", attempts: 89 },
    { title: "Черновик: Физика", questions: 8, status: "draft", created: "22 июл 2026", updated: "22 июл 2026", attempts: 0 },
    { title: "Химия ЕГЭ 2026", questions: 30, status: "published", created: "1 мар 2026", updated: "15 июл 2026", attempts: 317 },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Мои квизы</h2>
          <Btn onClick={() => setScreen("quiz-create")}><Plus size={16} /> Создать</Btn>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((q, i) => (
            <Card key={i} className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#f2f3f5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${["1456513080510-7bf3a84b82f8", "1635070041078-e363dbe005cb", "1509228627152-72ae9ae6848d", "1532094349884-543bc11b234d"][i]}?w=96&h=96&fit=crop&auto=format`}
                    alt={q.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#19191a] truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#818c99]">{q.questions} вопр.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs bg-[#f8f9fb] rounded-xl px-3 py-2.5">
                <div><p className="font-semibold text-[#19191a]">{q.attempts}</p><p className="text-[#818c99]">Попыток</p></div>
                <div><p className="font-semibold text-[#19191a]">{q.created}</p><p className="text-[#818c99]">Создан</p></div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Btn size="sm" variant="secondary" onClick={() => setScreen("quiz-create")}><Edit3 size={13} />Ред.</Btn>
                <Btn size="sm" onClick={() => setScreen("quiz-launch")}><Play size={13} />Запуск</Btn>
                <Btn size="sm" variant="secondary"><Copy size={13} />Копировать</Btn>
                <Btn size="sm" variant="secondary" className="ml-auto !text-[#e64646] hover:bg-red-50"><Trash2 size={13} />Удалить</Btn>
              </div>
            </Card>
          ))}

          <button
            onClick={() => setScreen("quiz-create")}
            className="border-2 border-dashed border-[rgba(39,135,245,0.3)] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-[#818c99] hover:border-[#2787f5] hover:text-[#2787f5] hover:bg-[#f0f6ff] transition-all"
          >
            <Plus size={28} />
            <span className="text-sm font-medium">Новый квиз</span>
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── 6. Quiz Create ───────────────────────────────────────────────────────────

type QuestionType = "single" | "multiple" | "truefalse" | "text" | "image";
interface Question {
  id: number; type: QuestionType; text: string;
  options: string[]; correct: number[]; points: number; time: number;
  imageUrl?: string;
}

function QuizCreateScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [title, setTitle] = useState("Новый квиз");
  const [desc, setDesc] = useState("");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: "single", text: "Кто написал «Войну и мир»?", options: ["Достоевский", "Толстой", "Тургенев", "Чехов"], correct: [1], points: 100, time: 30 },
    { id: 2, type: "truefalse", text: "Вода кипит при 100°C на уровне моря", options: ["Верно", "Неверно"], correct: [0], points: 50, time: 15 },
  ]);
  const [settings, setSettings] = useState({ shuffle: false, defaultTime: 30 });
  const [showSettings, setShowSettings] = useState(false);

  const addQuestion = () => {
    setQuestions(q => [...q, { id: Date.now(), type: "single", text: "", options: ["", "", "", ""], correct: [], points: 100, time: 30 }]);
  };

  const save = () => {
    setSaved("saving");
    setTimeout(() => { setSaved("saved"); setTimeout(() => setScreen("quiz-saved"), 800); }, 900);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-6">

        {/* Header card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Редактор квиза</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#818c99]">
                {saved === "saving" ? "Сохранение…" : saved === "saved" ? "✓ Сохранено" : ""}
              </span>
              <Btn size="sm" variant="secondary" onClick={() => setShowSettings(!showSettings)}>
                <Settings size={14} /> Настройки
              </Btn>
              <Btn size="sm" onClick={save}>
                {saved === "saving" ? "…" : "Сохранить"}
              </Btn>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Название квиза</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] text-base font-semibold bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5]"
              />
            </div>
            <Input label="Описание (необязательно)" placeholder="О чём этот квиз?" value={desc} onChange={setDesc} />
          </div>

          {showSettings && (
            <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
              <p className="text-sm font-semibold mb-4">Настройки квиза</p>
              <div className="flex flex-col gap-3">
                {/* Shuffle toggle */}
                <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8f9fb] border border-[rgba(0,0,0,0.08)] cursor-pointer hover:border-[rgba(0,0,0,0.16)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
                      <Shuffle size={15} className="text-[#818c99]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#19191a]">Перемешать вопросы</p>
                      <p className="text-xs text-[#818c99]">Случайный порядок при каждом запуске</p>
                    </div>
                  </div>
                  <span
                    onClick={() => setSettings(p => ({ ...p, shuffle: !p.shuffle }))}
                    style={{
                      backgroundColor: settings.shuffle ? VK_BLUE : "transparent",
                      borderColor: settings.shuffle ? VK_BLUE : "rgba(0,0,0,0.2)",
                    }}
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    {settings.shuffle && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </label>

                {/* Default time */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8f9fb] border border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
                      <Timer size={15} className="text-[#818c99]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#19191a]">Время по умолчанию</p>
                      <p className="text-xs text-[#818c99]">Секунд на каждый вопрос</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={settings.defaultTime === 0 ? "" : settings.defaultTime}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setSettings(p => ({ ...p, defaultTime: raw === "" ? 0 : Math.min(300, parseInt(raw, 10)) }));
                    }}
                    placeholder="30"
                    className="w-16 px-2 py-1.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] text-center transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Questions */}
        {questions.map((q, qi) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={qi}
            onChange={updated => setQuestions(list => list.map((x, i) => i === qi ? updated : x))}
            onDelete={() => setQuestions(list => list.filter((_, i) => i !== qi))}
            onDuplicate={() => setQuestions(list => { const n = [...list]; n.splice(qi + 1, 0, { ...q, id: Date.now() }); return n; })}
          />
        ))}

        <button
          onClick={addQuestion}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-[rgba(39,135,245,0.3)] text-[#2787f5] font-semibold hover:bg-[#f0f6ff] hover:border-[#2787f5] transition-all text-sm"
        >
          <Plus size={18} /> Добавить вопрос
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ question, index, onChange, onDelete, onDuplicate }: {
  question: Question; index: number;
  onChange: (q: Question) => void; onDelete: () => void; onDuplicate: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typeOpen) return;
    const handler = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [typeOpen]);

  const typeOptions: { value: QuestionType; label: string; sub: string; icon: React.ReactNode }[] = [
    { value: "single",    label: "Один верный",       sub: "Один правильный вариант",    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current opacity-0 group-data-[sel]:opacity-100" /></div> },
    { value: "multiple",  label: "Несколько верных",  sub: "Можно выбрать несколько",    icon: <div className="w-4 h-4 rounded border-2 border-current flex items-center justify-center"><Check size={10} /></div> },
    { value: "truefalse", label: "Верно / Неверно",   sub: "Два варианта",               icon: <span className="text-xs font-bold leading-none">T/F</span> },
    { value: "text",      label: "Текстовый ответ",   sub: "Свободный ввод",             icon: <span className="text-xs font-bold leading-none">Аа</span> },
    { value: "image",     label: "С изображением",    sub: "Картинка + варианты",        icon: <Upload size={13} /> },
  ];

  const currentType = typeOptions.find(t => t.value === question.type)!;

  const handleTypeChange = (newType: QuestionType) => {
    const defaults: Record<QuestionType, Partial<Question>> = {
      single:    { options: ["", "", "", ""], correct: [] },
      multiple:  { options: ["", "", "", ""], correct: [] },
      truefalse: { options: ["Верно", "Неверно"], correct: [] },
      text:      { options: [], correct: [] },
      image:     { options: ["", "", "", ""], correct: [], imageUrl: undefined },
    };
    onChange({ ...question, type: newType, ...defaults[newType] });
  };

  const toggleCorrect = (i: number) => {
    if (question.type === "single" || question.type === "truefalse" || question.type === "image") {
      onChange({ ...question, correct: [i] });
    } else {
      const c = question.correct.includes(i)
        ? question.correct.filter(x => x !== i)
        : [...question.correct, i];
      onChange({ ...question, correct: c });
    }
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ""] });
  const removeOption = (i: number) => onChange({
    ...question,
    options: question.options.filter((_, idx) => idx !== i),
    correct: question.correct.filter(c => c !== i).map(c => c > i ? c - 1 : c),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...question, imageUrl: url });
  };

  const isMulti = question.type === "multiple";

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-[#818c99] bg-[#f2f3f5] px-2.5 py-1 rounded-lg flex-shrink-0">#{index + 1}</span>

        {/* Custom type picker */}
        <div ref={typeRef} className="relative">
          <button
            type="button"
            onClick={() => setTypeOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef5ff] text-[#2787f5] text-xs font-semibold hover:bg-[#ddeeff] transition-colors outline-none"
          >
            <span className="flex items-center justify-center w-4 h-4">{currentType.icon}</span>
            {currentType.label}
            <ChevronRight size={12} className={`transition-transform duration-150 ${typeOpen ? "rotate-90" : ""}`} />
          </button>

          {typeOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[rgba(0,0,0,0.07)] p-1.5 min-w-[220px]">
              {typeOptions.map(opt => {
                const active = question.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { handleTypeChange(opt.value); setTypeOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                      ${active ? "bg-[#eef5ff]" : "hover:bg-[#f8f9fb]"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                      ${active ? "bg-[#2787f5] text-white" : "bg-[#f2f3f5] text-[#818c99]"}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${active ? "text-[#2787f5]" : "text-[#19191a]"}`}>{opt.label}</p>
                      <p className="text-xs text-[#818c99]">{opt.sub}</p>
                    </div>
                    {active && <Check size={14} className="ml-auto text-[#2787f5] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={onDuplicate} className="w-8 h-8 rounded-lg hover:bg-[#f2f3f5] flex items-center justify-center text-[#818c99] transition-colors outline-none"><Copy size={15} /></button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-[#ffeaea] flex items-center justify-center text-[#818c99] hover:text-[#e64646] transition-colors outline-none"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Question text */}
      <input
        value={question.text}
        onChange={e => onChange({ ...question, text: e.target.value })}
        placeholder="Текст вопроса…"
        className="w-full px-4 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] mb-3"
      />

      {/* Image upload (for "image" type) */}
      {question.type === "image" && (
        <div className="mb-4">
          {question.imageUrl ? (
            <div className="relative inline-block">
              <img src={question.imageUrl} alt="Question" className="h-40 rounded-xl object-cover border border-[rgba(0,0,0,0.1)]" />
              <button
                onClick={() => onChange({ ...question, imageUrl: undefined })}
                className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-[#818c99] hover:text-[#e64646] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[rgba(39,135,245,0.3)] text-[#2787f5] text-sm hover:bg-[#f0f6ff] hover:border-[#2787f5] transition-all"
            >
              <Upload size={15} /> Загрузить изображение
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      )}

      {/* Answer options: single / multiple / image */}
      {(question.type === "single" || question.type === "multiple" || question.type === "image") && (
        <div className="grid gap-2 mb-4">
          {question.options.map((opt, i) => {
            const isCorrect = question.correct.includes(i);
            return (
              <div key={i} className="flex items-center gap-2">
                {/* Correct toggle: round for single/image, square for multiple */}
                <button
                  onClick={() => toggleCorrect(i)}
                  style={{
                    borderColor: isCorrect ? GREEN : "rgba(0,0,0,0.15)",
                    backgroundColor: isCorrect ? GREEN : "white",
                  }}
                  className={`w-5 h-5 flex items-center justify-center flex-shrink-0 border-2 transition-all ${isMulti ? "rounded" : "rounded-full"}`}
                  title={isMulti ? "Отметить как верный" : "Сделать единственно верным"}
                >
                  {isCorrect && <Check size={11} className="text-white" />}
                </button>
                <input
                  value={opt}
                  onChange={e => {
                    const o = [...question.options];
                    o[i] = e.target.value;
                    onChange({ ...question, options: o });
                  }}
                  placeholder={`Вариант ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-[rgba(0,0,0,0.10)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5]"
                />
                {question.options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#818c99] hover:text-[#e64646] hover:bg-[#ffeaea] transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
          {question.options.length < 6 && (
            <button
              onClick={addOption}
              className="btn-link mt-1"
            >
              <Plus size={13} /> Добавить вариант
            </button>
          )}
        </div>
      )}

      {/* True / False */}
      {question.type === "truefalse" && (
        <div className="flex gap-3 mb-4">
          {["Верно", "Неверно"].map((label, i) => {
            const isCorrect = question.correct.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleCorrect(i)}
                style={{
                  borderColor: isCorrect ? GREEN : "rgba(0,0,0,0.12)",
                  backgroundColor: isCorrect ? GREEN + "15" : "white",
                  color: isCorrect ? "#1f6b1f" : "#19191a",
                }}
                className="flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all"
              >
                {isCorrect && "✓ "}{label}
              </button>
            );
          })}
        </div>
      )}

      {/* Text answer */}
      {question.type === "text" && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#f8f9fb] border border-[rgba(0,0,0,0.08)] text-sm text-[#818c99]">
          Участник введёт ответ текстом. Укажите правильный ответ для автопроверки (необязательно):
          <input
            value={question.options[0] ?? ""}
            onChange={e => onChange({ ...question, options: [e.target.value] })}
            placeholder="Правильный ответ…"
            className="mt-2 w-full px-3 py-2 rounded-xl border border-[rgba(0,0,0,0.10)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] text-[#19191a]"
          />
        </div>
      )}

      {/* Points & Time */}
      <div className="flex items-center gap-5 text-sm pt-1 border-t border-[rgba(0,0,0,0.05)] mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <Star size={14} className="text-[#ff9e00] flex-shrink-0" />
          <span className="text-[#818c99]">Баллы</span>
          <input
            type="text"
            inputMode="numeric"
            value={question.points === 0 ? "" : question.points}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange({ ...question, points: raw === "" ? 0 : Math.min(1000, parseInt(raw, 10)) });
            }}
            placeholder="100"
            className="w-16 px-2 py-1.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] text-center transition-all"
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Timer size={14} className="text-[#2787f5] flex-shrink-0" />
          <span className="text-[#818c99]">Сек.</span>
          <input
            type="text"
            inputMode="numeric"
            value={question.time === 0 ? "" : question.time}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange({ ...question, time: raw === "" ? 0 : Math.min(300, parseInt(raw, 10)) });
            }}
            placeholder="30"
            className="w-16 px-2 py-1.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5] text-center transition-all"
          />
        </label>
      </div>
    </Card>
  );
}

// ─── 7. Quiz Saved ────────────────────────────────────────────────────────────

function QuizSavedScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: GREEN + "1a" }}>
          <Check size={40} style={{ color: GREEN }} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#19191a]">Квиз сохранён!</h2>
          <p className="text-[#818c99] mt-2">«История России XIX–XX вв.» успешно сохранён и готов к публикации</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Btn variant="secondary" onClick={() => setScreen("quiz-create")}><Edit3 size={16} />Редактировать</Btn>
          <Btn variant="secondary" onClick={() => setScreen("my-quizzes")}><Eye size={16} />Мои квизы</Btn>
          <Btn onClick={() => setScreen("quiz-launch")}><Play size={16} />Запустить квиз</Btn>
        </div>

        <Card className="w-full p-5">
          <h3 className="font-semibold mb-4">Предпросмотр</h3>
          <div className="flex gap-4 items-start">
            <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=120&h=80&fit=crop&auto=format" alt="Quiz cover" className="rounded-xl w-28 h-20 object-cover bg-[#f2f3f5]" />
            <div>
              <p className="font-bold">История России XIX–XX вв.</p>
              <p className="text-sm text-[#818c99] mt-1">20 вопросов · до 30 сек. на вопрос</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

// ─── 8. Quiz Launch (Organizer) ───────────────────────────────────────────────

function QuizLaunchScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [participants] = useState(["Мария К.", "Дмитрий В.", "Анна С.", "Пётр Л.", "Ольга М.", "Сергей Н."]);
  const code = "847 293";

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Запуск квиза</h2>
            <p className="text-[#818c99] text-sm">«История России XIX–XX вв.»</p>
          </div>
          <Btn onClick={() => setScreen("organizer-control")} size="lg">
            <Play size={18} /> Начать квиз
          </Btn>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-[#818c99]">Код комнаты</p>
            <div className="text-5xl font-bold tracking-[0.2em] text-[#19191a]">{code}</div>
            <div className="flex gap-2">
              <Btn size="sm" variant="secondary"><Link size={14} /> Скопировать ссылку</Btn>
            </div>
            {/* QR placeholder */}
            <div className="w-32 h-32 bg-[#f2f3f5] rounded-xl flex items-center justify-center border border-[rgba(0,0,0,0.08)]">
              <div className="grid grid-cols-5 gap-0.5 p-2">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: Math.random() > 0.4 ? "#19191a" : "transparent" }} />
                ))}
              </div>
            </div>
            <p className="text-xs text-[#818c99] text-center">Отсканируйте QR-код или введите код вручную</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Участники</h3>
              <span className="text-sm font-bold text-[#2787f5]">{participants.length}</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar name={p} size={32} color={["#2787f5", "#4bb34b", "#ff9e00", "#e64646", "#6c7fa6", "#19191a"][i % 6]} />
                  <span className="text-sm flex-1">{p}</span>
                  <button className="w-6 h-6 rounded-full hover:bg-[#ffeaea] flex items-center justify-center text-[#818c99] hover:text-[#e64646] transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)] text-xs text-[#818c99] flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#4bb34b] animate-pulse" />
              Ожидание участников…
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ─── 9. Waiting Room ──────────────────────────────────────────────────────────

function WaitingRoomScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 bg-[#d6e8ff] rounded-2xl flex items-center justify-center">
          <BookOpen size={28} className="text-[#2787f5]" />
        </div>
        <div>
          <h2 className="text-xl font-bold">История России XIX–XX вв.</h2>
          <p className="text-[#818c99] text-sm mt-1">Организатор: Алексей Михайлов</p>
        </div>

        <Avatar name="Анна С" size={56} color="#4bb34b" />
        <div>
          <p className="font-semibold">Анна Сергеева</p>
          <p className="text-sm text-[#818c99]">Вы в комнате</p>
        </div>

        <div className="bg-[#f2f3f5] rounded-xl px-5 py-3 flex items-center gap-2">
          <Users size={16} className="text-[#818c99]" />
          <span className="text-sm text-[#818c99]">6 участников подключено</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#2787f5]"
                style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-sm text-[#818c99]">Ожидание начала квиза{dots}</p>
        </div>

        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
      </Card>
    </div>
  );
}

// ─── 10. Question ─────────────────────────────────────────────────────────────

function QuestionScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(28);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(x => x - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  const progress = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const answered = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
  const results = [true, false, true];

  const answers = ["Лев Толстой", "Фёдор Достоевский", "Иван Тургенев", "Антон Чехов"];

  const pct = timeLeft / 30;
  const timerColor = pct > 0.5 ? GREEN : pct > 0.25 ? ORANGE : RED;

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#818c99]">История России</span>
          <span className="text-xs bg-[#f2f3f5] px-2 py-0.5 rounded-full text-[#818c99]">Вопр. 4/20</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={15} style={{ color: ORANGE }} />
          <span className="font-bold text-sm text-[#19191a]">1 240</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        {/* Timer */}
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-[#f2f3f5] rounded-full overflow-hidden mr-4">
            <div
              style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: timerColor }}
              className="h-full rounded-full transition-all duration-1000"
            />
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: timerColor + "1a", color: timerColor }}>
            {timeLeft}
          </div>
        </div>

        {/* Question */}
        <Card className="p-6">
          <p className="text-lg font-semibold text-[#19191a]">Кто написал роман «Война и мир»?</p>
        </Card>

        {/* Answers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {answers.map((a, i) => {
            const isSelected = selected === i;
            const showResult = submitted;
            const isCorrect = i === 0;

            let borderColor = "rgba(0,0,0,0.1)";
            let bgColor = "#ffffff";
            let labelBg = "#f2f3f5";
            let labelColor = "#818c99";
            let textColor = "#19191a";
            let checkIcon: React.ReactNode = null;

            if (!showResult && isSelected) {
              borderColor = VK_BLUE; bgColor = "#eef5ff";
              labelBg = VK_BLUE; labelColor = "#fff"; textColor = VK_BLUE;
            }
            if (showResult && isCorrect) {
              borderColor = GREEN; bgColor = "#f0faf0";
              labelBg = GREEN; labelColor = "#fff"; textColor = "#1f6b1f";
              checkIcon = <Check size={14} style={{ color: GREEN }} />;
            }
            if (showResult && isSelected && !isCorrect) {
              borderColor = RED; bgColor = "#fff5f5";
              labelBg = RED; labelColor = "#fff"; textColor = "#c03030";
              checkIcon = <X size={14} style={{ color: RED }} />;
            }

            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => setSelected(i)}
                style={{ borderColor, backgroundColor: bgColor }}
                className={`w-full px-4 py-4 rounded-2xl border-2 text-left transition-all duration-150 outline-none group
                  ${!submitted && !isSelected ? "hover:border-[#2787f5] hover:bg-[#f5f9ff]" : ""}
                  ${!submitted ? "active:scale-[0.99]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{ backgroundColor: labelBg, color: labelColor }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                  >
                    {checkIcon ?? ["A", "B", "C", "D"][i]}
                  </span>
                  <span className="font-medium text-sm leading-snug" style={{ color: textColor }}>{a}</span>
                </div>
              </button>
            );
          })}
        </div>

        {!submitted && (
          <Btn size="lg" className="w-full" disabled={selected === null} onClick={() => { setSubmitted(true); if (selected === 0) setTimeout(() => setScreen("answer-result"), 1800); }}>
            Подтвердить ответ
          </Btn>
        )}

        {submitted && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-[#818c99]">
            <div className="w-2 h-2 rounded-full bg-[#2787f5] animate-pulse" />
            Ожидание следующего вопроса…
          </div>
        )}

        {/* Progress panel */}
        <Card className="p-4">
          <p className="text-xs text-[#818c99] mb-3 font-medium">Прогресс</p>
          <div className="flex flex-wrap gap-1.5">
            {progress.map(i => {
              const isCurrent = i === 3;
              const isDone = answered[i];
              const isCorrectDone = isDone && results[i] === true;
              const isWrongDone = isDone && results[i] === false;

              let style: React.CSSProperties = { backgroundColor: "#e8edf3", color: "#818c99" };
              if (isCurrent) style = { backgroundColor: VK_BLUE, color: "white" };
              else if (isCorrectDone) style = { backgroundColor: GREEN, color: "white" };
              else if (isWrongDone) style = { backgroundColor: RED, color: "white" };

              return (
                <div key={i} style={style} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 11. Answer Result ────────────────────────────────────────────────────────

function AnswerResultScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const correct = true;
  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <Card className="p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: correct ? GREEN + "1a" : RED + "1a" }}>
            {correct ? <Check size={40} style={{ color: GREEN }} /> : <X size={40} style={{ color: RED }} />}
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: correct ? GREEN : RED }}>{correct ? "Верно!" : "Неверно"}</p>
            <p className="text-[#818c99] text-sm mt-1">Правильный ответ: <strong className="text-[#19191a]">Лев Толстой</strong></p>
          </div>

          <div className="w-full flex flex-col items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: ORANGE + "1a", color: ORANGE }}>
              +120 баллов за вопрос
            </div>
            <div className="bg-[#f2f3f5] rounded-2xl w-full py-4 flex flex-col items-center gap-0.5">
              <p className="text-3xl font-bold text-[#19191a]">1 390</p>
              <p className="text-xs text-[#818c99]">Итого за квиз</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#f2f3f5] rounded-xl px-4 py-2.5 w-full">
            <Trophy size={16} style={{ color: ORANGE }} />
            <span className="text-sm">Ваше место: <strong>#3</strong> из 6</span>
          </div>
        </Card>

        <div className="text-center text-sm text-[#818c99] flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2787f5] animate-pulse" />
          Ожидание следующего вопроса…
        </div>

        <Btn variant="secondary" onClick={() => setScreen("question")} className="w-full">Следующий вопрос</Btn>
      </div>
    </div>
  );
}

// ─── 12. Organizer Control ────────────────────────────────────────────────────

function OrganizerControlScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [timeLeft, setTimeLeft] = useState(18);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(x => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const distribution = [
    { label: "Лев Толстой", count: 4, pct: 67, correct: true },
    { label: "Достоевский", count: 1, pct: 17, correct: false },
    { label: "Тургенев", count: 1, pct: 16, correct: false },
    { label: "Чехов", count: 0, pct: 0, correct: false },
  ];

  const leaderboard = [
    { name: "Мария К.", score: 1840 }, { name: "Дмитрий В.", score: 1720 },
    { name: "Анна С.", score: 1390 }, { name: "Пётр Л.", score: 1200 },
    { name: "Ольга М.", score: 980 }, { name: "Сергей Н.", score: 760 },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg">Управление квизом</h2>
            <p className="text-[#818c99] text-sm">Вопрос 4 / 20 · 6 участников</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setScreen("leaderboard-mid")}>Таблица</Btn>
            <Btn variant="danger" onClick={() => setScreen("leaderboard-final")}>Завершить</Btn>
            <Btn onClick={() => setScreen("question")}>Следующий вопрос →</Btn>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid gap-5">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Текущий вопрос</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: timeLeft > 10 ? GREEN + "1a" : RED + "1a", color: timeLeft > 10 ? GREEN : RED }}>
                    {timeLeft}
                  </div>
                </div>
              </div>
              <p className="text-[#19191a] font-medium">Кто написал роман «Война и мир»?</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-[#d6f5d6] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: GREEN }}>4</p>
                  <p className="text-[#2a7a2a]">Ответили</p>
                </div>
                <div className="bg-[#ffeaea] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: RED }}>2</p>
                  <p className="text-[#c03030]">Не ответили</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="font-semibold text-sm mb-4">Распределение ответов</p>
              <div className="flex flex-col gap-3">
                {distribution.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        {d.correct && <Check size={13} style={{ color: GREEN }} />}
                        {d.label}
                      </span>
                      <span className="font-semibold text-[#818c99]">{d.count} ({d.pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#f2f3f5] rounded-full overflow-hidden">
                      <div style={{ width: `${d.pct}%`, backgroundColor: d.correct ? GREEN : "#e8edf3" }} className="h-full rounded-full transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <p className="font-semibold text-sm mb-4">Лидерборд</p>
            <div className="flex flex-col gap-2">
              {leaderboard.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-5 text-xs font-bold text-center" style={{ color: i < 3 ? ORANGE : "#818c99" }}>#{i + 1}</span>
                  <Avatar name={p.name} size={28} color={["#2787f5", "#4bb34b", "#ff9e00", "#6c7fa6", "#e64646", "#19191a"][i]} />
                  <span className="text-sm flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-bold text-[#19191a]">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ─── 13. Intermediate Leaderboard ─────────────────────────────────────────────

function LeaderboardMidScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const players = [
    { name: "Мария К.", score: 1840, change: 1, avatar: "#2787f5" },
    { name: "Дмитрий В.", score: 1720, change: -1, avatar: "#4bb34b" },
    { name: "Анна С.", score: 1390, change: 0, avatar: "#ff9e00", isMe: true },
    { name: "Пётр Л.", score: 1200, change: 2, avatar: "#6c7fa6" },
    { name: "Ольга М.", score: 980, change: -1, avatar: "#e64646" },
    { name: "Сергей Н.", score: 760, change: -1, avatar: "#19191a" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-[#818c99] text-sm">После вопроса 10 / 20</p>
          <h2 className="text-2xl font-bold text-[#19191a]">Промежуточный итог</h2>
        </div>
        <Card className="overflow-hidden">
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {players.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${p.isMe ? "bg-[#d6e8ff]" : ""}`}>
                <span className="w-6 text-sm font-bold text-center" style={{ color: i < 3 ? ORANGE : "#818c99" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <Avatar name={p.name} size={36} color={p.avatar} />
                <span className="flex-1 text-sm font-medium">{p.name}{p.isMe && <span className="ml-2 text-xs text-[#2787f5] font-semibold">Вы</span>}</span>
                <span className="text-sm font-bold">{p.score.toLocaleString()}</span>
                <span className="w-6 flex items-center justify-center">
                  {p.change > 0 ? <ArrowUp size={14} style={{ color: GREEN }} /> : p.change < 0 ? <ArrowDown size={14} style={{ color: RED }} /> : <Minus size={14} className="text-[#c4c8cc]" />}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Btn className="w-full mt-4" onClick={() => setScreen("question")}>Следующий вопрос →</Btn>
      </div>
    </div>
  );
}

// ─── 14. Final Leaderboard ────────────────────────────────────────────────────

function LeaderboardFinalScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const podium = [
    { name: "Мария К.", score: 3840, pct: 95, correct: 19, streak: 12, avatar: "#2787f5" },
    { name: "Дмитрий В.", score: 3620, pct: 90, correct: 18, streak: 9, avatar: "#4bb34b" },
    { name: "Пётр Л.", score: 2900, pct: 80, correct: 16, streak: 7, avatar: "#6c7fa6" },
  ];
  const rest = [
    { name: "Анна С.", score: 2640, pct: 75, correct: 15, streak: 5 },
    { name: "Ольга М.", score: 1980, pct: 60, correct: 12, streak: 3 },
    { name: "Сергей Н.", score: 1460, pct: 45, correct: 9, streak: 2 },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="dashboard" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="text-center">
          <Trophy size={40} style={{ color: ORANGE }} className="mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Финальный результат</h2>
          <p className="text-[#818c99] text-sm">«История России XIX–XX вв.»</p>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end">
          {[podium[1], podium[0], podium[2]].map((p, i) => {
            const heights = ["h-28", "h-36", "h-24"];
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <Avatar name={p.name} size={48} color={p.avatar} />
                <p className="text-xs font-semibold text-center">{p.name}</p>
                <p className="text-sm font-bold">{p.score.toLocaleString()}</p>
                <div style={{ backgroundColor: [VK_BLUE + "20", ORANGE + "20", "#6c7fa6" + "20"][i] }}
                  className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center text-2xl`}>
                  {medals[i]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full ranking */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-[#818c99]">Полная таблица</p>
          </div>
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {[...podium.map((p, i) => ({ ...p, pos: i + 1 })), ...rest.map((p, i) => ({ ...p, pos: i + 4, avatar: "#818c99" }))].map((p, i) => (
              <div key={i} className="grid grid-cols-6 items-center px-5 py-3 gap-3 text-sm">
                <span className="font-bold" style={{ color: p.pos <= 3 ? ORANGE : "#818c99" }}>#{p.pos}</span>
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar name={p.name} size={28} color={p.avatar} />
                  <span className="truncate font-medium">{p.name}</span>
                </div>
                <span className="font-bold text-right">{p.score.toLocaleString()}</span>
                <span className="text-center text-[#818c99]">{p.correct}/20</span>
                <span className="text-right" style={{ color: p.pct >= 80 ? GREEN : p.pct >= 60 ? ORANGE : RED }}>{p.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3 justify-center">
          <Btn variant="secondary" onClick={() => setScreen("result-details")}>Мои результаты</Btn>
          <Btn onClick={() => setScreen("dashboard")}>На главную</Btn>
        </div>
      </main>
    </div>
  );
}

// ─── 15. Result Details ───────────────────────────────────────────────────────

function ResultDetailsScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const questions = [
    { text: "Кто написал «Войну и мир»?", yours: "Лев Толстой", correct: "Лев Толстой", points: 120, ok: true },
    { text: "В каком году началась Первая мировая война?", yours: "1915", correct: "1914", points: 0, ok: false },
    { text: "Кто правил во время Октябрьской революции?", yours: "Ленин", correct: "Ленин", points: 100, ok: true },
    { text: "Когда закончилась Вторая мировая война?", yours: "1945", correct: "1945", points: 110, ok: true },
    { text: "Столица Российской империи в XIX веке?", yours: "Москва", correct: "Санкт-Петербург", points: 0, ok: false },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="profile" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("leaderboard-final")} className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-bold text-lg">Детали результата</h2>
        </div>

        <Card className="p-5 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Итоговый балл", val: "2 640", color: VK_BLUE },
            { label: "Место", val: "#4", color: ORANGE },
            { label: "Верных", val: "15/20", color: GREEN },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-caption mt-0.5">{s.label}</p>
            </div>
          ))}
        </Card>

        <h3 className="section-title text-[#818c99]">Вопрос за вопросом</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q, i) => (
            <Card key={i} className="px-5 py-4 flex flex-col gap-3">
              {/* Статус */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: q.ok ? GREEN + "1a" : RED + "1a" }}>
                  {q.ok ? <Check size={12} style={{ color: GREEN }} /> : <X size={12} style={{ color: RED }} />}
                </div>
                <span className="text-xs font-semibold" style={{ color: q.ok ? GREEN : RED }}>
                  {q.ok ? "Верно" : "Неверно"}
                </span>
              </div>

              {/* Текст вопроса */}
              <p className="text-sm font-medium text-[#19191a] leading-snug">{q.text}</p>

              {/* Ответы */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)]">
                <div>
                  <p className="text-caption mb-0.5">Ваш ответ</p>
                  <p className="text-sm font-semibold" style={{ color: q.ok ? GREEN : RED }}>{q.yours}</p>
                </div>
                <div>
                  <p className="text-caption mb-0.5">Верный ответ</p>
                  <p className="text-sm font-semibold" style={{ color: GREEN }}>{q.correct}</p>
                </div>
              </div>

              {/* Баллы по центру */}
              <div className="text-center pt-1 border-t border-[rgba(0,0,0,0.05)]">
                <p className="text-base font-bold" style={{ color: q.ok ? ORANGE : "#c4c8cc" }}>
                  +{q.points} б.
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Btn variant="secondary" onClick={() => setScreen("profile")} className="w-full">Вернуться в профиль</Btn>
      </main>
    </div>
  );
}

// ─── 16. Analytics ────────────────────────────────────────────────────────────

function AnalyticsScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const hardQ = [
    { text: "В каком году началась Первая мировая война?", wrong: 78 },
    { text: "Столица Российской империи в XIX веке?", wrong: 67 },
    { text: "Кто подписал Брестский мир?", wrong: 61 },
  ];

  const distData = [
    { answer: "Толстой", pct: 67, correct: true },
    { answer: "Достоевский", pct: 17, correct: false },
    { answer: "Тургенев", pct: 11, correct: false },
    { answer: "Чехов", pct: 5, correct: false },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="analytics" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl">Аналитика</h2>
            <p className="text-[#818c99] text-sm">«История России XIX–XX вв.» · 22 июля 2026</p>
          </div>
          <Btn variant="secondary"><Download size={15} /> Экспорт</Btn>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Участников", val: "6", icon: Users, color: VK_BLUE },
            { label: "Средний балл", val: "2 105", icon: Star, color: ORANGE },
            { label: "Верных ответов", val: "75%", icon: Check, color: GREEN },
            { label: "Завершили квиз", val: "100%", icon: TrendingUp, color: VK_BLUE },
          ].map((k, i) => (
            <Card key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: k.color + "1a" }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-[#19191a]">{k.val}</p>
                <p className="text-xs text-[#818c99]">{k.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hard questions */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Сложные вопросы</h3>
            <div className="flex flex-col gap-4">
              {hardQ.map((q, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm text-[#19191a] leading-snug">{q.text}</p>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: q.wrong > 60 ? RED : ORANGE }}>{q.wrong}%</span>
                  </div>
                  <div className="h-2 bg-[#f2f3f5] rounded-full overflow-hidden">
                    <div style={{ width: `${q.wrong}%`, backgroundColor: q.wrong > 60 ? RED : ORANGE }} className="h-full rounded-full" />
                  </div>
                  <p className="text-xs text-[#818c99] mt-1">неправильных ответов</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Answer distribution */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Распределение: вопрос 1</h3>
            <div className="flex flex-col gap-3">
              {distData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-24 truncate font-medium flex items-center gap-1.5">
                    {d.correct && <Check size={12} style={{ color: GREEN }} />}
                    {d.answer}
                  </span>
                  <div className="flex-1 h-6 bg-[#f2f3f5] rounded-lg overflow-hidden">
                    <div
                      style={{ width: `${d.pct}%`, backgroundColor: d.correct ? GREEN : "#e8edf3" }}
                      className="h-full rounded-lg flex items-center px-2 transition-all"
                    >
                      {d.pct > 15 && <span className="text-xs font-bold" style={{ color: d.correct ? "white" : "#818c99" }}>{d.pct}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Final leaderboard mini */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Финальный лидерборд</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#818c99] text-xs border-b border-[rgba(0,0,0,0.06)]">
                  <th className="text-left pb-2 font-semibold">#</th>
                  <th className="text-left pb-2 font-semibold">Участник</th>
                  <th className="text-right pb-2 font-semibold">Баллы</th>
                  <th className="text-right pb-2 font-semibold">Верных</th>
                  <th className="text-right pb-2 font-semibold">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                {[
                  { n: "Мария К.", s: 3840, c: 19, p: 95, str: 12 },
                  { n: "Дмитрий В.", s: 3620, c: 18, p: 90, str: 9 },
                  { n: "Пётр Л.", s: 2900, c: 16, p: 80, str: 7 },
                  { n: "Анна С.", s: 2640, c: 15, p: 75, str: 5 },
                  { n: "Ольга М.", s: 1980, c: 12, p: 60, str: 3 },
                  { n: "Сергей Н.", s: 1460, c: 9, p: 45, str: 2 },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-[#f8f9fb]">
                    <td className="py-2.5 font-bold" style={{ color: i < 3 ? ORANGE : "#818c99" }}>#{i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.n} size={24} color={["#2787f5", "#4bb34b", "#6c7fa6", "#ff9e00", "#e64646", "#818c99"][i]} />
                        <span className="font-medium">{r.n}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold">{r.s.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-[#818c99]">{r.c}/20</td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: r.p >= 80 ? GREEN : r.p >= 60 ? ORANGE : RED }}>{r.p}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

// ─── Screen Nav Demo Panel ────────────────────────────────────────────────────

const SCREENS: { id: Screen; label: string }[] = [
  { id: "login", label: "1. Вход" },
  { id: "register", label: "2. Регистрация" },
  { id: "dashboard", label: "3. Главная" },
  { id: "profile", label: "4. Профиль" },
  { id: "my-quizzes", label: "5. Мои квизы" },
  { id: "quiz-create", label: "6. Создание" },
  { id: "quiz-saved", label: "7. Сохранён" },
  { id: "quiz-launch", label: "8. Запуск" },
  { id: "waiting-room", label: "9. Ожидание" },
  { id: "question", label: "10. Вопрос" },
  { id: "answer-result", label: "11. Результат" },
  { id: "organizer-control", label: "12. Контроль" },
  { id: "leaderboard-mid", label: "13. Промеж." },
  { id: "leaderboard-final", label: "14. Финал" },
  { id: "result-details", label: "15. Детали" },
  { id: "analytics", label: "16. Аналитика" },
];

function ScreenPicker({ current, onChange }: { current: Screen; onChange: (s: Screen) => void }) {
  const [open, setOpen] = useState(false);
  const currentLabel = SCREENS.find(s => s.id === current)?.label ?? current;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" style={{ maxWidth: "calc(100vw - 32px)" }}>
      {open && (
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-3 mb-2 grid grid-cols-4 gap-1.5 w-[520px] max-w-[calc(100vw-32px)]">
          {SCREENS.map(s => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false); }}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors ${current === s.id ? "bg-[#2787f5] text-white" : "hover:bg-[#f2f3f5] text-[#19191a]"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#19191a] text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#2c2c2c] transition-colors mx-auto"
      >
        <BookOpen size={15} />
        {currentLabel}
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  const renderScreen = () => {
    switch (screen) {
      case "login": return <LoginScreen setScreen={setScreen} />;
      case "register": return <RegisterScreen setScreen={setScreen} />;
      case "dashboard": return <DashboardScreen setScreen={setScreen} />;
      case "profile": return <ProfileScreen setScreen={setScreen} />;
      case "my-quizzes": return <MyQuizzesScreen setScreen={setScreen} />;
      case "quiz-create": return <QuizCreateScreen setScreen={setScreen} />;
      case "quiz-saved": return <QuizSavedScreen setScreen={setScreen} />;
      case "quiz-launch": return <QuizLaunchScreen setScreen={setScreen} />;
      case "waiting-room": return <WaitingRoomScreen setScreen={setScreen} />;
      case "question": return <QuestionScreen setScreen={setScreen} />;
      case "answer-result": return <AnswerResultScreen setScreen={setScreen} />;
      case "organizer-control": return <OrganizerControlScreen setScreen={setScreen} />;
      case "leaderboard-mid": return <LeaderboardMidScreen setScreen={setScreen} />;
      case "leaderboard-final": return <LeaderboardFinalScreen setScreen={setScreen} />;
      case "result-details": return <ResultDetailsScreen setScreen={setScreen} />;
      case "analytics": return <AnalyticsScreen setScreen={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {renderScreen()}
      <ScreenPicker current={screen} onChange={setScreen} />
    </div>
  );
}
