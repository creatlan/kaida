import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
);

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

const password = "Demo12345!";

const users = [
  {
    name: "Анна Смирнова",
    email: "anna.demo@kaida.test",
    quizzes: [
      {
        title: "[DEMO] Основы JavaScript",
        description: "Небольшой квиз по базовым конструкциям JavaScript.",
        questions: [
          ["Как объявить неизменяемую ссылку?", ["const", "let", "var", "static"], 0],
          ["Что вернёт typeof []?", ["array", "object", "list", "undefined"], 1],
          ["Какой оператор сравнивает без приведения типов?", ["==", "=", "===", "!="], 2],
        ],
      },
      {
        title: "[DEMO] Столицы мира",
        description: "Проверка знаний географии.",
        questions: [
          ["Столица Австралии?", ["Сидней", "Канберра", "Мельбурн", "Перт"], 1],
          ["Столица Канады?", ["Торонто", "Ванкувер", "Оттава", "Монреаль"], 2],
          ["Столица Японии?", ["Осака", "Киото", "Токио", "Нагоя"], 2],
        ],
      },
    ],
  },
  {
    name: "Максим Орлов",
    email: "maxim.demo@kaida.test",
    quizzes: [
      {
        title: "[DEMO] Космос",
        description: "Планеты и космические факты.",
        questions: [
          ["Какая планета ближе всего к Солнцу?", ["Венера", "Марс", "Меркурий", "Земля"], 2],
          ["Самая большая планета Солнечной системы?", ["Сатурн", "Юпитер", "Нептун", "Земля"], 1],
          ["Естественный спутник Земли?", ["Луна", "Фобос", "Европа", "Титан"], 0],
        ],
      },
      {
        title: "[DEMO] Кино и мультфильмы",
        description: "Лёгкий развлекательный квиз.",
        questions: [
          ["Кто живёт в ананасе под водой?", ["Шрек", "Спанч Боб", "Симба", "Стич"], 1],
          ["Как зовут снеговика из «Холодного сердца»?", ["Олаф", "Свен", "Кристофф", "Ханс"], 0],
          ["Какой цвет таблетки выбирает Нео?", ["Синий", "Красный", "Зелёный", "Белый"], 1],
        ],
      },
    ],
  },
  {
    name: "Елена Волкова",
    email: "elena.demo@kaida.test",
    quizzes: [
      {
        title: "[DEMO] Английский: Beginner",
        description: "Простые слова и выражения.",
        questions: [
          ["Перевод слова «apple»?", ["Апельсин", "Яблоко", "Груша", "Слива"], 1],
          ["Выберите форму: I ___ a student.", ["is", "are", "am", "be"], 2],
          ["Противоположное слову «big»?", ["long", "small", "fast", "high"], 1],
        ],
      },
      {
        title: "[DEMO] Математика без калькулятора",
        description: "Три быстрых задачи.",
        questions: [
          ["Сколько будет 12 × 8?", ["86", "92", "96", "108"], 2],
          ["Корень из 144?", ["10", "11", "12", "14"], 2],
          ["25% от 200?", ["25", "40", "50", "75"], 2],
        ],
      },
    ],
  },
];

async function authenticate(user) {
  let result = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (!result.error) return result.data.user;

  result = await supabase.auth.signUp({
    email: user.email,
    password,
    options: { data: { name: user.name } },
  });

  if (result.error) throw result.error;
  if (!result.data.session) {
    throw new Error(
      `Для ${user.email} не создана сессия. Отключите Confirm email в Supabase и повторите запуск.`,
    );
  }

  return result.data.user;
}

async function createQuiz(userId, quiz) {
  const { data: existing, error: findError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("owner_id", userId)
    .eq("title", quiz.title)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return "уже существует";

  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      owner_id: userId,
      title: quiz.title,
      description: quiz.description,
      shuffle_questions: false,
      default_time_sec: 30,
    })
    .select("id")
    .single();

  if (quizError) throw quizError;

  for (const [index, [text, options, correct]] of quiz.questions.entries()) {
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        quiz_id: quizRow.id,
        type: "single",
        text,
        points: 100,
        time_sec: 30,
        question_order: index,
      })
      .select("id")
      .single();

    if (questionError) throw questionError;

    const { error: optionError } = await supabase.from("answer_options").insert(
      options.map((option, optionIndex) => ({
        question_id: question.id,
        text: option,
        is_correct: optionIndex === correct,
        option_order: optionIndex,
      })),
    );

    if (optionError) throw optionError;
  }

  return "создан";
}

for (const user of users) {
  const authUser = await authenticate(user);
  process.stdout.write(`\n${user.name} (${user.email})\n`);

  for (const quiz of user.quizzes) {
    const status = await createQuiz(authUser.id, quiz);
    process.stdout.write(`  ${status}: ${quiz.title}\n`);
  }
}

await supabase.auth.signOut();
process.stdout.write("\nДемо-данные готовы.\n");
