import { supabase } from "./supabase";

// ============================================================
// TYPES
// ============================================================

export type QuestionType =
  | "single"
  | "multiple"
  | "truefalse"
  | "text";

export type SessionStatus =
  | "waiting"
  | "active"
  | "finished";

export type ParticipantStatus =
  | "joined"
  | "playing"
  | "finished";

// ============================================================
// USER
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;

  quizzesPlayed: number;
  quizzesCreated: number;
}

// ============================================================
// QUIZ
// ============================================================

export interface Quiz {
  id: string;
  ownerId: string;

  title: string;
  description?: string;
  coverUrl?: string;

  shuffleQuestions: boolean;
  defaultTimeSec: number;

  createdAt: string;
}

export interface AnswerOption {
  id: string;
  questionId: string;

  text: string;
  isCorrect: boolean;

  order: number;
}

export interface Question {
  id: string;
  quizId: string;

  type: QuestionType;

  text: string;
  imageUrl?: string;

  points: number;
  timeSec: number;

  order: number;
}

export interface QuestionWithOptions extends Question {
  options: AnswerOption[];
}

export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[];

  attemptCount: number;
}

// ============================================================
// INPUT TYPES
// ============================================================

export interface CreateAnswerOptionInput {
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionInput {
  type: QuestionType;

  text: string;

  imageUrl?: string;

  points: number;
  timeSec: number;

  options?: CreateAnswerOptionInput[];
}

export interface CreateQuizInput {
  title: string;

  description?: string;

  coverUrl?: string;

  shuffleQuestions?: boolean;

  defaultTimeSec?: number;

  questions?: CreateQuestionInput[];
}

// ============================================================
// SESSION
// ============================================================

export interface QuizSession {
  id: string;

  quizId: string;
  hostId: string;

  code: string;

  status: SessionStatus;

  currentQuestionIndex: number;

  createdAt: string;

  startedAt?: string;
  finishedAt?: string;
}

export interface SessionParticipant {
  id: string;

  sessionId: string;
  userId: string;

  score: number;

  status: ParticipantStatus;

  joinedAt: string;

  finishedAt?: string;
}

export interface ParticipantDTO extends SessionParticipant {
  name: string;
  rank: number;
}

// ============================================================
// ANSWERS
// ============================================================

export interface ParticipantAnswer {
  id: string;

  participantId: string;
  questionId: string;

  selectedOptionIds: string[];

  textAnswer?: string;

  isCorrect: boolean;

  pointsAwarded: number;

  answeredAt: string;
}

// ============================================================
// HELPERS
// ============================================================

function mapQuiz(row: any): Quiz {
  return {
    id: row.id,

    ownerId: row.owner_id,

    title: row.title,

    description: row.description ?? undefined,

    coverUrl: row.cover_url ?? undefined,

    shuffleQuestions: row.shuffle_questions,

    defaultTimeSec: row.default_time_sec,

    createdAt: row.created_at,
  };
}

function mapQuestion(row: any): Question {
  return {
    id: row.id,

    quizId: row.quiz_id,

    type: row.type,

    text: row.text,

    imageUrl: row.image_url ?? undefined,

    points: row.points,

    timeSec: row.time_sec,

    order: row.question_order,
  };
}

function mapOption(row: any): AnswerOption {
  return {
    id: row.id,

    questionId: row.question_id,

    text: row.text,

    isCorrect: row.is_correct,

    order: row.option_order,
  };
}

function mapSession(row: any): QuizSession {
  return {
    id: row.id,

    quizId: row.quiz_id,
    hostId: row.host_id,

    code: row.code,

    status: row.status,

    currentQuestionIndex: row.current_question_index,

    createdAt: row.created_at,

    startedAt: row.started_at ?? undefined,

    finishedAt: row.finished_at ?? undefined,
  };
}

// ============================================================
// AUTH
// ============================================================

/**
 * REGISTER
 *
 * Пользователь вводит:
 * name
 * email
 * password
 *
 * Supabase Auth хранит email/password.
 * Наш trigger автоматически создаёт строку profiles.
 */
export async function register(
  name: string,
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signUp({
      email: email.trim().toLowerCase(),

      password,

      options: {
        data: {
          name,
        },
      },
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * LOGIN
 */
export async function login(
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * LOGOUT
 */
export async function logout(): Promise<void> {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Получить пользователя Supabase Auth
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

/**
 * PROFILE
 */
export async function getMe(): Promise<UserProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (profileError) {
    throw profileError;
  }

  const {
    count: createdCount,
    error: createdError,
  } = await supabase
    .from("quizzes")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("owner_id", user.id);

  if (createdError) {
    throw createdError;
  }

  const {
    count: playedCount,
    error: playedError,
  } = await supabase
    .from("session_participants")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id);

  if (playedError) {
    throw playedError;
  }

  return {
    id: user.id,

    name: profile.name,

    email: user.email ?? "",

    createdAt:
      profile.created_at ??
      user.created_at,

    quizzesPlayed:
      playedCount ?? 0,

    quizzesCreated:
      createdCount ?? 0,
  };
}

// ============================================================
// QUIZZES
// ============================================================

/**
 * Получить мои квизы
 */
export async function getMyQuizzes(): Promise<QuizWithQuestions[]> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data, error } =
    await supabase
      .from("quizzes")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  const result: QuizWithQuestions[] = [];

  for (const row of data ?? []) {
    const fullQuiz =
      await getQuiz(row.id);

    result.push(fullQuiz);
  }

  return result;
}

/**
 * Получить конкретный квиз
 */
export async function getQuiz(
  quizId: string,
): Promise<QuizWithQuestions> {
  const { data: quizRow, error: quizError } =
    await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

  if (quizError) {
    throw quizError;
  }

  const { data: questionRows, error: questionError } =
    await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("question_order", {
        ascending: true,
      });

  if (questionError) {
    throw questionError;
  }

  const questionIds =
    (questionRows ?? []).map(
      (question) => question.id,
    );

  let optionRows: any[] = [];

  if (questionIds.length > 0) {
    const { data, error } =
      await supabase
        .from("answer_options")
        .select("*")
        .in(
          "question_id",
          questionIds,
        )
        .order("option_order", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    optionRows = data ?? [];
  }

  const questions: QuestionWithOptions[] =
    (questionRows ?? []).map((row) => ({
      ...mapQuestion(row),

      options: optionRows
        .filter(
          (option) =>
            option.question_id === row.id,
        )
        .map(mapOption),
    }));

  const {
    count: attemptCount,
    error: attemptsError,
  } = await supabase
    .from("quiz_sessions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("quiz_id", quizId)
    .eq("status", "finished");

  if (attemptsError) {
    throw attemptsError;
  }

  return {
    ...mapQuiz(quizRow),

    questions,

    attemptCount:
      attemptCount ?? 0,
  };
}

/**
 * CREATE QUIZ
 */
export async function createQuiz(
  input: CreateQuizInput,
): Promise<QuizWithQuestions> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data: quizRow, error: quizError } =
    await supabase
      .from("quizzes")
      .insert({
        owner_id: user.id,

        title: input.title,

        description:
          input.description || null,

        cover_url:
          input.coverUrl || null,

        shuffle_questions:
          input.shuffleQuestions ??
          false,

        default_time_sec:
          input.defaultTimeSec ??
          30,
      })
      .select()
      .single();

  if (quizError) {
    throw quizError;
  }

  try {
    if (input.questions) {
      for (
        let questionIndex = 0;
        questionIndex <
        input.questions.length;
        questionIndex++
      ) {
        const question =
          input.questions[
            questionIndex
          ];

        const {
          data: questionRow,
          error: questionError,
        } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizRow.id,

            type: question.type,

            text: question.text,

            image_url:
              question.imageUrl ||
              null,

            points:
              question.points,

            time_sec:
              question.timeSec,

            question_order:
              questionIndex,
          })
          .select()
          .single();

        if (questionError) {
          throw questionError;
        }

        if (
          question.options &&
          question.options.length > 0
        ) {
          const optionRows =
            question.options.map(
              (option, index) => ({
                question_id:
                  questionRow.id,

                text:
                  option.text,

                is_correct:
                  option.isCorrect,

                option_order:
                  index,
              }),
            );

          const {
            error: optionsError,
          } = await supabase
            .from("answer_options")
            .insert(optionRows);

          if (optionsError) {
            throw optionsError;
          }
        }
      }
    }
  } catch (error) {
    // Если создание вопросов упало,
    // удаляем недоделанный квиз.

    await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizRow.id);

    throw error;
  }

  return getQuiz(
    quizRow.id,
  );
}

/**
 * UPDATE QUIZ
 *
 * Для MVP:
 * старые вопросы удаляются
 * и создаются заново.
 */
export async function updateQuiz(
  quizId: string,
  input: CreateQuizInput,
): Promise<QuizWithQuestions> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { error: quizError } =
    await supabase
      .from("quizzes")
      .update({
        title: input.title,

        description:
          input.description || null,

        cover_url:
          input.coverUrl || null,

        shuffle_questions:
          input.shuffleQuestions ??
          false,

        default_time_sec:
          input.defaultTimeSec ??
          30,
      })
      .eq("id", quizId)
      .eq("owner_id", user.id);

  if (quizError) {
    throw quizError;
  }

  if (input.questions) {
    // CASCADE удалит answer_options

    const { error: deleteError } =
      await supabase
        .from("questions")
        .delete()
        .eq(
          "quiz_id",
          quizId,
        );

    if (deleteError) {
      throw deleteError;
    }

    for (
      let i = 0;
      i <
      input.questions.length;
      i++
    ) {
      const question =
        input.questions[i];

      const {
        data: questionRow,
        error: questionError,
      } = await supabase
        .from("questions")
        .insert({
          quiz_id: quizId,

          type:
            question.type,

          text:
            question.text,

          image_url:
            question.imageUrl ||
            null,

          points:
            question.points,

          time_sec:
            question.timeSec,

          question_order:
            i,
        })
        .select()
        .single();

      if (questionError) {
        throw questionError;
      }

      if (
        question.options &&
        question.options.length > 0
      ) {
        const rows =
          question.options.map(
            (option, index) => ({
              question_id:
                questionRow.id,

              text:
                option.text,

              is_correct:
                option.isCorrect,

              option_order:
                index,
            }),
          );

        const { error } =
          await supabase
            .from(
              "answer_options",
            )
            .insert(rows);

        if (error) {
          throw error;
        }
      }
    }
  }

  return getQuiz(
    quizId,
  );
}

/**
 * DELETE QUIZ
 */
export async function deleteQuiz(
  quizId: string,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { error } =
    await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq(
        "owner_id",
        user.id,
      );

  if (error) {
    throw error;
  }
}

/**
 * DUPLICATE QUIZ
 */
export async function duplicateQuiz(
  quizId: string,
): Promise<QuizWithQuestions> {
  const original =
    await getQuiz(quizId);

  return createQuiz({
    title:
      `${original.title} (copy)`,

    description:
      original.description,

    coverUrl:
      original.coverUrl,

    shuffleQuestions:
      original.shuffleQuestions,

    defaultTimeSec:
      original.defaultTimeSec,

    questions:
      original.questions.map(
        (question) => ({
          type:
            question.type,

          text:
            question.text,

          imageUrl:
            question.imageUrl,

          points:
            question.points,

          timeSec:
            question.timeSec,

          options:
            question.options.map(
              (option) => ({
                text:
                  option.text,

                isCorrect:
                  option.isCorrect,
              }),
            ),
        }),
      ),
  });
}

// ============================================================
// IMAGES
// ============================================================

/**
 * Требует Supabase Storage bucket:
 *
 * quiz-images
 */
export async function uploadImage(
  file: File,
): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const extension =
    file.name
      .split(".")
      .pop() || "jpg";

  const path =
    `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } =
    await supabase.storage
      .from("quiz-images")
      .upload(
        path,
        file,
      );

  if (error) {
    throw error;
  }

  const { data } =
    supabase.storage
      .from("quiz-images")
      .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================================
// QUIZ SESSIONS
// ============================================================

/**
 * START / CREATE LOBBY
 *
 * code автоматически создаёт PostgreSQL.
 */
export async function createSession(
  quizId: string,
): Promise<QuizSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data, error } =
    await supabase
      .from("quiz_sessions")
      .insert({
        quiz_id:
          quizId,

        host_id:
          user.id,

        status:
          "waiting",

        current_question_index:
          0,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return mapSession(data);
}

/**
 * JOIN BY 6-DIGIT CODE
 */
export async function joinSession(
  code: string,
): Promise<{
  session: QuizSession;
  participant: SessionParticipant;
}> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const {
    data: sessionRow,
    error: sessionError,
  } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq(
      "code",
      code,
    )
    .eq(
      "status",
      "waiting",
    )
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const {
    data: participantRow,
    error: participantError,
  } = await supabase
    .from(
      "session_participants",
    )
    .upsert(
      {
        session_id:
          sessionRow.id,

        user_id:
          user.id,

        score: 0,

        status:
          "joined",
      },
      {
        onConflict:
          "session_id,user_id",
      },
    )
    .select()
    .single();

  if (participantError) {
    throw participantError;
  }

  return {
    session:
      mapSession(
        sessionRow,
      ),

    participant: {
      id:
        participantRow.id,

      sessionId:
        participantRow.session_id,

      userId:
        participantRow.user_id,

      score:
        participantRow.score,

      status:
        participantRow.status,

      joinedAt:
        participantRow.joined_at,

      finishedAt:
        participantRow.finished_at ??
        undefined,
    },
  };
}

/**
 * PARTICIPANTS
 */
export async function getParticipants(
  sessionId: string,
): Promise<ParticipantDTO[]> {
  const { data, error } =
    await supabase
      .from(
        "session_participants",
      )
      .select("*")
      .eq(
        "session_id",
        sessionId,
      );

  if (error) {
    throw error;
  }

  const participants =
    data ?? [];

  const userIds =
    participants.map(
      (participant) =>
        participant.user_id,
    );

  let profiles: any[] = [];

  if (userIds.length > 0) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id,name")
      .in(
        "id",
        userIds,
      );

    if (profileError) {
      throw profileError;
    }

    profiles =
      profileData ?? [];
  }

  const sorted =
    [...participants].sort(
      (a, b) =>
        b.score -
        a.score,
    );

  return sorted.map(
    (
      participant,
      index,
    ) => {
      const profile =
        profiles.find(
          (profile) =>
            profile.id ===
            participant.user_id,
        );

      return {
        id:
          participant.id,

        sessionId:
          participant.session_id,

        userId:
          participant.user_id,

        name:
          profile?.name ??
          "User",

        score:
          participant.score,

        status:
          participant.status,

        joinedAt:
          participant.joined_at,

        finishedAt:
          participant.finished_at ??
          undefined,

        rank:
          index + 1,
      };
    },
  );
}

/**
 * HOST: KICK PARTICIPANT
 */
export async function kickParticipant(
  sessionId: string,
  userId: string,
): Promise<void> {
  const { error } =
    await supabase
      .from(
        "session_participants",
      )
      .delete()
      .eq(
        "session_id",
        sessionId,
      )
      .eq(
        "user_id",
        userId,
      );

  if (error) {
    throw error;
  }
}

/**
 * HOST: START QUIZ
 */
export async function startSession(
  sessionId: string,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { error } =
    await supabase
      .from("quiz_sessions")
      .update({
        status:
          "active",

        started_at:
          new Date().toISOString(),

        current_question_index:
          0,
      })
      .eq(
        "id",
        sessionId,
      )
      .eq(
        "host_id",
        user.id,
      );

  if (error) {
    throw error;
  }
}

/**
 * HOST: NEXT QUESTION
 */
export async function nextQuestion(
  sessionId: string,
): Promise<{
  questionIndex: number;
}> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const {
    data: session,
    error: getError,
  } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq(
      "id",
      sessionId,
    )
    .single();

  if (getError) {
    throw getError;
  }

  if (
    session.host_id !==
    user.id
  ) {
    throw new Error(
      "Only host can change question",
    );
  }

  const nextIndex =
    session.current_question_index +
    1;

  const { error } =
    await supabase
      .from("quiz_sessions")
      .update({
        current_question_index:
          nextIndex,
      })
      .eq(
        "id",
        sessionId,
      );

  if (error) {
    throw error;
  }

  return {
    questionIndex:
      nextIndex,
  };
}

/**
 * HOST: FINISH SESSION
 */
export async function finishSession(
  sessionId: string,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { error } =
    await supabase
      .from("quiz_sessions")
      .update({
        status:
          "finished",

        finished_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        sessionId,
      )
      .eq(
        "host_id",
        user.id,
      );

  if (error) {
    throw error;
  }
}

// ============================================================
// REALTIME
// ============================================================

/**
 * Следить за изменениями lobby/session.
 *
 * Например:
 *
 * const unsubscribe = subscribeToSession(id, () => {
 *    loadParticipants()
 * })
 *
 * при закрытии компонента:
 *
 * unsubscribe()
 */
export function subscribeToSession(
  sessionId: string,
  callback: () => void,
) {
  const channel =
    supabase
      .channel(
        `session-${sessionId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",

          schema:
            "public",

          table:
            "quiz_sessions",

          filter:
            `id=eq.${sessionId}`,
        },

        callback,
      )
      .on(
        "postgres_changes",
        {
          event: "*",

          schema:
            "public",

          table:
            "session_participants",

          filter:
            `session_id=eq.${sessionId}`,
        },

        callback,
      )
      .subscribe();

  return () => {
    supabase.removeChannel(
      channel,
    );
  };
}

// ============================================================
// ANSWERS
// ============================================================

/**
 * ВАЖНО
 *
 * Проверять правильность ответа прямо в React нельзя.
 *
 * Иначе пользователь сможет открыть DevTools
 * и увидеть правильные ответы.
 *
 * Поэтому позже мы создадим PostgreSQL RPC:
 *
 * submit_quiz_answer(...)
 *
 * Эта функция уже подготовлена под него.
 */
export async function submitAnswer(
  participantId: string,

  questionId: string,

  selectedOptionIds: string[],

  textAnswer?: string,
): Promise<{
  isCorrect: boolean;

  pointsAwarded: number;

  totalScore: number;

  rank: number;
}> {
  const { data, error } =
    await supabase.rpc(
      "submit_quiz_answer",
      {
        p_participant_id:
          participantId,

        p_question_id:
          questionId,

        p_selected_option_ids:
          selectedOptionIds,

        p_text_answer:
          textAnswer ?? null,
      },
    );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No answer result returned",
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  return {
    isCorrect:
      result.is_correct,

    pointsAwarded:
      result.points_awarded,

    totalScore:
      result.total_score,

    rank:
      result.rank,
  };
}

// ============================================================
// HISTORY
// ============================================================

export interface HistoryItem {
  sessionId: string;

  quizTitle: string;

  playedAt: string;

  score: number;

  rank: number;
}

/**
 * История участия пользователя.
 *
 * Пока простая версия.
 */
export async function getMyHistory(): Promise<HistoryItem[]> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const {
    data: participationRows,
    error,
  } = await supabase
    .from(
      "session_participants",
    )
    .select("*")
    .eq(
      "user_id",
      user.id,
    )
    .order(
      "joined_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  const result: HistoryItem[] =
    [];

  for (
    const participation of
    participationRows ?? []
  ) {
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq(
        "id",
        participation.session_id,
      )
      .single();

    if (sessionError) {
      throw sessionError;
    }

    const {
      data: quiz,
      error: quizError,
    } = await supabase
      .from("quizzes")
      .select(
        "id,title",
      )
      .eq(
        "id",
        session.quiz_id,
      )
      .single();

    if (quizError) {
      // Пока пользователь может не иметь
      // RLS-доступа к чужому quiz.
      continue;
    }

    const participants =
      await getParticipants(
        session.id,
      );

    const me =
      participants.find(
        (item) =>
          item.userId ===
          user.id,
      );

    result.push({
      sessionId:
        session.id,

      quizTitle:
        quiz.title,

      playedAt:
        participation.finished_at ??
        participation.joined_at,

      score:
        participation.score,

      rank:
        me?.rank ?? 0,
    });
  }

  return result;
}

export interface ParticipantAnswerDetail extends ParticipantAnswer {
  questionText: string;
  correctAnswerText: string;
}

export async function getParticipantAnswers(
  participantId: string,
): Promise<ParticipantAnswerDetail[]> {
  const { data: answerRows, error: answerError } = await supabase
    .from("participant_answers")
    .select("*")
    .eq("participant_id", participantId)
    .order("answered_at", { ascending: false });

  if (answerError) {
    throw answerError;
  }

  const questionIds = (answerRows ?? []).map((row) => row.question_id);
  let questionRows: any[] = [];
  let optionRows: any[] = [];

  if (questionIds.length > 0) {
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .in("id", questionIds);

    if (questionsError) {
      throw questionsError;
    }

    questionRows = questionsData ?? [];

    const { data: optionsData, error: optionsError } = await supabase
      .from("answer_options")
      .select("*")
      .in("question_id", questionIds)
      .order("option_order", { ascending: true });

    if (optionsError) {
      throw optionsError;
    }

    optionRows = optionsData ?? [];
  }

  return (answerRows ?? []).map((row) => {
    const question = questionRows.find((item) => item.id === row.question_id);
    const options = optionRows.filter((item) => item.question_id === row.question_id);
    const correctOptions = options.filter((item) => item.is_correct).map((item) => item.text);

    return {
      id: row.id,
      participantId: row.participant_id,
      questionId: row.question_id,
      selectedOptionIds: row.selected_option_ids ?? [],
      textAnswer: row.text_answer ?? undefined,
      isCorrect: row.is_correct,
      pointsAwarded: row.points_awarded,
      answeredAt: row.answered_at,
      questionText: question?.text ?? "",
      correctAnswerText: correctOptions.join(", ") || question?.text || "",
    };
  });
}
