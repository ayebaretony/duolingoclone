from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, User, Runner
from vision_agents.plugins import getstream, openai

# Load credentials from the parent Expo project's .env so we don't duplicate keys
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# ─── Prompt templates ────────────────────────────────────────────────────────

_BASE = """\
You are an enthusiastic and patient AI language teacher. You always speak in English.
You are teaching the student {target_language} through English-medium voice instruction.

Teaching rules:
- Greet the student warmly at the start of every session
- Introduce {target_language} words and phrases with clear English explanations
- Pronounce each {target_language} word slowly and clearly before explaining it
- Give one simple, practical example per new word or phrase
- Correct mistakes gently — always praise effort before correcting
- Keep each response short and conversational; this is a spoken lesson, not a lecture
- Use light repetition: ask the student to repeat words back to you
- Never switch away from English for explanations; only use {target_language} briefly \
to demonstrate vocabulary or pronunciation
"""

_LESSON_BLOCK = """
Lesson: {title}
Objective: {objective}

Vocabulary to teach today:
{vocab}

Key phrases to practise:
{phrases}

Lesson goals:
{goals}

Lesson-specific instructions: {system_prompt}

Open the session by greeting the student and introducing the first vocabulary word.
"""

_FALLBACK_OPEN = "\nOpen the session by greeting the student and asking what they would like to learn today."


def _build_instructions(target_language: str, lesson_data: dict[str, Any] | None) -> str:
    base = _BASE.format(target_language=target_language)

    if not lesson_data:
        return base + _FALLBACK_OPEN

    vocab_items = lesson_data.get("vocabulary") or []
    phrase_items = lesson_data.get("phrases") or []
    goal_items = lesson_data.get("goals") or []
    ai_prompt = lesson_data.get("ai_teacher_prompt") or {}

    def fmt_vocab(v: dict[str, Any]) -> str:
        line = f"  • {v['term']} = {v['translation']}"
        if v.get("phonetic_hint"):
            line += f" (say: {v['phonetic_hint']})"
        if v.get("example"):
            line += f" — e.g. \"{v['example']}\""
        return line

    def fmt_phrase(p: dict[str, Any]) -> str:
        line = f"  • \"{p['phrase']}\" → {p['translation']}"
        if p.get("use_case"):
            line += f" | use when: {p['use_case']}"
        if p.get("pronunciation_tip"):
            line += f" | tip: {p['pronunciation_tip']}"
        return line

    def fmt_goal(g: dict[str, Any]) -> str:
        return f"  • {g['title']}: {g.get('success_criteria', '')}"

    vocab_block = "\n".join(fmt_vocab(v) for v in vocab_items) or "  (none provided)"
    phrase_block = "\n".join(fmt_phrase(p) for p in phrase_items) or "  (none provided)"
    goal_block = "\n".join(fmt_goal(g) for g in goal_items) or "  (none provided)"

    return base + _LESSON_BLOCK.format(
        title=lesson_data.get("title", "Language Lesson"),
        objective=ai_prompt.get("lesson_objective", "Help the student learn naturally"),
        vocab=vocab_block,
        phrases=phrase_block,
        goals=goal_block,
        system_prompt=ai_prompt.get("system_prompt", "Teach warmly and encourage the student."),
    )


# ─── Agent factory ───────────────────────────────────────────────────────────

async def create_agent(
    target_language: str = "Spanish",
    lesson_data: dict[str, Any] | None = None,
    **kwargs: Any,
) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Language Teacher", id="language-teacher"),
        instructions=_build_instructions(target_language, lesson_data),
        llm=openai.Realtime(model="gpt-realtime-2", voice="marin", send_video=False, fps=0),
    )


async def join_call(
    agent: Agent,
    call_type: str,
    call_id: str,
    **kwargs: Any,
) -> None:
    # call_type and call_id come from the HTTP session request routed through the Expo API
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        # goLive() is called server-side when the call is created, but attempt it here
        # as a safety net so the agent can publish audio in audio_room even on retries
        try:
            await call.go_live()
        except Exception as e:
            logger.exception("go_live() failed (call_id=%s): %s", call_id, e)
        await agent.finish()


if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
