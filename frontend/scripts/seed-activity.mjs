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

const makeClient = () =>
  createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const password = "Demo12345!";
const owners = [
  "anna.demo@kaida.test",
  "maxim.demo@kaida.test",
  "elena.demo@kaida.test",
];

const players = [
  ["Алексей Морозов", "alexey.player@kaida.test", 0.94],
  ["Мария Кузнецова", "maria.player@kaida.test", 0.90],
  ["Дмитрий Соколов", "dmitry.player@kaida.test", 0.84],
  ["София Попова", "sofia.player@kaida.test", 0.80],
  ["Иван Лебедев", "ivan.player@kaida.test", 0.75],
  ["Полина Новикова", "polina.player@kaida.test", 0.70],
  ["Артём Козлов", "artem.player@kaida.test", 0.66],
  ["Виктория Фёдорова", "victoria.player@kaida.test", 0.61],
  ["Никита Волков", "nikita.player@kaida.test", 0.56],
  ["Дарья Павлова", "daria.player@kaida.test", 0.51],
  ["Михаил Семёнов", "mikhail.player@kaida.test", 0.45],
  ["Екатерина Егорова", "ekaterina.player@kaida.test", 0.38],
];

async function authenticate(client, email, name) {
  let result = await client.auth.signInWithPassword({ email, password });
  if (!result.error) return result.data.user;

  result = await client.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (result.error) throw result.error;
  if (!result.data.session) {
    throw new Error(`Нет сессии для ${email}. Отключите Confirm email в Supabase.`);
  }
  return result.data.user;
}

async function loadQuiz(client, quizId) {
  const { data: questions, error: questionsError } = await client
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("question_order");
  if (questionsError) throw questionsError;

  const { data: options, error: optionsError } = await client
    .from("answer_options")
    .select("*")
    .in("question_id", questions.map((question) => question.id))
    .order("option_order");
  if (optionsError) throw optionsError;

  return questions.map((question) => ({
    ...question,
    options: options.filter((option) => option.question_id === question.id),
  }));
}

function shouldAnswerCorrect(playerIndex, quizIndex, questionIndex, skill) {
  const value = ((playerIndex * 37 + quizIndex * 19 + questionIndex * 29 + 11) % 100) / 100;
  return value < skill;
}

async function joinRoom(client, code) {
  const { data: session, error: sessionError } = await client
    .from("quiz_sessions")
    .select("*")
    .eq("code", code)
    .eq("status", "waiting")
    .single();
  if (sessionError) throw sessionError;

  const { data: userData } = await client.auth.getUser();
  const { data: participant, error: participantError } = await client
    .from("session_participants")
    .upsert(
      {
        session_id: session.id,
        user_id: userData.user.id,
        score: 0,
        status: "joined",
      },
      { onConflict: "session_id,user_id" },
    )
    .select()
    .single();
  if (participantError) throw participantError;
  return participant;
}

async function saveAnswer(client, participant, question, selected) {
  const isCorrect = selected.is_correct;
  const pointsAwarded = isCorrect ? question.points : 0;

  const { error: answerError } = await client.from("participant_answers").insert({
    participant_id: participant.id,
    question_id: question.id,
    selected_option_ids: [selected.id],
    text_answer: null,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
  });
  if (answerError) throw answerError;

  participant.score += pointsAwarded;
  const { error: scoreError } = await client
    .from("session_participants")
    .update({ score: participant.score, status: "playing" })
    .eq("id", participant.id);
  if (scoreError) throw scoreError;
}

const playerClients = [];
for (const [name, email, skill] of players) {
  const client = makeClient();
  await authenticate(client, email, name);
  playerClients.push({ client, name, email, skill });
  process.stdout.write(`Аккаунт готов: ${name}\n`);
}

const roomCodes = [];
let quizIndex = 0;

for (const ownerEmail of owners) {
  const host = makeClient();
  const hostUser = await authenticate(host, ownerEmail, ownerEmail.split("@")[0]);

  const { data: quizzes, error: quizzesError } = await host
    .from("quizzes")
    .select("*")
    .eq("owner_id", hostUser.id)
    .like("title", "[DEMO]%")
    .order("created_at");
  if (quizzesError) throw quizzesError;

  for (const quiz of quizzes) {
    const { data: finishedSessions, error: finishedError } = await host
      .from("quiz_sessions")
      .select("id")
      .eq("quiz_id", quiz.id)
      .eq("status", "finished");
    if (finishedError) throw finishedError;

    let alreadySeeded = false;
    for (const session of finishedSessions ?? []) {
      const { count, error: countError } = await host
        .from("session_participants")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id);
      if (countError) throw countError;
      if ((count ?? 0) >= players.length) alreadySeeded = true;
    }

    if (!alreadySeeded) {
      // Удаляем только незавершённый след предыдущего запуска seed для демо-квиза.
      const { error: cleanupError } = await host
        .from("quiz_sessions")
        .delete()
        .eq("quiz_id", quiz.id)
        .eq("status", "active");
      if (cleanupError) throw cleanupError;

      const { data: historical, error: createError } = await host
        .from("quiz_sessions")
        .insert({
          quiz_id: quiz.id,
          host_id: hostUser.id,
          status: "waiting",
          current_question_index: 0,
        })
        .select()
        .single();
      if (createError) throw createError;

      const participants = [];
      for (const player of playerClients) {
        participants.push(await joinRoom(player.client, historical.code));
      }

      const { error: startError } = await host
        .from("quiz_sessions")
        .update({
          status: "active",
          started_at: new Date(Date.now() - 45 * 60_000).toISOString(),
          current_question_index: 0,
        })
        .eq("id", historical.id);
      if (startError) throw startError;

      const questions = await loadQuiz(host, quiz.id);
      for (const [questionIndex, question] of questions.entries()) {
        const correct = question.options.find((option) => option.is_correct);
        const wrong = question.options.filter((option) => !option.is_correct);

        for (const [playerIndex, player] of playerClients.entries()) {
          const isCorrect = shouldAnswerCorrect(
            playerIndex,
            quizIndex,
            questionIndex,
            player.skill,
          );
          const selected = isCorrect
            ? correct
            : wrong[(playerIndex + quizIndex + questionIndex) % wrong.length];

          await saveAnswer(
            player.client,
            participants[playerIndex],
            question,
            selected,
          );
        }

        const { error: nextError } = await host
          .from("quiz_sessions")
          .update({ current_question_index: questionIndex + 1 })
          .eq("id", historical.id);
        if (nextError) throw nextError;
      }

      const finishedAt = new Date(Date.now() - 5 * 60_000).toISOString();
      const { error: participantsFinishError } = await host
        .from("session_participants")
        .update({ status: "finished", finished_at: finishedAt })
        .eq("session_id", historical.id);
      if (participantsFinishError) throw participantsFinishError;

      const { error: finishError } = await host
        .from("quiz_sessions")
        .update({ status: "finished", finished_at: finishedAt })
        .eq("id", historical.id);
      if (finishError) throw finishError;

      process.stdout.write(`Статистика создана: ${quiz.title}\n`);
    } else {
      process.stdout.write(`Статистика уже существует: ${quiz.title}\n`);
    }

    const { data: waitingSessions, error: waitingError } = await host
      .from("quiz_sessions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(1);
    if (waitingError) throw waitingError;

    let room = waitingSessions?.[0];
    if (!room) {
      const { data, error } = await host
        .from("quiz_sessions")
        .insert({
          quiz_id: quiz.id,
          host_id: hostUser.id,
          status: "waiting",
          current_question_index: 0,
        })
        .select()
        .single();
      if (error) throw error;
      room = data;
    }

    roomCodes.push([quiz.title.replace("[DEMO] ", ""), room.code, ownerEmail]);
    quizIndex += 1;
  }
}

process.stdout.write("\nКОМНАТЫ\n");
for (const [title, code] of roomCodes) {
  process.stdout.write(`${code} — ${title}\n`);
}

for (const player of playerClients) await player.client.auth.signOut();
process.stdout.write("\nИстория, статистика и комнаты готовы.\n");
