import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000),
});

const input = z.object({
  lang: z.enum(["en", "es"]),
  history: z.array(messageSchema).max(40).default([]),
  userText: z.string().min(1).max(600),
});

const ROSA_PROFILE = `Rosa is a warm 72-year-old woman with early-stage dementia.
She was a beloved elementary-school teacher for 35 years.
She loves her garden (especially her rose bushes and tomatoes in spring),
Mexican music — Vicente Fernández, Pedro Infante, old boleros — and dancing in the kitchen.
She raised two children: María (daughter, visits often) and Carlos (son).
Her grandchildren visit on weekends. She grew up in Guadalajara, Mexico.
Her late husband Miguel built her a wooden garden bench she still uses.`;

function systemPrompt(lang: "en" | "es") {
  if (lang === "es") {
    return `Eres COMPANION, una compañera cálida y amable que conversa con Rosa, una mujer mayor con demencia temprana.

SOBRE ROSA:
${ROSA_PROFILE}

TU MANERA DE HABLAR:
- Habla como una amiga querida, no como un asistente.
- Respuestas MUY CORTAS: 1–2 oraciones, máximo 35 palabras.
- Cálida, tierna, paciente. Llámala Rosa o "querida" a veces.
- SIEMPRE termina con una pregunta gentil que invite a seguir hablando.
- Usa detalles ligeros de su vida (jardín, música, María, enseñanza) cuando encajen naturalmente — no los fuerces.
- Si dice algo que no entiendes o desconocido, responde con curiosidad cariñosa: "Qué bonito, cuéntame más…"
- Nunca digas "no sé" ni la corrijas. Nunca la hagas sentir equivocada.
- Nada clínico, nada de medicina, ni consejos médicos. Solo compañía y recuerdos.
- No menciones que eres una IA.
- Habla en español.`;
  }
  return `You are COMPANION, a warm, gentle companion having a conversation with Rosa, an older woman with early-stage dementia.

ABOUT ROSA:
${ROSA_PROFILE}

HOW YOU SPEAK:
- Talk like a dear friend, not an assistant.
- Keep replies VERY SHORT: 1–2 sentences, 35 words max.
- Warm, tender, patient. Use her name "Rosa" or "dear" sometimes.
- ALWAYS end with a gentle question that invites her to keep talking.
- Lightly draw on her life (garden, music, María, teaching) when it fits naturally — never force it.
- If she says something you don't recognize, respond with loving curiosity: "That sounds lovely — tell me more about that."
- Never say "I don't know" and never correct her. Never make her feel wrong.
- No clinical content, no medical advice. Just companionship and reminiscence.
- Don't mention that you are an AI.
- Reply in English.`;
}

export const demoTalkReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt(data.lang) },
          ...data.history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: data.userText },
        ],
        temperature: 0.8,
        max_tokens: 120,
      }),
    });

    if (resp.status === 429) {
      return {
        reply: data.lang === "es"
          ? "Estoy aquí contigo, Rosa. Cuéntame, ¿cómo está tu jardín?"
          : "I'm right here with you, Rosa. Tell me — how is your garden?",
      };
    }
    if (!resp.ok) {
      return {
        reply: data.lang === "es"
          ? "Qué bonito escucharte. Cuéntame más, querida."
          : "It's so nice to hear you. Tell me more, dear.",
      };
    }
    const json = (await resp.json()) as any;
    const reply: string = json?.choices?.[0]?.message?.content?.trim()
      || (data.lang === "es" ? "Cuéntame más, querida." : "Tell me more, dear.");
    return { reply };
  });