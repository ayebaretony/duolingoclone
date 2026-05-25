import { StreamClient } from "@stream-io/node-sdk";
import { getLessonById } from "@/data/lessons";
import { getLanguageById } from "@/data/languages";

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json({ error: "Stream credentials not configured" }, { status: 500 });
  }

  let userId: string;
  let userName: string;
  let lessonId: string;
  let languageId: string;

  try {
    ({ userId, userName, lessonId, languageId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!userId || !lessonId) {
    return Response.json({ error: "userId and lessonId are required" }, { status: 400 });
  }

  const client = new StreamClient(apiKey, apiSecret);

  // Generate user token valid for 1 hour
  const token = client.generateUserToken({
    user_id: userId,
    validity_in_seconds: 3600,
  });

  // Sanitize IDs — Stream allows alphanumeric, underscore, hyphen, period
  const safeUserId = userId.replace(/[^a-zA-Z0-9_\-.]/g, "_");
  const safeLessonId = lessonId.replace(/[^a-zA-Z0-9_\-.]/g, "_");

  // Each user gets their own lesson call session
  // audio_room is the right call type for voice-only AI lessons
  const callId = `lesson_${safeLessonId}_${safeUserId}`;
  const callType = "audio_room";

  // Build condensed lesson context so the Python agent can read it on join
  const lesson = getLessonById(lessonId);
  const language = lesson ? getLanguageById(lesson.languageId) : null;
  const lessonContext = lesson
    ? {
        title: lesson.title,
        description: lesson.description,
        target_language: language?.name ?? languageId,
        goals: lesson.goals.map((g) => ({
          title: g.title,
          success_criteria: g.successCriteria,
        })),
        vocabulary: lesson.vocabulary.map((v) => ({
          term: v.term,
          translation: v.translation,
          example: v.example,
          phonetic_hint: v.phoneticHint ?? null,
        })),
        phrases: lesson.phrases.map((p) => ({
          phrase: p.phrase,
          translation: p.translation,
          use_case: p.useCase,
          pronunciation_tip: p.pronunciationTip ?? null,
        })),
        ai_teacher_prompt: {
          persona: lesson.aiTeacherPrompt.persona,
          lesson_objective: lesson.aiTeacherPrompt.lessonObjective,
          system_prompt: lesson.aiTeacherPrompt.systemPrompt,
          opening_message: lesson.aiTeacherPrompt.openingMessage,
          correction_style: lesson.aiTeacherPrompt.correctionStyle,
          target_phrases: lesson.aiTeacherPrompt.targetPhrases,
        },
      }
    : null;

  const call = client.video.call(callType, callId);
  await call.getOrCreate({
    data: {
      created_by_id: userId,
      members: [
        { user_id: userId, role: "host" },
        // Agent user — admin role grants audio publish permission in audio_room
        { user_id: "language-teacher", role: "admin" },
      ],
      custom: {
        lessonId,
        languageId,
        userName,
        // Stored as JSON string so the agent can parse it on join
        lesson_context: lessonContext ? JSON.stringify(lessonContext) : null,
      },
    },
  });

  // audio_room requires goLive before speakers can publish audio
  try {
    await call.goLive();
  } catch {
    // Safe to ignore if the call was already live on retry
  }

  return Response.json({ token, apiKey, callId, callType });
}
