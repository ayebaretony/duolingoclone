// Proxy to the Vision Agent HTTP server — never expose the agent URL to the mobile client.
// Set VISION_AGENT_URL in your .env (defaults to http://localhost:8000 for local dev).
const VISION_AGENT_URL = process.env.VISION_AGENT_URL ?? "http://localhost:8000";

export async function POST(request: Request): Promise<Response> {
  let callId: string;
  let callType: string;
  let targetLanguage: string;
  let lessonContext: Record<string, unknown> | null;

  try {
    ({ callId, callType, targetLanguage, lessonContext } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!callId || !callType) {
    return Response.json({ error: "callId and callType are required" }, { status: 400 });
  }

  try {
    const agentRes = await fetch(
      `${VISION_AGENT_URL}/calls/${encodeURIComponent(callId)}/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_type: callType,
          target_language: targetLanguage ?? "Spanish",
          lesson_data: lessonContext ?? null,
        }),
      }
    );

    if (!agentRes.ok) {
      const detail = await agentRes.text().catch(() => "");
      return Response.json(
        { error: `Agent server responded ${agentRes.status}`, detail },
        { status: 502 }
      );
    }

    const data = await agentRes.json();
    // Vision Agents server returns { session_id } or { id }
    const sessionId: string = data.session_id ?? data.id ?? "";
    return Response.json({ sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start agent session";
    return Response.json({ error: msg }, { status: 502 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  let callId: string;
  let sessionId: string;

  try {
    ({ callId, sessionId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!callId || !sessionId) {
    return Response.json({ error: "callId and sessionId are required" }, { status: 400 });
  }

  try {
    const agentRes = await fetch(
      `${VISION_AGENT_URL}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" }
    );

    // 404 means the session already ended — treat as success
    if (!agentRes.ok && agentRes.status !== 404) {
      const detail = await agentRes.text().catch(() => "");
      return Response.json(
        { error: `Agent server responded ${agentRes.status}`, detail },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to stop agent session";
    return Response.json({ error: msg }, { status: 502 });
  }
}
