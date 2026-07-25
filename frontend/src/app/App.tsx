import { useState, useEffect, useRef } from "react";
import {
  Home, BookOpen, Clock, User, Plus, Search, LogOut,
  Edit3, Trash2, Copy, Play, BarChart2, ChevronRight,
  ChevronLeft, Check, X, AlertCircle, Trophy, Star,
  Link, Users, ArrowUp, ArrowDown, Minus, Settings,
  Upload, Eye, Lock, Globe, Shuffle, Timer, Zap,
  TrendingUp, Download, QrCode, Bell, Menu
} from "lucide-react";

import {
  createQuiz,
  createSession,
  deleteQuiz,
  duplicateQuiz,
  getCurrentUser,
  getMe,
  getMyHistory,
  getMyQuizzes,
  getParticipants,
  getQuiz,
  joinSession,
  login,
  logout,
  register,
  startSession,
  subscribeToSession,
  type HistoryItem,
  type QuizWithQuestions,
  type SessionParticipant,
  type QuizSession,
  type UserProfile,
  updateQuiz,
} from "../lib/db";
import { supabase } from "../lib/supabase";

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

function getAuthErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (!message) return fallback;
  if (/Invalid login credentials/i.test(message)) return "Неверный email или пароль";
  if (/Email not confirmed/i.test(message)) return "Подтвердите email";
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(message)) {
    return "Лимит регистраций временно исчерпан. Подождите немного и попробуйте снова";
  }
  if (/Email address .* is invalid|invalid email/i.test(message)) return "Укажите другой действующий email-адрес";
  if (/already registered/i.test(message)) return "Пользователь с таким email уже существует";
  if (/Password/i.test(message) && /6|8/.test(message)) return "Пароль должен быть не короче 8 символов";

  return fallback;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isProtectedScreen(screen: Screen) {
  return [
    "dashboard",
    "profile",
    "my-quizzes",
    "quiz-create",
    "quiz-saved",
    "quiz-launch",
    "analytics",
    "result-details",
    "waiting-room",
    "question",
    "answer-result",
    "organizer-control",
    "leaderboard-mid",
    "leaderboard-final",
  ].includes(screen);
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

function Nav({ screen, setScreen, user, onLogout }: { screen: Screen; setScreen: (s: Screen) => void; user: UserProfile | null; onLogout: () => void; }) {
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
            <Avatar name={user?.name ?? "Гость"} size={32} />
          </button>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full hover:bg-[#f2f3f5] flex items-center justify-center text-[#818c99] outline-none"
            title="Выйти"
          >
            <LogOut size={16} />
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

function LoginScreen({
  onLogin,
  onGoRegister,
  loading,
  error,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoRegister: () => void;
  loading: boolean;
  error: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setLocalError("Введите email");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setLocalError("Введите корректный email");
      return;
    }

    if (!password.trim()) {
      setLocalError("Введите пароль");
      return;
    }

    try {
      await onLogin(normalizedEmail, password);
    } catch {
      setLocalError(error || "Не удалось выполнить вход. Попробуйте ещё раз.");
    }
  };

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
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Input label="Email" type="email" placeholder="ivan@example.com" value={email} onChange={setEmail} error={localError && !email.trim() ? localError : undefined} />
            <Input label="Пароль" type="password" placeholder="••••••••" value={password} onChange={setPassword} error={localError && password ? localError : undefined} />
            {(localError || error) && <p className="text-sm text-[#e64646]">{localError || error}</p>}
            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#2787f5] hover:underline">Забыли пароль?</button>
            </div>
            <Btn size="lg" type="submit" className="w-full" disabled={loading}>{loading ? "Входим…" : "Войти"}</Btn>
          </form>

          <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)] text-center text-sm text-[#818c99]">
            Нет аккаунта?{" "}
            <button onClick={onGoRegister} className="text-[#2787f5] font-semibold hover:underline">
              Зарегистрироваться
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 2. Register ──────────────────────────────────────────────────────────────

function RegisterScreen({
  onRegister,
  onGoLogin,
  loading,
  error,
  success,
}: {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onGoLogin: () => void;
  loading: boolean;
  error: string;
  success: string;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [localErrors, setLocalErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof localErrors = {};
    const normalizedEmail = normalizeEmail(form.email);

    if (!form.name.trim()) nextErrors.name = "Введите имя";
    if (!normalizedEmail) nextErrors.email = "Введите email";
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = "Введите корректный email";
    if ((form.password || "").length < 8) nextErrors.password = "Пароль должен быть не короче 8 символов";
    if (form.password !== form.confirm) nextErrors.confirm = "Пароли не совпадают";
    setLocalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onRegister(form.name.trim(), normalizedEmail, form.password);
  };

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
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Input label="Имя пользователя" placeholder="ivan_petrov" value={form.name} onChange={f("name")} error={localErrors.name} />
            <Input label="Email" type="email" placeholder="ivan@example.com" value={form.email} onChange={f("email")} error={localErrors.email} />
            <Input label="Пароль" type="password" placeholder="Минимум 8 символов" value={form.password} onChange={f("password")} error={localErrors.password} />
            <Input label="Подтверждение пароля" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={f("confirm")} error={localErrors.confirm} />
            {(error || success) && <p className={`text-sm ${error ? "text-[#e64646]" : "text-[#4bb34b]"}`}>{error || success}</p>}
            <Btn size="lg" type="submit" className="w-full mt-1" disabled={loading}>{loading ? "Создаём…" : "Создать аккаунт"}</Btn>
          </form>
          <p className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)] text-center text-sm text-[#818c99]">
            Уже есть аккаунт?{" "}
            <button onClick={onGoLogin} className="text-[#2787f5] font-semibold hover:underline">Войти</button>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── 3. Dashboard ─────────────────────────────────────────────────────────────

function DashboardScreen({
  setScreen,
  user,
  onLogout,
  onJoinSession,
  onOpenQuiz,
}: {
  setScreen: (s: Screen) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onJoinSession: (code: string) => Promise<void>;
  onOpenQuiz: (quizId?: string) => void;
}) {
  const [code, setCode] = useState("");
  const [recent, setRecent] = useState<QuizWithQuestions[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadRecent() {
      try {
        setLoadingRecent(true);
        const data = await getMyQuizzes();
        if (alive) setRecent(data.slice(0, 3));
      } catch {
        if (alive) setRecent([]);
      } finally {
        if (alive) setLoadingRecent(false);
      }
    }

    void loadRecent();
    return () => { alive = false; };
  }, []);

  const join = async () => {
    setJoinError("");
    setJoinLoading(true);
    try {
      await onJoinSession(code);
    } catch {
      setJoinError("Не удалось присоединиться к квизу");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="dashboard" setScreen={setScreen} user={user} onLogout={onLogout} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
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
            <Btn size="lg" onClick={join} disabled={code.length !== 6 || joinLoading} className="px-8">
              {joinLoading ? "Входим…" : "Войти"}
            </Btn>
          </div>
          {joinError && <p className="mt-3 text-sm text-[#e64646]">{joinError}</p>}
        </Card>

        {/* Create + Recent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onOpenQuiz()}
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
            {loadingRecent && <p className="text-sm text-[#818c99]">Загрузка квизов…</p>}
            {!loadingRecent && recent.length === 0 && <p className="text-sm text-[#818c99]">Пока нет созданных квизов.</p>}
            {recent.map((q, i) => (
              <Card key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ["#d6e8ff", "#d6f5d6", "#fff3d6"][i % 3] }}>
                    <BookOpen size={16} style={{ color: [VK_BLUE, GREEN, ORANGE][i % 3] }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#19191a] truncate">{q.title}</p>
                    <p className="text-xs text-[#818c99]">
                      {q.questions.length} вопр. · {q.attemptCount} попыток
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Btn size="sm" variant="ghost" onClick={() => onOpenQuiz(q.id)}>
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

function ProfileScreen({ setScreen, user, onLogout }: { setScreen: (s: Screen) => void; user: UserProfile | null; onLogout: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(!user);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const data = await getMe();
        if (alive) setProfile(data);
        const items = await getMyHistory();
        if (alive) setHistory(items);
      } catch {
        if (alive) setError("Не удалось загрузить профиль");
      } finally {
        if (alive) setLoading(false);
        if (alive) setHistoryLoading(false);
      }
    }

    void loadProfile();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="profile" setScreen={setScreen} user={profile} onLogout={onLogout} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        {loading && <Card className="p-6 text-sm text-[#818c99]">Загрузка профиля…</Card>}
        {error && <Card className="p-6 text-sm text-[#e64646]">{error}</Card>}
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <Avatar name={profile?.name ?? "Профиль"} size={72} />
            <div>
              <h2 className="text-xl font-bold">{profile?.name ?? "Профиль пользователя"}</h2>
              <p className="text-[#818c99] text-sm">{profile?.email ?? "—"}</p>
              <p className="text-[#818c99] text-xs mt-1">На платформе с {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ru-RU") : "—"}</p>
            </div>
            <div className="ml-auto hidden md:flex gap-6">
              {[[String(profile?.quizzesPlayed ?? 0), "Квизов пройдено"], [String(profile?.quizzesCreated ?? 0), "Квизов создано"]].map(([v, l], i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-[#2787f5]">{v}</p>
                  <p className="text-xs text-[#818c99]">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <h3 className="font-semibold text-[#19191a]">История участия</h3>
        {historyLoading && <Card className="p-6 text-sm text-[#818c99]">Загрузка истории…</Card>}
        {!historyLoading && history.length === 0 && <Card className="p-6 text-sm text-[#818c99]">История пока пуста.</Card>}
        {history.map((h, i) => (
          <Card key={i} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-[#19191a]">{h.title}</p>
                <p className="text-xs text-[#818c99] mt-0.5">{new Date(h.playedAt).toLocaleDateString("ru-RU")}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-[#19191a]">{h.score}</p>
                  <p className="text-xs text-[#818c99]">Баллы</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: h.rank <= 3 ? ORANGE : "#19191a" }}>#{h.rank}</p>
                  <p className="text-xs text-[#818c99]">Позиция</p>
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

function MyQuizzesScreen({
  setScreen,
  onEditQuiz,
  onLaunchQuiz,
}: {
  setScreen: (s: Screen) => void;
  onEditQuiz: (quizId?: string) => void;
  onLaunchQuiz: (quizId: string) => void;
}) {
  const [quizzes, setQuizzes] = useState<QuizWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyQuizzes();
      setQuizzes(data);
    } catch {
      setError("Не удалось загрузить квизы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuizzes();
  }, []);

  const handleDelete = async (quizId: string) => {
    await deleteQuiz(quizId);
    await loadQuizzes();
  };

  const handleDuplicate = async (quizId: string) => {
    await duplicateQuiz(quizId);
    await loadQuizzes();
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Мои квизы</h2>
          <Btn onClick={() => setScreen("quiz-create")}><Plus size={16} /> Создать</Btn>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading && <Card className="p-5 text-sm text-[#818c99]">Загрузка квизов…</Card>}
          {error && <Card className="p-5 text-sm text-[#e64646]">{error}</Card>}
          {!loading && !error && quizzes.map((q, i) => (
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
                    <span className="text-xs text-[#818c99]">{q.questions.length} вопр.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs bg-[#f8f9fb] rounded-xl px-3 py-2.5">
                <div><p className="font-semibold text-[#19191a]">{q.attemptCount}</p><p className="text-[#818c99]">Попыток</p></div>
                <div><p className="font-semibold text-[#19191a]">{new Date(q.createdAt).toLocaleDateString("ru-RU")}</p><p className="text-[#818c99]">Создан</p></div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Btn size="sm" variant="secondary" onClick={() => onEditQuiz(q.id)}><Edit3 size={13} />Ред.</Btn>
                <Btn size="sm" onClick={() => onLaunchQuiz(q.id)}><Play size={13} />Запуск</Btn>
                <Btn size="sm" variant="secondary"><Copy size={13} />Копировать</Btn>
                <Btn size="sm" variant="secondary" onClick={() => handleDuplicate(q.id)}><Copy size={13} />Дублировать</Btn>
                <Btn size="sm" variant="secondary" className="ml-auto !text-[#e64646] hover:bg-red-50" onClick={() => handleDelete(q.id)}><Trash2 size={13} />Удалить</Btn>
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

function QuizCreateScreen({
  setScreen,
  quizId,
  onSaved,
}: {
  setScreen: (s: Screen) => void;
  quizId: string | null;
  onSaved: (quiz: QuizWithQuestions) => void;
}) {
  const [title, setTitle] = useState("Новый квиз");
  const [desc, setDesc] = useState("");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(!!quizId);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: "single", text: "Кто написал «Войну и мир»?", options: ["Достоевский", "Толстой", "Тургенев", "Чехов"], correct: [1], points: 100, time: 30 },
    { id: 2, type: "truefalse", text: "Вода кипит при 100°C на уровне моря", options: ["Верно", "Неверно"], correct: [0], points: 50, time: 15 },
  ]);
  const [settings, setSettings] = useState({ shuffle: false, defaultTime: 30 });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    let alive = true;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");
        const quiz = await getQuiz(quizId);
        if (!alive) return;

        setTitle(quiz.title);
        setDesc(quiz.description ?? "");
        setSettings({ shuffle: quiz.shuffleQuestions, defaultTime: quiz.defaultTimeSec });
        setQuestions(
          quiz.questions.map((question, index) => ({
            id: index + 1,
            type: question.type as QuestionType,
            text: question.text,
            options: question.type === "text" ? [question.options[0]?.text ?? ""] : question.options.map((option) => option.text),
            correct: question.options.reduce<number[]>((acc, option, optionIndex) => {
              if (option.isCorrect) acc.push(optionIndex);
              return acc;
            }, []),
            points: question.points,
            time: question.timeSec,
            imageUrl: question.imageUrl,
          })),
        );
      } catch {
        if (alive) setError("Не удалось загрузить квиз");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadQuiz();
    return () => { alive = false; };
  }, [quizId]);

  const addQuestion = () => {
    setQuestions(q => [...q, { id: Date.now(), type: "single", text: "", options: ["", "", "", ""], correct: [], points: 100, time: 30 }]);
  };

  const save = async () => {
    setSaved("saving");
    setError("");

    try {
      const payload = {
        title,
        description: desc || undefined,
        shuffleQuestions: settings.shuffle,
        defaultTimeSec: settings.defaultTime,
        questions: questions.map((question) => ({
          type: question.type,
          text: question.text,
          imageUrl: question.imageUrl,
          points: question.points,
          timeSec: question.time,
          options: question.options
            .filter((option) => option.trim().length > 0)
            .map((option, index) => ({
              text: option,
              isCorrect: question.correct.includes(index),
            })),
        })),
      };

      const savedQuiz = quizId
        ? await updateQuiz(quizId, payload)
        : await createQuiz(payload);

      setSaved("saved");
      onSaved(savedQuiz);
    } catch {
      setError("Не удалось сохранить квиз");
      setSaved("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-6">

        {loading && <Card className="p-6 text-sm text-[#818c99]">Загрузка квиза…</Card>}
        {error && <Card className="p-6 text-sm text-[#e64646]">{error}</Card>}

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
              <Btn size="sm" onClick={save} disabled={loading || saved === "saving"}>
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

function QuizSavedScreen({
  setScreen,
  quiz,
  onEdit,
  onOpenMyQuizzes,
  onLaunch,
}: {
  setScreen: (s: Screen) => void;
  quiz: QuizWithQuestions | null;
  onEdit: () => void;
  onOpenMyQuizzes: () => void;
  onLaunch: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: GREEN + "1a" }}>
          <Check size={40} style={{ color: GREEN }} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#19191a]">Квиз сохранён!</h2>
          <p className="text-[#818c99] mt-2">«{quiz?.title ?? "Квиз"}» успешно сохранён и готов к публикации</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Btn variant="secondary" onClick={onEdit}><Edit3 size={16} />Редактировать</Btn>
          <Btn variant="secondary" onClick={onOpenMyQuizzes}><Eye size={16} />Мои квизы</Btn>
          <Btn onClick={onLaunch}><Play size={16} />Запустить квиз</Btn>
        </div>

        <Card className="w-full p-5">
          <h3 className="font-semibold mb-4">Предпросмотр</h3>
          <div className="flex gap-4 items-start">
            <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=120&h=80&fit=crop&auto=format" alt="Quiz cover" className="rounded-xl w-28 h-20 object-cover bg-[#f2f3f5]" />
            <div>
              <p className="font-bold">{quiz?.title ?? "Новый квиз"}</p>
              <p className="text-sm text-[#818c99] mt-1">{quiz?.questions.length ?? 0} вопросов · до {quiz?.defaultTimeSec ?? 30} сек. на вопрос</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

// ─── 8. Quiz Launch (Organizer) ───────────────────────────────────────────────

function QuizLaunchScreen({
  setScreen,
  quiz,
  session,
  onCreateSession,
  onStartSession,
}: {
  setScreen: (s: Screen) => void;
  quiz: QuizWithQuestions | null;
  session: QuizSession | null;
  quizId: string | null;
  onCreateSession: () => Promise<void>;
  onStartSession: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const code = session?.code ?? "------";
  const [participants] = useState(["Мария К.", "Дмитрий В.", "Анна С.", "Пётр Л.", "Ольга М.", "Сергей Н."]);

  const handlePrimary = async () => {
    setError("");
    setLoading(true);
    try {
      if (!session) {
        await onCreateSession();
      } else {
        await onStartSession();
      }
    } catch {
      setError("Не удалось создать или запустить квиз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Запуск квиза</h2>
            <p className="text-[#818c99] text-sm">«{quiz?.title ?? "Квиз"}»</p>
          </div>
          <Btn onClick={handlePrimary} size="lg" disabled={loading}>
            <Play size={18} /> {session ? (loading ? "Запуск…" : "Начать квиз") : (loading ? "Создаём…" : "Создать комнату")}
          </Btn>
        </div>
        {error && <Card className="p-4 text-sm text-[#e64646]">{error}</Card>}

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

function WaitingRoomScreen({
  setScreen,
  session,
  participant,
  quiz,
}: {
  setScreen: (s: Screen) => void;
  session: QuizSession | null;
  participant: SessionParticipant | null;
  quiz: QuizWithQuestions | null;
}) {
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
          <h2 className="text-xl font-bold">{quiz?.title ?? "Квиз"}</h2>
          <p className="text-[#818c99] text-sm mt-1">Организатор: {session ? session.hostId : "—"}</p>
        </div>

        <Avatar name={participant ? participant.userId : "Анна С"} size={56} color="#4bb34b" />
        <div>
          <p className="font-semibold">{participant ? participant.userId : "Анна Сергеева"}</p>
          <p className="text-sm text-[#818c99]">Вы в комнате</p>
        </div>

        <div className="bg-[#f2f3f5] rounded-xl px-5 py-3 flex items-center gap-2">
          <Users size={16} className="text-[#818c99]" />
          <span className="text-sm text-[#818c99]">{session ? `Комната ${session.code}` : "Ожидание комнаты"}</span>
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

function QuestionScreen({
  setScreen,
  quiz,
  session,
  participant,
  onSubmit,
}: {
  setScreen: (s: Screen) => void;
  quiz: QuizWithQuestions | null;
  session: QuizSession | null;
  participant: SessionParticipant | null;
  onSubmit: (payload: { questionId: string; selectedOptionIds: string[]; textAnswer?: string }) => Promise<void>;
}) {
  const question = quiz?.questions[session?.currentQuestionIndex ?? 0] ?? null;
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(question?.timeSec ?? 30);

  useEffect(() => {
    setSelectedOptionIds([]);
    setTextAnswer("");
    setTimeLeft(question?.timeSec ?? 30);
  }, [question?.id, question?.timeSec]);

  useEffect(() => {
    if (submitting || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [submitting, timeLeft]);

  if (!quiz || !session || !participant || !question) {
    return <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center text-[#818c99]">Вопрос недоступен</div>;
  }

  const progress = quiz.questions.map((_, index) => index);
  const pct = question.timeSec > 0 ? timeLeft / question.timeSec : 0;
  const timerColor = pct > 0.5 ? GREEN : pct > 0.25 ? ORANGE : RED;
  const isMultiple = question.type === "multiple";

  const toggleOption = (optionId: string) => {
    if (isMultiple) {
      setSelectedOptionIds((current) => current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]);
      return;
    }

    setSelectedOptionIds([optionId]);
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        questionId: question.id,
        selectedOptionIds: question.type === "text" ? [] : selectedOptionIds,
        textAnswer: question.type === "text" ? textAnswer : undefined,
      });
      setScreen("answer-result");
    } catch {
      setError("Не удалось отправить ответ");
    } finally {
      setSubmitting(false);
    }
  };

  const displayOptions = question.type === "text" ? [] : question.options;

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex flex-col">
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#818c99]">{quiz.title}</span>
          <span className="text-xs bg-[#f2f3f5] px-2 py-0.5 rounded-full text-[#818c99]">Вопр. {session.currentQuestionIndex + 1}/{quiz.questions.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={15} style={{ color: ORANGE }} />
          <span className="font-bold text-sm text-[#19191a]">{participant.score.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-[#f2f3f5] rounded-full overflow-hidden mr-4">
            <div style={{ width: `${Math.max(0, (timeLeft / Math.max(question.timeSec, 1)) * 100)}%`, backgroundColor: timerColor }} className="h-full rounded-full transition-all duration-1000" />
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: `${timerColor}1a`, color: timerColor }}>
            {timeLeft}
          </div>
        </div>

        <Card className="p-6">
          <p className="text-lg font-semibold text-[#19191a]">{question.text}</p>
        </Card>

        {question.type === "text" ? (
          <Card className="p-5">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Введите ответ"
              className="w-full min-h-28 px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] text-sm bg-white outline-none focus:ring-2 focus:ring-[#2787f5]/30 focus:border-[#2787f5]"
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayOptions.map((option, index) => {
              const selected = selectedOptionIds.includes(option.id);
              const label = String.fromCharCode(65 + index);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  style={{
                    borderColor: selected ? VK_BLUE : "rgba(0,0,0,0.1)",
                    backgroundColor: selected ? "#eef5ff" : "#ffffff",
                  }}
                  className="w-full px-4 py-4 rounded-2xl border-2 text-left transition-all duration-150 outline-none active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <span style={{ backgroundColor: selected ? VK_BLUE : "#f2f3f5", color: selected ? "#fff" : "#818c99" }} className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors">
                      {label}
                    </span>
                    <span className="font-medium text-sm leading-snug text-[#19191a]">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-[#e64646]">{error}</p>}

        <Btn size="lg" className="w-full" disabled={submitting || (question.type === "text" ? !textAnswer.trim() : selectedOptionIds.length === 0)} onClick={submit}>
          {submitting ? "Отправляем…" : "Подтвердить ответ"}
        </Btn>

        <Card className="p-4">
          <p className="text-xs text-[#818c99] mb-3 font-medium">Прогресс</p>
          <div className="flex flex-wrap gap-1.5">
            {progress.map((index) => {
              const isCurrent = index === session.currentQuestionIndex;
              const isDone = index < session.currentQuestionIndex;
              let style: React.CSSProperties = { backgroundColor: "#e8edf3", color: "#818c99" };
              if (isCurrent) style = { backgroundColor: VK_BLUE, color: "white" };
              else if (isDone) style = { backgroundColor: GREEN, color: "white" };

              return (
                <div key={index} style={style} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold">
                  {index + 1}
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

function AnswerResultScreen({
  setScreen,
  quiz,
  session,
  latestAnswer,
  onNextQuestion,
}: {
  setScreen: (s: Screen) => void;
  quiz: QuizWithQuestions | null;
  session: QuizSession | null;
  latestAnswer: {
    isCorrect: boolean;
    pointsAwarded: number;
    totalScore: number;
    rank: number;
    questionText: string;
    correctAnswerText: string;
    answeredText: string;
  } | null;
  onNextQuestion: () => Promise<void>;
}) {
  if (!latestAnswer) {
    return <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center text-[#818c99]">Нет результата ответа</div>;
  }

  const correct = latestAnswer.isCorrect;

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <Card className="p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: correct ? GREEN + "1a" : RED + "1a" }}>
            {correct ? <Check size={40} style={{ color: GREEN }} /> : <X size={40} style={{ color: RED }} />}
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: correct ? GREEN : RED }}>{correct ? "Верно!" : "Неверно"}</p>
            <p className="text-[#818c99] text-sm mt-1">Правильный ответ: <strong className="text-[#19191a]">{latestAnswer.correctAnswerText}</strong></p>
          </div>

          <div className="w-full flex flex-col items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: ORANGE + "1a", color: ORANGE }}>
              +{latestAnswer.pointsAwarded} баллов за вопрос
            </div>
            <div className="bg-[#f2f3f5] rounded-2xl w-full py-4 flex flex-col items-center gap-0.5">
              <p className="text-3xl font-bold text-[#19191a]">{latestAnswer.totalScore.toLocaleString()}</p>
              <p className="text-xs text-[#818c99]">Итого за квиз</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#f2f3f5] rounded-xl px-4 py-2.5 w-full">
            <Trophy size={16} style={{ color: ORANGE }} />
            <span className="text-sm">Ваше место: <strong>#{latestAnswer.rank}</strong></span>
          </div>
        </Card>

        <div className="text-center text-sm text-[#818c99] flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2787f5] animate-pulse" />
          Ожидание следующего вопроса…
        </div>

        <Btn variant="secondary" onClick={onNextQuestion} className="w-full">
          {session && quiz && session.currentQuestionIndex + 1 >= quiz.questions.length ? "Завершить" : "Следующий вопрос"}
        </Btn>
      </div>
    </div>
  );
}

// ─── 12. Organizer Control ────────────────────────────────────────────────────

function OrganizerControlScreen({
  setScreen,
  session,
  quiz,
}: {
  setScreen: (s: Screen) => void;
  session: QuizSession | null;
  quiz: QuizWithQuestions | null;
}) {
  const [timeLeft, setTimeLeft] = useState(18);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [participantRows, setParticipantRows] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(x => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getParticipants(session.id);
        if (!alive) return;
        const rows = data.map((participant) => ({
          id: participant.id,
          sessionId: participant.sessionId,
          userId: participant.userId,
          score: participant.score,
          status: participant.status,
          joinedAt: participant.joinedAt,
          finishedAt: participant.finishedAt,
        }));
        setParticipants(rows);
        setParticipantRows(rows);
      } catch {
        if (alive) {
          setParticipants([]);
          setParticipantRows([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeToSession(session.id, () => {
      void load();
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [session]);

  const distribution = [
    { label: "Лев Толстой", count: 4, pct: 67, correct: true },
    { label: "Достоевский", count: 1, pct: 17, correct: false },
    { label: "Тургенев", count: 1, pct: 16, correct: false },
    { label: "Чехов", count: 0, pct: 0, correct: false },
  ];

  const leaderboard = participantRows;

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="my-quizzes" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg">Управление квизом</h2>
            <p className="text-[#818c99] text-sm">{quiz?.title ?? "Квиз"} · {participants.length || 0} участников</p>
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
                  <p className="text-2xl font-bold" style={{ color: GREEN }}>{participants.filter((p) => p.status !== "joined").length}</p>
                  <p className="text-[#2a7a2a]">Ответили</p>
                </div>
                <div className="bg-[#ffeaea] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: RED }}>{Math.max(0, 6 - participants.length)}</p>
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
              {loading && <p className="text-sm text-[#818c99]">Загрузка участников…</p>}
              {!loading && leaderboard.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-5 text-xs font-bold text-center" style={{ color: i < 3 ? ORANGE : "#818c99" }}>#{i + 1}</span>
                  <Avatar name={p.userId} size={28} color={["#2787f5", "#4bb34b", "#ff9e00", "#6c7fa6", "#e64646", "#19191a"][i]} />
                  <span className="text-sm flex-1 truncate">{p.userId}</span>
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

function LeaderboardMidScreen({
  setScreen,
  session,
  participants,
}: {
  setScreen: (s: Screen) => void;
  session: QuizSession | null;
  participants: ParticipantDTO[];
}) {
  const [players, setPlayers] = useState<ParticipantDTO[]>(participants);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!session) return;
      const data = await getParticipants(session.id).catch(() => []);
      if (alive) setPlayers(data);
    }

    void load();
    return () => { alive = false; };
  }, [session]);

  useEffect(() => {
    setPlayers(participants);
  }, [participants]);

  const playersFallback: ParticipantDTO[] = [
    { id: "1", sessionId: "", userId: "Мария К.", name: "Мария К.", score: 1840, rank: 1, status: "playing", joinedAt: new Date().toISOString() },
    { id: "2", sessionId: "", userId: "Дмитрий В.", name: "Дмитрий В.", score: 1720, rank: 2, status: "playing", joinedAt: new Date().toISOString() },
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
            {(players.length > 0 ? players : playersFallback).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-6 text-sm font-bold text-center" style={{ color: i < 3 ? ORANGE : "#818c99" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <Avatar name={p.name} size={36} color={i % 2 === 0 ? "#2787f5" : "#4bb34b"} />
                <span className="flex-1 text-sm font-medium">{p.name}</span>
                <span className="text-sm font-bold">{p.score.toLocaleString()}</span>
                <span className="w-6 flex items-center justify-center">
                  {i === 0 ? <ArrowUp size={14} style={{ color: GREEN }} /> : i === players.length - 1 ? <ArrowDown size={14} style={{ color: RED }} /> : <Minus size={14} className="text-[#c4c8cc]" />}
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

function LeaderboardFinalScreen({
  setScreen,
  session,
  quiz,
  participants,
}: {
  setScreen: (s: Screen) => void;
  session: QuizSession | null;
  quiz: QuizWithQuestions | null;
  participants: ParticipantDTO[];
}) {
  const [rows, setRows] = useState<ParticipantDTO[]>(participants);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!session) return;
      const data = await getParticipants(session.id).catch(() => []);
      if (alive) setRows(data);
    }

    void load();
    return () => { alive = false; };
  }, [session]);

  useEffect(() => {
    setRows(participants);
  }, [participants]);

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const podium = sorted.slice(0, 3).length > 0 ? sorted.slice(0, 3) : [
    { id: "1", sessionId: "", userId: "Мария К.", name: "Мария К.", score: 3840, rank: 1, status: "finished", joinedAt: new Date().toISOString() },
    { id: "2", sessionId: "", userId: "Дмитрий В.", name: "Дмитрий В.", score: 3620, rank: 2, status: "finished", joinedAt: new Date().toISOString() },
    { id: "3", sessionId: "", userId: "Пётр Л.", name: "Пётр Л.", score: 2900, rank: 3, status: "finished", joinedAt: new Date().toISOString() },
  ];
  const rest = sorted.slice(3);

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      <Nav screen="dashboard" setScreen={setScreen} />
      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
        <div className="text-center">
          <Trophy size={40} style={{ color: ORANGE }} className="mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Финальный результат</h2>
          <p className="text-[#818c99] text-sm">«{quiz?.title ?? "Квиз"}»</p>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((p, i) => {
            const heights = ["h-28", "h-36", "h-24"];
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <Avatar name={p.name} size={48} color={["#2787f5", "#4bb34b", "#6c7fa6"][i]} />
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
            {[...podium.map((p, i) => ({ ...p, pos: i + 1 })), ...rest.map((p, i) => ({ ...p, pos: i + 4 }))].map((p, i) => (
              <div key={i} className="grid grid-cols-6 items-center px-5 py-3 gap-3 text-sm">
                <span className="font-bold" style={{ color: p.pos <= 3 ? ORANGE : "#818c99" }}>#{p.pos}</span>
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar name={p.name} size={28} color={p.pos <= 3 ? ["#2787f5", "#4bb34b", "#6c7fa6"][p.pos - 1] : "#818c99"} />
                  <span className="truncate font-medium">{p.name}</span>
                </div>
                <span className="font-bold text-right">{p.score.toLocaleString()}</span>
                <span className="text-center text-[#818c99]">{p.score}</span>
                <span className="text-right" style={{ color: GREEN }}>{p.rank}</span>
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

function ResultDetailsScreen({
  setScreen,
  session,
  participant,
}: {
  setScreen: (s: Screen) => void;
  session: QuizSession | null;
  participant: SessionParticipant | null;
}) {
  const [details, setDetails] = useState<ParticipantAnswerDetail[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!participant) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getParticipantAnswers(participant.id);
        if (alive) setDetails(data);
        if (session) {
          const participantsList = await getParticipants(session.id).catch(() => []);
          const current = participantsList.find((item) => item.id === participant.id);
          if (alive) setRank(current?.rank ?? null);
        }
      } catch {
        if (alive) setDetails([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => { alive = false; };
  }, [participant]);

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
            { label: "Итоговый балл", val: participant?.score.toLocaleString() ?? "—", color: VK_BLUE },
            { label: "Место", val: rank ? `#${rank}` : "—", color: ORANGE },
            { label: "Верных", val: `${details.filter((item) => item.isCorrect).length}/${details.length || 0}`, color: GREEN },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-caption mt-0.5">{s.label}</p>
            </div>
          ))}
        </Card>

        <h3 className="section-title text-[#818c99]">Вопрос за вопросом</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading && <Card className="p-6 text-sm text-[#818c99]">Загрузка деталей…</Card>}
          {!loading && details.map((q, i) => (
            <Card key={i} className="px-5 py-4 flex flex-col gap-3">
              {/* Статус */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: q.isCorrect ? GREEN + "1a" : RED + "1a" }}>
                  {q.isCorrect ? <Check size={12} style={{ color: GREEN }} /> : <X size={12} style={{ color: RED }} />}
                </div>
                <span className="text-xs font-semibold" style={{ color: q.isCorrect ? GREEN : RED }}>
                  {q.isCorrect ? "Верно" : "Неверно"}
                </span>
              </div>

              {/* Текст вопроса */}
              <p className="text-sm font-medium text-[#19191a] leading-snug">{q.text}</p>

              {/* Ответы */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)]">
                <div>
                  <p className="text-caption mb-0.5">Ваш ответ</p>
                  <p className="text-sm font-semibold" style={{ color: q.isCorrect ? GREEN : RED }}>{q.textAnswer ?? "—"}</p>
                </div>
                <div>
                  <p className="text-caption mb-0.5">Верный ответ</p>
                  <p className="text-sm font-semibold" style={{ color: GREEN }}>{q.correctAnswerText}</p>
                </div>
              </div>

              {/* Баллы по центру */}
              <div className="text-center pt-1 border-t border-[rgba(0,0,0,0.05)]">
                <p className="text-base font-bold" style={{ color: q.isCorrect ? ORANGE : "#c4c8cc" }}>
                  +{q.pointsAwarded} б.
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

function AnalyticsScreen({
  setScreen,
  quiz,
  participants,
  session,
}: {
  setScreen: (s: Screen) => void;
  quiz: QuizWithQuestions | null;
  participants: ParticipantDTO[];
  session: QuizSession | null;
}) {
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
            <p className="text-[#818c99] text-sm">«{quiz?.title ?? "Квиз"}» · {session ? new Date(session.createdAt).toLocaleDateString("ru-RU") : "—"}</p>
          </div>
          <Btn variant="secondary"><Download size={15} /> Экспорт</Btn>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Участников", val: String(participants.length), icon: Users, color: VK_BLUE },
            { label: "Средний балл", val: participants.length > 0 ? Math.round(participants.reduce((sum, item) => sum + item.score, 0) / participants.length).toLocaleString() : "0", icon: Star, color: ORANGE },
            { label: "Верных ответов", val: "—", icon: Check, color: GREEN },
            { label: "Завершили квиз", val: participants.length > 0 ? `${Math.round((participants.filter((item) => item.status === "finished").length / participants.length) * 100)}%` : "0%", icon: TrendingUp, color: VK_BLUE },
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [booting, setBooting] = useState(true);
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizWithQuestions | null>(null);
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<SessionParticipant | null>(null);
  const [latestAnswer, setLatestAnswer] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    totalScore: number;
    rank: number;
    questionText: string;
    correctAnswerText: string;
    answeredText: string;
  } | null>(null);
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [participantAnswers, setParticipantAnswers] = useState<ParticipantAnswerDetail[]>([]);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (!alive) return;

        if (!currentUser) {
          setAuthUser(null);
          setScreen("login");
          return;
        }

        const profile = await getMe().catch(() => null);
        if (!alive) return;

        setAuthUser(profile ?? null);
        setScreen("dashboard");
      } catch {
        if (!alive) return;
        setAuthUser(null);
        setScreen("login");
      } finally {
        if (alive) setBooting(false);
      }
    }

    void initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;

      if (!session?.user) {
        setAuthUser(null);
        setScreen("login");
        return;
      }

      const profile = await getMe().catch(() => null);
      if (!alive) return;

      setAuthUser(profile ?? null);
      setScreen("dashboard");
    });

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!booting && !authUser && isProtectedScreen(screen)) {
      setScreen("login");
    }
  }, [authUser, booting, screen]);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      await login(email, password);
      const profile = await getMe().catch(() => null);
      setAuthUser(profile ?? null);
      setScreen("dashboard");
    } catch (error) {
      setLoginError(getAuthErrorMessage(error, "Не удалось выполнить вход. Попробуйте ещё раз."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");

    try {
      const result = await register(name, email, password);
      const session = result?.session;

      if (session) {
        const profile = await getMe().catch(() => null);
        setAuthUser(profile ?? null);
        setScreen("dashboard");
        return;
      }

      setRegisterSuccess("Аккаунт создан. Теперь войдите в систему.");
      setScreen("login");
    } catch (error) {
      setRegisterError(getAuthErrorMessage(error, "Не удалось создать аккаунт. Попробуйте ещё раз."));
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    setActiveQuizId(null);
    setActiveQuiz(null);
    setActiveSession(null);
    setActiveParticipant(null);
    setLatestAnswer(null);
    setParticipants([]);
    setParticipantAnswers([]);
    setScreen("login");
  };

  const handleOpenQuiz = (quizId?: string) => {
    setActiveQuizId(quizId ?? null);
    setActiveSession(null);
    setActiveParticipant(null);
    setLatestAnswer(null);
    setParticipantAnswers([]);
    if (!quizId) {
      setActiveQuiz(null);
    }
    setScreen("quiz-create");
  };

  const handleJoinSession = async (code: string) => {
    const result = await joinSession(code);
    setActiveSession(result.session);
    setActiveParticipant(result.participant);
    setActiveQuizId(result.session.quizId);
    const quiz = await getQuiz(result.session.quizId).catch(() => null);
    setActiveQuiz(quiz);
    setLatestAnswer(null);
    setParticipantAnswers([]);
    setScreen("waiting-room");
  };

  const handleCreateSession = async () => {
    if (!activeQuizId) {
      throw new Error("No quiz selected");
    }

    const session = await createSession(activeQuizId);
    setActiveSession(session);
    setActiveParticipant(null);
    setScreen("quiz-launch");
  };

  const handleStartSession = async () => {
    if (!activeSession) {
      throw new Error("No active session");
    }

    await startSession(activeSession.id);
    setScreen("organizer-control");
  };

  const refreshParticipants = async (sessionId: string) => {
    const currentParticipants = await getParticipants(sessionId);
    setParticipants(currentParticipants);
    return currentParticipants;
  };

  const handleSubmitAnswer = async (payload: {
    questionId: string;
    selectedOptionIds: string[];
    textAnswer?: string;
  }) => {
    if (!activeParticipant || !activeQuiz || !activeSession) {
      throw new Error("No active quiz session");
    }

    const result = await submitAnswer(
      activeParticipant.id,
      payload.questionId,
      payload.selectedOptionIds,
      payload.textAnswer,
    );

    const question = activeQuiz.questions.find((item) => item.id === payload.questionId);
    const selectedLabels = question
      ? question.options.filter((option) => payload.selectedOptionIds.includes(option.id)).map((option) => option.text)
      : [];

    setLatestAnswer({
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
      totalScore: result.totalScore,
      rank: result.rank,
      questionText: question?.text ?? "",
      correctAnswerText: question ? question.options.filter((option) => option.isCorrect).map((option) => option.text).join(", ") : "",
      answeredText: payload.textAnswer ?? selectedLabels.join(", "),
    });

    const updatedParticipants = await refreshParticipants(activeSession.id).catch(() => null);
    if (updatedParticipants) {
      const updated = updatedParticipants.find((item) => item.id === activeParticipant.id);
      if (updated) {
        setActiveParticipant({
          ...activeParticipant,
          score: updated.score,
          status: updated.status,
          finishedAt: updated.finishedAt,
        });
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!activeSession || !activeQuiz) {
      throw new Error("No active session");
    }

    const result = await nextQuestion(activeSession.id);
    setActiveSession({ ...activeSession, currentQuestionIndex: result.questionIndex });
    setLatestAnswer(null);

    if (result.questionIndex >= activeQuiz.questions.length) {
      setScreen("leaderboard-final");
    } else {
      setScreen("question");
    }
  };

  const handleSaveQuiz = (quiz: QuizWithQuestions) => {
    setActiveQuiz(quiz);
    setActiveQuizId(quiz.id);
    setScreen("quiz-saved");
  };

  const renderScreen = () => {
    if (booting) {
      return (
        <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center text-[#818c99]">
          Загрузка…
        </div>
      );
    }

    if (!authUser && screen !== "login" && screen !== "register") {
      return <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} loading={loginLoading} error={loginError} />;
    }

    switch (screen) {
      case "login": return <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} loading={loginLoading} error={loginError} />;
      case "register": return <RegisterScreen onRegister={handleRegister} onGoLogin={() => setScreen("login")} loading={registerLoading} error={registerError} success={registerSuccess} />;
      case "dashboard": return <DashboardScreen setScreen={setScreen} user={authUser} onLogout={handleLogout} onJoinSession={handleJoinSession} onOpenQuiz={handleOpenQuiz} />;
      case "profile": return <ProfileScreen setScreen={setScreen} user={authUser} onLogout={handleLogout} />;
      case "my-quizzes": return <MyQuizzesScreen setScreen={setScreen} onEditQuiz={handleOpenQuiz} onLaunchQuiz={(quizId) => { setActiveQuizId(quizId); setScreen("quiz-launch"); }} />;
      case "quiz-create": return <QuizCreateScreen setScreen={setScreen} quizId={activeQuizId} onSaved={handleSaveQuiz} />;
      case "quiz-saved": return <QuizSavedScreen setScreen={setScreen} quiz={activeQuiz} onEdit={() => setScreen("quiz-create")} onOpenMyQuizzes={() => setScreen("my-quizzes")} onLaunch={() => setScreen("quiz-launch")} />;
      case "quiz-launch": return <QuizLaunchScreen setScreen={setScreen} quizId={activeQuizId} quiz={activeQuiz} session={activeSession} onCreateSession={handleCreateSession} onStartSession={handleStartSession} />;
      case "waiting-room": return <WaitingRoomScreen setScreen={setScreen} session={activeSession} participant={activeParticipant} quiz={activeQuiz} />;
      case "question": return <QuestionScreen setScreen={setScreen} quiz={activeQuiz} session={activeSession} participant={activeParticipant} onSubmit={handleSubmitAnswer} />;
      case "answer-result": return <AnswerResultScreen setScreen={setScreen} quiz={activeQuiz} session={activeSession} latestAnswer={latestAnswer} onNextQuestion={handleNextQuestion} />;
      case "organizer-control": return <OrganizerControlScreen setScreen={setScreen} session={activeSession} quiz={activeQuiz} />;
      case "leaderboard-mid": return <LeaderboardMidScreen setScreen={setScreen} session={activeSession} participants={participants} />;
      case "leaderboard-final": return <LeaderboardFinalScreen setScreen={setScreen} session={activeSession} quiz={activeQuiz} participants={participants} />;
      case "result-details": return <ResultDetailsScreen setScreen={setScreen} session={activeSession} participant={activeParticipant} />;
      case "analytics": return <AnalyticsScreen setScreen={setScreen} quiz={activeQuiz} participants={participants} session={activeSession} />;
      default: return <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} loading={loginLoading} error={loginError} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {renderScreen()}
    </div>
  );
}
