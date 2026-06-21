// Synthetic data for COMPANION Demo Mode. No backend, no PHI.

export const ROSA = {
  name: "Rosa Herrera",
  preferredName: "Rosa",
  age: 78,
  diagnosis: "Early-stage Alzheimer's",
  diagnosedYears: 2,
  language: "es",
  profession: "Kindergarten teacher (31 years)",
  hometown: "Guadalajara, Mexico",
  faith: "Catholic",
  notableRoutine: "Left work every day at 3:00 PM for 31 years.",
};

export type DemoPhoto = { id: string; caption: { en: string; es: string }; gradient: string; emoji: string };

export const DEMO_PHOTOS: DemoPhoto[] = [
  { id: "wedding", caption: { en: "Wedding day, 1962", es: "Día de boda, 1962" }, gradient: "from-rose-200 via-amber-100 to-orange-200", emoji: "💐" },
  { id: "maria",   caption: { en: "Daughter María", es: "Hija María" }, gradient: "from-sky-200 via-indigo-100 to-purple-200", emoji: "👩" },
  { id: "grandkids", caption: { en: "Grandchildren at the beach", es: "Nietos en la playa" }, gradient: "from-cyan-200 via-teal-100 to-emerald-200", emoji: "👧🧒" },
  { id: "school",  caption: { en: "First day at school, 1971", es: "Primer día en la escuela, 1971" }, gradient: "from-amber-200 via-yellow-100 to-lime-200", emoji: "🍎" },
  { id: "garden",  caption: { en: "Her garden in spring", es: "Su jardín en primavera" }, gradient: "from-emerald-200 via-green-100 to-teal-200", emoji: "🌷" },
];

export const DEMO_MUSIC: { id: string; title: string; artist: string; url: string }[] = [
  // Royalty-free instrumental samples (SoundHelix) used as demo audio so judges
  // can actually hear playback without licensing real recordings.
  { id: "el-rey",  title: "El Rey",          artist: "Vicente Fernández",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "volver",  title: "Volver, Volver",  artist: "Vicente Fernández",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "cielito", title: "Cielito Lindo",   artist: "Pedro Infante",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "besame",  title: "Bésame Mucho",    artist: "Consuelo Velázquez",  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export const DEMO_PEOPLE = [
  { id: "maria", name: "María", relationship: { en: "Daughter", es: "Hija" }, phone: "555-0144" },
  { id: "carlos", name: "Carlos", relationship: { en: "Son", es: "Hijo" }, phone: "555-0177" },
  { id: "alvarez", name: "Dr. Alvarez", relationship: { en: "Neurologist", es: "Neurólogo" }, phone: "555-0102" },
  { id: "elena", name: "Elena", relationship: { en: "Sister", es: "Hermana" }, phone: "555-0188" },
];

export type DemoLog = {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  sleep: "well" | "okay" | "poorly";
  notes: { en: string; es: string };
  symptoms: { name: { en: string; es: string }; timeOfDay?: string; antecedent?: { en: string; es: string }; outcome?: { en: string; es: string } }[];
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_LOGS: DemoLog[] = [
  {
    id: "l1", date: isoDaysAgo(0), mood: 3, sleep: "okay",
    notes: { en: "Good morning. Bit restless after lunch.", es: "Buena mañana. Inquieta después del almuerzo." },
    symptoms: [{ name: { en: "Agitation", es: "Agitación" }, timeOfDay: "afternoon", antecedent: { en: "After lunch", es: "Después del almuerzo" }, outcome: { en: "Music helped", es: "La música ayudó" } }],
  },
  {
    id: "l2", date: isoDaysAgo(1), mood: 4, sleep: "well",
    notes: { en: "Calm day. Sang along to Vicente.", es: "Día tranquilo. Cantó con Vicente." }, symptoms: [],
  },
  {
    id: "l3", date: isoDaysAgo(2), mood: 2, sleep: "poorly",
    notes: { en: "Asked about going 'to the school' around 3pm.", es: "Preguntó por ir 'a la escuela' a las 3pm." },
    symptoms: [{ name: { en: "Repetition", es: "Repetición" }, timeOfDay: "afternoon", antecedent: { en: "Around 3pm", es: "Cerca de las 3pm" }, outcome: { en: "Redirected with photos", es: "Redirigida con fotos" } }],
  },
  {
    id: "l4", date: isoDaysAgo(3), mood: 3, sleep: "okay", notes: { en: "Refused breakfast. Ate later.", es: "Rechazó el desayuno. Comió después." },
    symptoms: [{ name: { en: "Appetite change", es: "Cambio de apetito" }, timeOfDay: "morning", outcome: { en: "Resolved by 10am", es: "Resuelto a las 10am" } }],
  },
  { id: "l5", date: isoDaysAgo(4), mood: 4, sleep: "well", notes: { en: "Lovely visit from María.", es: "Linda visita de María." }, symptoms: [] },
  {
    id: "l6", date: isoDaysAgo(5), mood: 2, sleep: "poorly",
    notes: { en: "Agitated at sunset. Wanted to 'go home'.", es: "Agitada al atardecer. Quería 'ir a casa'." },
    symptoms: [{ name: { en: "Sundowning", es: "Sundowning" }, timeOfDay: "evening", antecedent: { en: "Sunset", es: "Atardecer" }, outcome: { en: "Walk + warm light", es: "Caminata + luz cálida" } }],
  },
  { id: "l7", date: isoDaysAgo(6), mood: 3, sleep: "okay", notes: { en: "Quiet day. Garden time.", es: "Día tranquilo. Tiempo en el jardín." }, symptoms: [] },
  {
    id: "l8", date: isoDaysAgo(8), mood: 2, sleep: "poorly",
    notes: { en: "Restless. Repeated questions about school.", es: "Inquieta. Preguntas repetidas sobre la escuela." },
    symptoms: [{ name: { en: "Repetition", es: "Repetición" }, timeOfDay: "afternoon", outcome: { en: "Music eased it", es: "La música la calmó" } }],
  },
  { id: "l9", date: isoDaysAgo(10), mood: 4, sleep: "well", notes: { en: "Sang all afternoon.", es: "Cantó toda la tarde." }, symptoms: [] },
  {
    id: "l10", date: isoDaysAgo(12), mood: 3, sleep: "okay",
    notes: { en: "Mild confusion at dinner.", es: "Confusión leve en la cena." },
    symptoms: [{ name: { en: "Confusion", es: "Confusión" }, timeOfDay: "evening" }],
  },
];

// Cues / reminders rotation for the timed pop-up
export const DEMO_REMINDERS = [
  { id: "water", emoji: "💧", title: { en: "Time for water", es: "Hora de tomar agua" }, body: { en: "A small glass keeps Rosa steady this afternoon.", es: "Un vaso pequeño ayuda a Rosa esta tarde." } },
  { id: "med",   emoji: "💊", title: { en: "Rosa's medication reminder", es: "Recordatorio de medicación" }, body: { en: "Time for her afternoon pill with a snack.", es: "Hora de su pastilla de la tarde con un bocadillo." } },
  { id: "snack", emoji: "🍎", title: { en: "A little snack?", es: "¿Un bocadillo?" }, body: { en: "Apple slices and a few crackers — her favorite.", es: "Rebanadas de manzana y galletas — sus favoritas." } },
  { id: "music", emoji: "🎵", title: { en: "Music moment", es: "Momento musical" }, body: { en: "Vicente Fernández eases the 3pm transition.", es: "Vicente Fernández alivia la transición de las 3pm." } },
];

// ===== Ask Companion canned responses =====
export type AskMode = "patient" | "caregiver";
export type AskResponse = {
  kind: "personalized" | "educational" | "grounded" | "emergency" | "guardrail" | "reminiscence" | "fallback";
  text: { en: string; es: string };
  source?: { label: string; url: string };
  sources?: { label: string; url: string }[];
  video?: { label: { en: string; es: string }; url: string; youtubeId?: string };
  actions?: { label: { en: string; es: string }; phone?: string }[];
};

type AskRule = { keywords: string[]; mode: AskMode | "both"; response: AskResponse };

const RULES: AskRule[] = [
  // ===== Caregiver =====
  {
    keywords: ["afternoon", "agitated", "agitation", "3pm", "three pm", "late afternoon", "sundown", "sundowning", "tarde", "agitad"],
    mode: "caregiver",
    response: {
      kind: "personalized",
      text: {
        en: "Rosa often gets agitated in the late afternoon. For 31 years she left her classroom at 3:00 PM — that internal clock still fires. Try playing Vicente Fernández's 'El Rey' around 2:45 PM and dimming overhead lights. That's eased her in 6 of the last 8 episodes.",
        es: "Rosa se agita por la tarde. Por 31 años salió de su salón a las 3:00 PM — ese reloj interno aún suena. Pon 'El Rey' de Vicente Fernández cerca de las 2:45 PM y baja las luces del techo. La ha calmado en 6 de los últimos 8 episodios.",
      },
    },
  },
  {
    keywords: ["repetition", "repeat", "same question", "repite", "repetic"],
    mode: "caregiver",
    response: {
      kind: "educational",
      text: {
        en: "Repeating questions is common in dementia. The trick is to answer calmly, then redirect to a familiar activity — never correct or remind that they've already asked.",
        es: "Repetir preguntas es común en la demencia. La clave es responder con calma y redirigir a una actividad familiar — nunca corregir.",
      },
      video: {
        label: { en: "Watch (3 min): Responding to repeated questions", es: "Ver (3 min): Cómo responder a preguntas repetidas" },
        url: "https://www.youtube.com/watch?v=Iqf5y2tIyL0",
        youtubeId: "Iqf5y2tIyL0",
      },
      source: { label: "Alzheimer's Association — Communication", url: "https://www.alz.org/help-support/caregiving/daily-care/communications" },
    },
  },
  {
    keywords: ["bath", "bathing", "shower", "resist", "baño", "ducha"],
    mode: "caregiver",
    response: {
      kind: "grounded",
      text: {
        en: "Make bathing predictable: warm the room first, use the same time of day, give short calm explanations, and let her hold a familiar washcloth. Avoid surprise spray.",
        es: "Haz el baño predecible: calienta el cuarto, usa la misma hora del día, da explicaciones cortas y deja que sostenga una toallita familiar. Evita rociar de sorpresa.",
      },
      source: { label: "Alzheimer's Association", url: "https://www.alz.org/help-support/caregiving/daily-care/bathing" },
    },
  },
  {
    keywords: ["calm", "won't calm", "wont calm", "settle", "soothe", "calma", "tranquiliz", "no se calma"],
    mode: "caregiver",
    response: {
      kind: "personalized",
      text: {
        en: "When Rosa won't settle, lower the noise, dim overhead lights, and sit beside her — don't stand over her. Put on 'Cielito Lindo' softly and offer her hand. Music has eased 6 of her last 8 distress moments. If she's still escalating after 15 minutes, step away briefly and try again — pressure makes it worse.",
        es: "Cuando Rosa no se calma, baja el ruido, baja las luces y siéntate a su lado — no de pie sobre ella. Pon 'Cielito Lindo' suave y ofrécele tu mano. La música ha aliviado 6 de los últimos 8 momentos difíciles. Si sigue escalando tras 15 minutos, aléjate un momento e inténtalo de nuevo — la presión empeora.",
      },
    },
  },
  {
    keywords: ["sleep", "didn't sleep", "didnt sleep", "no sleep", "insomnia", "tired", "dormir", "no durmió", "insomnio", "cansad"],
    mode: "caregiver",
    response: {
      kind: "grounded",
      text: {
        en: "After a poor night: keep today's routine but slow it down. Get morning light within an hour of waking, skip the long nap, keep caffeine before noon, and dim the house from 7 PM. If poor sleep continues 3+ nights, mention it to Dr. Alvarez.",
        es: "Tras una mala noche: mantén la rutina pero más despacio. Luz de la mañana dentro de la primera hora, evita la siesta larga, café solo antes del mediodía y atenúa la casa desde las 7 PM. Si dura 3+ noches, dilo al Dr. Alvarez.",
      },
      source: { label: "Alzheimer's Association — Sleep", url: "https://www.alz.org/help-support/caregiving/daily-care/sleep-issues-sundowning" },
    },
  },
  {
    keywords: ["doctor", "tell the doctor", "appointment", "visit", "médico", "doctor", "cita", "decirle"],
    mode: "caregiver",
    response: {
      kind: "personalized",
      text: {
        en: "Bring this to Dr. Alvarez: 5 afternoon-agitation episodes in 8 days (2:30–3:30 PM), 2 nights of poor sleep this week, appetite drop on day 3, and that music + dim light has been the most reliable response. Open the Physician Summary tab to print or share the full one-page snapshot.",
        es: "Lleva esto al Dr. Alvarez: 5 episodios de agitación por la tarde en 8 días (2:30–3:30 PM), 2 noches de mal sueño esta semana, baja de apetito el día 3, y que la música + luz tenue ha sido la respuesta más confiable. Abre la pestaña Resumen Médico para imprimir o compartir.",
      },
    },
  },
  {
    keywords: ["wander", "wandering", "leave the house", "walk off", "se va", "vagar"],
    mode: "caregiver",
    response: {
      kind: "grounded",
      text: {
        en: "Wandering is common and often purposeful — the person is trying to get somewhere meaningful from their past. Reduce risk with door chimes, a GPS bracelet, and a daily walk to burn restless energy. Enroll Rosa in a wandering-response service before an incident.",
        es: "El deambular es común y suele tener un propósito — la persona intenta llegar a un lugar significativo de su pasado. Reduce el riesgo con timbres en las puertas, brazalete GPS y una caminata diaria. Inscribe a Rosa en un servicio de respuesta antes de un incidente.",
      },
      sources: [
        { label: "Alzheimer's Association — Wandering", url: "https://www.alz.org/help-support/caregiving/safety/wandering" },
        { label: "NIA — Home Safety and Alzheimer's", url: "https://www.nia.nih.gov/health/home-safety-and-alzheimers-disease" },
      ],
    },
  },
  {
    keywords: ["eat", "eating", "food", "nutrition", "appetite", "meal", "comer", "comida", "alimentaci"],
    mode: "caregiver",
    response: {
      kind: "educational",
      text: {
        en: "Appetite changes are normal. Offer small frequent meals, high-contrast plates (food shows up better on a solid color), finger foods she can pick up, and skip choices — ask 'chicken?' not 'what would you like?'. Keep mealtimes consistent.",
        es: "Los cambios de apetito son normales. Ofrece comidas pequeñas frecuentes, platos de color contrastante, alimentos que pueda tomar con la mano y evita opciones — pregunta '¿pollo?' no '¿qué quieres?'. Mantén horarios consistentes.",
      },
      video: {
        label: { en: "Watch (4 min): Mealtime strategies for dementia", es: "Ver (4 min): Estrategias para la hora de comer" },
        url: "https://www.youtube.com/watch?v=v2pq3KEs7Wo",
        youtubeId: "v2pq3KEs7Wo",
      },
      source: { label: "Alzheimer's Association — Food & Eating", url: "https://www.alz.org/help-support/caregiving/daily-care/food-eating" },
    },
  },
  {
    keywords: ["legal", "finance", "power of attorney", "will", "money", "legal", "finanzas", "poder"],
    mode: "caregiver",
    response: {
      kind: "grounded",
      text: {
        en: "Early stage is the time to put legal and financial plans in place while Rosa can still participate: durable power of attorney, healthcare proxy, an updated will, and a review of long-term care insurance. Work with an elder-law attorney.",
        es: "La etapa temprana es el momento para poner en orden los planes legales y financieros mientras Rosa puede participar: poder notarial duradero, representante de salud, testamento actualizado y revisión del seguro de cuidado a largo plazo.",
      },
      sources: [
        { label: "Alzheimer's Association — Legal Planning", url: "https://www.alz.org/help-support/caregiving/financial-legal-planning/legal-planning" },
        { label: "Alzheimer's Association — Financial Planning", url: "https://www.alz.org/help-support/caregiving/financial-legal-planning" },
      ],
    },
  },
  {
    keywords: ["burnout", "overwhelmed", "exhausted", "myself", "stress", "agotada", "agotado", "yo misma", "estrés"],
    mode: "caregiver",
    response: {
      kind: "personalized",
      text: {
        en: "You're carrying a lot. Caregiver burnout is real and predictable — and the best thing for Rosa is a caregiver who isn't running on empty. Ask one person in the circle for a 2-hour weekly break this week. The Alzheimer's Association 24/7 Helpline (800-272-3900) is free.",
        es: "Llevas mucho encima. El agotamiento del cuidador es real — y lo mejor para Rosa es un cuidador que no esté vacío. Pide a alguien del círculo una pausa de 2 horas esta semana. La línea de ayuda 24/7 de la Alzheimer's Association (800-272-3900) es gratis.",
      },
      video: {
        label: { en: "Watch (5 min): Recognizing caregiver stress", es: "Ver (5 min): Reconocer el estrés del cuidador" },
        url: "https://www.youtube.com/watch?v=KlT5gI3LBYE",
        youtubeId: "KlT5gI3LBYE",
      },
      source: { label: "Alzheimer's Association — Caregiver Health", url: "https://www.alz.org/help-support/caregiving/caregiver-health" },
      actions: [{ label: { en: "Call 24/7 Helpline", es: "Llamar línea 24/7" }, phone: "800-272-3900" }],
    },
  },
  {
    keywords: ["exercise", "activity", "active", "movement", "ejercicio", "actividad"],
    mode: "caregiver",
    response: {
      kind: "educational",
      text: {
        en: "Regular gentle movement improves mood, sleep, and balance, and can slow functional decline. Aim for 30 minutes most days — a morning walk plus light stretching. Pair it with music she loves so it feels like joy, not a workout.",
        es: "El movimiento suave regular mejora el ánimo, el sueño y el equilibrio. Apunta a 30 minutos casi todos los días — una caminata matutina y estiramientos suaves. Acompáñalo con música que ama para que se sienta como alegría, no ejercicio.",
      },
      video: {
        label: { en: "Watch (6 min): Seated exercises for older adults", es: "Ver (6 min): Ejercicios sentados para adultos mayores" },
        url: "https://www.youtube.com/watch?v=UItWltVZZmE",
        youtubeId: "UItWltVZZmE",
      },
      source: { label: "NIA — Exercise and Physical Activity", url: "https://www.nia.nih.gov/health/exercise-physical-activity" },
    },
  },
  {
    keywords: ["stages", "what to expect", "progression", "early stage", "etapas", "progresi"],
    mode: "caregiver",
    response: {
      kind: "grounded",
      text: {
        en: "Alzheimer's is generally described in early, middle, and late stages. Rosa is in the early stage — she can do most things with light cues. Plan now for the middle stage (more help with daily tasks) so transitions feel like preparation, not crisis.",
        es: "El Alzheimer se describe en etapas temprana, media y tardía. Rosa está en la temprana — puede hacer la mayoría de cosas con pistas suaves. Planifica ya para la etapa media para que las transiciones sean preparación, no crisis.",
      },
      sources: [
        { label: "Alzheimer's Association — Stages", url: "https://www.alz.org/alzheimers-dementia/stages" },
        { label: "NIA — Alzheimer's Disease Stages", url: "https://www.nia.nih.gov/health/what-are-different-stages-alzheimers-disease" },
      ],
    },
  },
  {
    keywords: ["fell", "fall", "unresponsive", "not breathing", "wander", "missing", "lost", "se cayó", "no responde", "perdid"],
    mode: "caregiver",
    response: {
      kind: "emergency",
      text: {
        en: "Safety first. If Rosa is hurt or unresponsive, call 911 now. Then alert her care circle. Do not move her if she may be injured.",
        es: "Primero la seguridad. Si Rosa está herida o no responde, llama al 911 ahora. Luego avisa al círculo de cuidado. No la muevas si puede estar lesionada.",
      },
      actions: [
        { label: { en: "Call 911", es: "Llamar 911" }, phone: "911" },
        { label: { en: "Call Dr. Alvarez", es: "Llamar Dr. Alvarez" }, phone: "555-0102" },
        { label: { en: "Call María", es: "Llamar María" }, phone: "555-0144" },
      ],
    },
  },
  // Guardrails
  {
    keywords: ["medication", "dose", "mg", "pill", "medicación", "dosis"],
    mode: "caregiver",
    response: {
      kind: "guardrail",
      text: {
        en: "I can't advise on medications — doses or changes need a clinician. Please call Dr. Alvarez at 555-0102.",
        es: "No puedo aconsejar sobre medicamentos — las dosis o cambios requieren un médico. Llama al Dr. Alvarez al 555-0102.",
      },
      actions: [{ label: { en: "Call Dr. Alvarez", es: "Llamar Dr. Alvarez" }, phone: "555-0102" }],
    },
  },
  {
    keywords: ["driving", "drive", "manejar", "conducir"],
    mode: "caregiver",
    response: {
      kind: "guardrail",
      text: {
        en: "Driving decisions need a clinician's input. Please bring this up with Dr. Alvarez at the next visit.",
        es: "Las decisiones sobre manejar requieren un médico. Por favor, hábla con el Dr. Alvarez en la próxima visita.",
      },
    },
  },
  {
    keywords: ["prognosis", "how long", "life expectancy", "stages", "pronóstico", "etapas"],
    mode: "caregiver",
    response: {
      kind: "guardrail",
      text: {
        en: "Prognosis questions are best answered by Dr. Alvarez, who knows Rosa's full picture.",
        es: "Las preguntas sobre pronóstico las responde mejor el Dr. Alvarez, que conoce todo el panorama de Rosa.",
      },
    },
  },
  // ===== Patient (reminiscence only) =====
  {
    keywords: ["music", "song", "vicente", "música", "canción"],
    mode: "patient",
    response: {
      kind: "reminiscence",
      text: {
        en: "Vicente Fernández always made you sing along. You knew every word of 'El Rey'.",
        es: "Vicente Fernández siempre te hacía cantar. Sabías cada palabra de 'El Rey'.",
      },
    },
  },
  {
    keywords: ["work", "school", "teach", "trabajo", "escuela", "enseñ"],
    mode: "patient",
    response: {
      kind: "reminiscence",
      text: {
        en: "You taught kindergarten for 31 years. The children adored you, Rosa.",
        es: "Enseñaste en el kínder por 31 años. Los niños te adoraban, Rosa.",
      },
    },
  },
  {
    keywords: ["maría", "maria", "family", "familia", "hija", "daughter"],
    mode: "patient",
    response: {
      kind: "reminiscence",
      text: {
        en: "María is your daughter. She visits every Sunday with the grandchildren.",
        es: "María es tu hija. Visita cada domingo con los nietos.",
      },
    },
  },
];

export function askCanned(question: string, mode: AskMode): AskResponse {
  const q = question.toLowerCase();
  for (const rule of RULES) {
    if (rule.mode !== "both" && rule.mode !== mode) continue;
    if (rule.keywords.some((k) => q.includes(k.toLowerCase()))) return rule.response;
  }
  if (mode === "patient") {
    return {
      kind: "reminiscence",
      text: {
        en: "You were a beautiful bride in 1962. The white roses were your mother's favorite.",
        es: "Eras una novia hermosa en 1962. Las rosas blancas eran las favoritas de tu mamá.",
      },
    };
  }
  return {
    kind: "fallback",
    text: {
      en: "I don't have an answer for that yet. For anything clinical, please ask Dr. Alvarez.",
      es: "Aún no tengo una respuesta para eso. Para cualquier tema clínico, pregunta al Dr. Alvarez.",
    },
  };
}

// ===== Insights / patterns surfaced for caregiver =====
export const DEMO_INSIGHTS = [
  {
    id: "insight-3pm",
    title: { en: "Afternoon agitation linked to 3 PM", es: "Agitación de la tarde ligada a las 3 PM" },
    body: {
      en: "5 of the last 8 agitation episodes started between 2:30–3:30 PM. Rosa left her classroom at 3:00 PM for 31 years.",
      es: "5 de los últimos 8 episodios de agitación empezaron entre 2:30 y 3:30 PM. Rosa salía de su salón a las 3 PM por 31 años.",
    },
    suggestion: {
      en: "Try a 'gentle hand-off': Vicente Fernández at 2:45 PM and dim lights.",
      es: "Prueba una 'transición suave': Vicente Fernández a las 2:45 PM y luces tenues.",
    },
  },
  {
    id: "insight-music",
    title: { en: "Music is your most reliable tool", es: "La música es tu herramienta más confiable" },
    body: {
      en: "Music has resolved or eased 6 of 8 logged distress moments this month.",
      es: "La música ha resuelto o aliviado 6 de 8 momentos de angustia este mes.",
    },
    suggestion: {
      en: "Keep 'El Rey' and 'Volver, Volver' at the top of her queue.",
      es: "Mantén 'El Rey' y 'Volver, Volver' al inicio de su lista.",
    },
  },
];

export const DEMO_CUES = [
  { id: "c1", time: "14:45", label: { en: "Play Vicente Fernández", es: "Pon Vicente Fernández" }, why: { en: "Eases 3 PM transition", es: "Suaviza la transición de las 3 PM" } },
  { id: "c2", time: "08:00", label: { en: "Morning medication with breakfast", es: "Medicación matutina con desayuno" }, why: { en: "Daily routine", es: "Rutina diaria" } },
  { id: "c3", time: "20:30", label: { en: "Warm light, calm music", es: "Luz cálida, música tranquila" }, why: { en: "Reduces sundowning", es: "Reduce el sundowning" } },
];
