/**
 * db.ts — типы данных и заглушки всех запросов к базе данных.
 *
 * Схема БД (таблицы PostgreSQL):
 *   users
 *   quizzes
 *   questions
 *   answer_options
 *   quiz_sessions          ← Room + Session объединены
 *   session_participants
 *   participant_answers
 *
 * Типы ниже — это DTO для фронтенда (данные, собранные JOIN-запросами).
 * Массивы вроде `options`, `answers` — не колонки в БД, а результат JOIN.
 */

// ─── Таблица: users ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;    // хранится в БД, на фронтенд не отдаётся
  createdAt: string;
}

// DTO для фронтенда — без passwordHash, с вычисляемыми полями
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  quizzesPlayed: number;   // COUNT из session_participants
  quizzesCreated: number;  // COUNT из quizzes
}

// ─── Таблица: quizzes ─────────────────────────────────────────────────────────

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

// DTO: квиз + вопросы (собирается JOIN-запросом)
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[];
  attemptCount: number;    // COUNT из quiz_sessions WHERE status='finished'
}

// ─── Таблица: questions ───────────────────────────────────────────────────────

export type QuestionType = "single" | "multiple" | "truefalse" | "text" | "image";

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

// ─── Таблица: answer_options ──────────────────────────────────────────────────
//
// Отдельная таблица вместо массива в questions.
// Фронтенд всегда работает с optionId, а не с индексом 0/1/2.

export interface AnswerOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

// DTO: вопрос + варианты ответа
export interface QuestionWithOptions extends Question {
  options: AnswerOption[];
}

// ─── Таблица: quiz_sessions (бывшие Room + Session) ──────────────────────────
//
// Room — только UI-термин. В БД одна таблица quiz_sessions.

export interface QuizSession {
  id: string;
  quizId: string;
  hostId: string;
  code: string;                      // 6-значный код для участников
  status: "waiting" | "active" | "finished";
  currentQuestionIndex: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// ─── Таблица: session_participants ────────────────────────────────────────────
//
// rank не хранится — вычисляется ORDER BY score DESC при каждом запросе.
// status отражает, завершил ли участник квиз (нужно для completionRate).

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  score: number;
  status: "joined" | "playing" | "finished";
  joinedAt: string;
  finishedAt?: string;
}

// DTO: участник с именем и вычисленным rank
export interface ParticipantDTO {
  id: string;
  sessionId: string;
  userId: string;
  name: string;
  score: number;
  rank: number;            // вычисляется: ROW_NUMBER() OVER (ORDER BY score DESC)
  status: SessionParticipant["status"];
}

// ─── Таблица: participant_answers ─────────────────────────────────────────────
//
// selectedOptionIds — массив UUID из answer_options (не индексы!).
// Для type='text' selectedOptionIds пустой, заполняется textAnswer.

export interface ParticipantAnswer {
  id: string;
  participantId: string;
  questionId: string;
  selectedOptionIds: string[];  // [] для текстовых вопросов
  textAnswer?: string;
  isCorrect: boolean;
  pointsAwarded: number;
  answeredAt: string;
}

// ─── Аналитика (DTO, собирается JOIN-запросами) ───────────────────────────────

export interface QuestionStat {
  questionId: string;
  text: string;
  wrongPct: number;
  distribution: {
    optionId: string;
    label: string;
    count: number;
    pct: number;
    isCorrect: boolean;
  }[];
}

export interface AnalyticsDTO {
  sessionId: string;
  quizId: string;
  totalParticipants: number;
  avgScore: number;
  avgCorrectPct: number;
  completionRate: number;          // finished / total participants
  questionStats: QuestionStat[];
  leaderboard: {
    userId: string;
    name: string;
    score: number;
    correctCount: number;
    correctPct: number;
  }[];
}

// ─── Авторизация ──────────────────────────────────────────────────────────────

/**
 * Войти по email + пароль.
 * SQL:
 *   SELECT id, name, email, created_at FROM users
 *   WHERE email = $1 AND password_hash = crypt($2, password_hash)
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: UserProfile }> {
  throw new Error("not implemented");
}

/**
 * Зарегистрироваться.
 * SQL:
 *   INSERT INTO users (name, email, password_hash, created_at)
 *   VALUES ($1, $2, crypt($3, gen_salt('bf')), NOW())
 *   RETURNING id, name, email, created_at
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ token: string; user: UserProfile }> {
  throw new Error("not implemented");
}

/**
 * Получить текущего пользователя по JWT.
 * SQL:
 *   SELECT u.id, u.name, u.email, u.created_at,
 *     (SELECT COUNT(*) FROM session_participants WHERE user_id = u.id) AS quizzes_played,
 *     (SELECT COUNT(*) FROM quizzes WHERE owner_id = u.id)             AS quizzes_created
 *   FROM users u WHERE u.id = $current_user_id
 */
export async function getMe(): Promise<UserProfile> {
  throw new Error("not implemented");
}

// ─── Квизы ────────────────────────────────────────────────────────────────────

/**
 * Квизы текущего пользователя.
 * SQL:
 *   SELECT q.*,
 *     COUNT(s.id) FILTER (WHERE s.status = 'finished') AS attempt_count
 *   FROM quizzes q
 *   LEFT JOIN quiz_sessions s ON s.quiz_id = q.id
 *   WHERE q.owner_id = $current_user_id
 *   GROUP BY q.id ORDER BY q.created_at DESC
 */
export async function getMyQuizzes(): Promise<QuizWithQuestions[]> {
  throw new Error("not implemented");
}

/**
 * Один квиз с вопросами и вариантами.
 * SQL:
 *   SELECT * FROM quizzes WHERE id = $1;
 *   SELECT q.*, ao.id, ao.text, ao.is_correct, ao.order
 *   FROM questions q
 *   JOIN answer_options ao ON ao.question_id = q.id
 *   WHERE q.quiz_id = $1
 *   ORDER BY q.order, ao.order
 */
export async function getQuiz(quizId: string): Promise<QuizWithQuestions> {
  throw new Error("not implemented");
}

/**
 * Создать квиз (транзакция: quizzes + questions + answer_options).
 * SQL:
 *   BEGIN;
 *   INSERT INTO quizzes (...) VALUES (...) RETURNING id;
 *   INSERT INTO questions (quiz_id, type, text, image_url, points, time_sec, "order") VALUES ...;
 *   INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES ...;
 *   COMMIT;
 */
export async function createQuiz(
  data: Omit<QuizWithQuestions, "id" | "attemptCount" | "createdAt">,
): Promise<QuizWithQuestions> {
  throw new Error("not implemented");
}

/**
 * Обновить квиз (транзакция: обновить quizzes, пересоздать questions + answer_options).
 * SQL:
 *   UPDATE quizzes SET title=$2, ... WHERE id=$1 AND owner_id=$current_user_id;
 *   DELETE FROM questions WHERE quiz_id=$1;  -- CASCADE удалит answer_options
 *   INSERT INTO questions ... ; INSERT INTO answer_options ...;
 */
export async function updateQuiz(
  quizId: string,
  data: Partial<Omit<QuizWithQuestions, "id" | "createdAt">>,
): Promise<QuizWithQuestions> {
  throw new Error("not implemented");
}

/**
 * Удалить квиз (CASCADE удалит questions, answer_options, sessions, answers).
 * SQL:
 *   DELETE FROM quizzes WHERE id=$1 AND owner_id=$current_user_id
 */
export async function deleteQuiz(quizId: string): Promise<void> {
  throw new Error("not implemented");
}

/**
 * Дублировать квиз.
 * SQL (транзакция):
 *   INSERT INTO quizzes SELECT gen_random_uuid(), $current_user_id, title||' (копия)', ...
 *   FROM quizzes WHERE id=$1;
 *   INSERT INTO questions SELECT gen_random_uuid(), $new_quiz_id, ... FROM questions WHERE quiz_id=$1;
 *   INSERT INTO answer_options SELECT gen_random_uuid(), $new_question_id, ...
 *   FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE quiz_id=$1);
 */
export async function duplicateQuiz(quizId: string): Promise<QuizWithQuestions> {
  throw new Error("not implemented");
}

// ─── Загрузка изображений ─────────────────────────────────────────────────────

/**
 * Загрузить изображение вопроса в Supabase Storage.
 * supabase.storage.from('quiz-images').upload(`questions/${uuid}`, file)
 * Вернуть publicUrl.
 */
export async function uploadImage(file: File): Promise<string> {
  throw new Error("not implemented");
}

// ─── Сессии (quiz_sessions) ───────────────────────────────────────────────────

/**
 * Организатор создаёт сессию.
 * SQL:
 *   INSERT INTO quiz_sessions (quiz_id, host_id, code, status, current_question_index, created_at)
 *   VALUES ($1, $current_user_id, LPAD(FLOOR(RANDOM()*1000000)::TEXT, 6, '0'), 'waiting', 0, NOW())
 *   RETURNING *
 */
export async function createSession(quizId: string): Promise<QuizSession> {
  throw new Error("not implemented");
}

/**
 * Участник вступает по коду.
 * SQL:
 *   SELECT s.*, q.title AS quiz_title
 *   FROM quiz_sessions s JOIN quizzes q ON q.id = s.quiz_id
 *   WHERE s.code = $1 AND s.status = 'waiting';
 *
 *   INSERT INTO session_participants (session_id, user_id, score, status, joined_at)
 *   VALUES ($session_id, $current_user_id, 0, 'joined', NOW())
 *   RETURNING *
 */
export async function joinSession(
  code: string,
): Promise<{ session: QuizSession; quizTitle: string; participant: SessionParticipant }> {
  throw new Error("not implemented");
}

/**
 * Список участников с вычисленным rank.
 * SQL:
 *   SELECT sp.*, u.name,
 *     ROW_NUMBER() OVER (ORDER BY sp.score DESC) AS rank
 *   FROM session_participants sp
 *   JOIN users u ON u.id = sp.user_id
 *   WHERE sp.session_id = $1
 */
export async function getParticipants(sessionId: string): Promise<ParticipantDTO[]> {
  throw new Error("not implemented");
}

/**
 * Кикнуть участника.
 * SQL:
 *   DELETE FROM session_participants
 *   WHERE session_id=$1 AND user_id=$2
 *   AND (SELECT host_id FROM quiz_sessions WHERE id=$1) = $current_user_id
 */
export async function kickParticipant(sessionId: string, userId: string): Promise<void> {
  throw new Error("not implemented");
}

/**
 * Начать квиз.
 * SQL:
 *   UPDATE quiz_sessions
 *   SET status='active', started_at=NOW(), current_question_index=0
 *   WHERE id=$1 AND host_id=$current_user_id AND status='waiting'
 *
 *   UPDATE session_participants SET status='playing' WHERE session_id=$1
 *   -- Через Supabase Realtime / WebSocket уведомить участников
 */
export async function startSession(sessionId: string): Promise<void> {
  throw new Error("not implemented");
}

/**
 * Перейти к следующему вопросу.
 * SQL:
 *   UPDATE quiz_sessions
 *   SET current_question_index = current_question_index + 1
 *   WHERE id=$1 AND host_id=$current_user_id
 *   RETURNING current_question_index
 */
export async function nextQuestion(
  sessionId: string,
): Promise<{ questionIndex: number; endsAt: number }> {
  throw new Error("not implemented");
}

/**
 * Завершить квиз.
 * SQL:
 *   UPDATE quiz_sessions SET status='finished', finished_at=NOW()
 *   WHERE id=$1 AND host_id=$current_user_id;
 *
 *   UPDATE session_participants SET status='finished', finished_at=NOW()
 *   WHERE session_id=$1
 */
export async function finishSession(sessionId: string): Promise<void> {
  throw new Error("not implemented");
}

// ─── Ответы ───────────────────────────────────────────────────────────────────

/**
 * Участник отправляет ответ.
 * selectedOptionIds — UUID из answer_options (не индексы 0/1/2).
 *
 * SQL:
 *   -- Проверить правильность:
 *   SELECT id FROM answer_options
 *   WHERE question_id=$questionId AND is_correct=true;
 *
 *   -- Записать ответ:
 *   INSERT INTO participant_answers
 *     (participant_id, question_id, selected_option_ids, text_answer, is_correct, points_awarded, answered_at)
 *   VALUES ($1, $2, $3::uuid[], $4, $5, $6, NOW())
 *   RETURNING *;
 *
 *   -- Обновить счёт:
 *   UPDATE session_participants SET score = score + $points WHERE id=$participantId;
 *
 *   -- Вернуть актуальный rank:
 *   SELECT ROW_NUMBER() OVER (ORDER BY score DESC) AS rank
 *   FROM session_participants WHERE session_id=$sessionId AND id=$participantId
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
  throw new Error("not implemented");
}

// ─── Профиль / История ────────────────────────────────────────────────────────

/**
 * История прохождений пользователя.
 * SQL:
 *   SELECT
 *     s.id AS session_id, q.title AS quiz_title, sp.finished_at AS played_at,
 *     sp.score,
 *     (SELECT SUM(points) FROM questions WHERE quiz_id = q.id) AS max_score,
 *     ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY sp.score DESC) AS rank,
 *     (SELECT COUNT(*) FROM participant_answers pa
 *       JOIN answer_options ao ON ao.id = ANY(pa.selected_option_ids)
 *       WHERE pa.participant_id = sp.id AND pa.is_correct) AS correct_count,
 *     (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS total_count
 *   FROM session_participants sp
 *   JOIN quiz_sessions s ON s.id = sp.session_id
 *   JOIN quizzes q ON q.id = s.quiz_id
 *   WHERE sp.user_id = $current_user_id AND sp.status = 'finished'
 *   ORDER BY sp.finished_at DESC
 */
export async function getMyHistory(): Promise<{
  sessionId: string;
  quizTitle: string;
  playedAt: string;
  score: number;
  maxScore: number;
  rank: number;
  correctCount: number;
  totalCount: number;
}[]> {
  throw new Error("not implemented");
}

/**
 * Детальные результаты прохождения (один экран).
 * SQL:
 *   SELECT
 *     pa.id, pa.question_id, pa.selected_option_ids, pa.text_answer,
 *     pa.is_correct, pa.points_awarded,
 *     q.text AS question_text, q.type, q.points AS max_points,
 *     json_agg(ao ORDER BY ao.order) AS options
 *   FROM participant_answers pa
 *   JOIN questions q ON q.id = pa.question_id
 *   JOIN answer_options ao ON ao.question_id = q.id
 *   WHERE pa.participant_id = (
 *     SELECT id FROM session_participants
 *     WHERE session_id=$1 AND user_id=$current_user_id
 *   )
 *   GROUP BY pa.id, q.id
 *   ORDER BY q.order
 */
export async function getMyResultDetails(sessionId: string): Promise<{
  score: number;
  rank: number;
  totalParticipants: number;
  answers: {
    question: QuestionWithOptions;
    selectedOptionIds: string[];
    textAnswer?: string;
    isCorrect: boolean;
    pointsAwarded: number;
  }[];
}> {
  throw new Error("not implemented");
}

// ─── Аналитика ────────────────────────────────────────────────────────────────

/**
 * Аналитика квиза для организатора.
 * SQL:
 *   -- KPI:
 *   SELECT
 *     COUNT(sp.id)                                             AS total_participants,
 *     AVG(sp.score)                                            AS avg_score,
 *     AVG(pa_correct.correct_pct)                              AS avg_correct_pct,
 *     COUNT(sp.id) FILTER (WHERE sp.status='finished')::FLOAT
 *       / COUNT(sp.id)                                         AS completion_rate
 *   FROM session_participants sp
 *   JOIN quiz_sessions s ON s.id = sp.session_id
 *   WHERE s.quiz_id = $1;
 *
 *   -- Распределение ответов по каждому вопросу:
 *   SELECT
 *     q.id, q.text,
 *     ao.id AS option_id, ao.text AS option_text, ao.is_correct,
 *     COUNT(pa.id) AS answer_count,
 *     COUNT(pa.id)::FLOAT / NULLIF(total.cnt, 0) AS pct
 *   FROM questions q
 *   JOIN answer_options ao ON ao.question_id = q.id
 *   LEFT JOIN participant_answers pa ON $ao.id = ANY(pa.selected_option_ids)
 *   CROSS JOIN (SELECT COUNT(*) AS cnt FROM session_participants WHERE session_id=...) total
 *   WHERE q.quiz_id = $1
 *   GROUP BY q.id, ao.id, total.cnt
 *   ORDER BY q.order, ao.order;
 *
 *   -- Лидерборд:
 *   SELECT u.name, sp.score,
 *     ROW_NUMBER() OVER (ORDER BY sp.score DESC) AS rank,
 *     COUNT(pa.id) FILTER (WHERE pa.is_correct)  AS correct_count
 *   FROM session_participants sp
 *   JOIN users u ON u.id = sp.user_id
 *   LEFT JOIN participant_answers pa ON pa.participant_id = sp.id
 *   WHERE sp.session_id = $sessionId
 *   GROUP BY sp.id, u.name
 *   ORDER BY sp.score DESC
 */
export async function getSessionAnalytics(sessionId: string): Promise<AnalyticsDTO> {
  throw new Error("not implemented");
}
