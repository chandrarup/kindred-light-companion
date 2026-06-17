import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleQuestion, X, Send, Loader2 } from "lucide-react";
import { askCompanion } from "@/lib/demo.functions";
import { useT } from "@/i18n/I18nProvider";

type Answer = { answer: string; tag: string; cached: boolean };

export function FloatingAsk({ mode = "caregiver" }: { mode?: "caregiver" | "patient" }) {
  const ask = useServerFn(askCompanion);
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [a, setA] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setA(null);
    try {
      const res = await ask({ data: { question: q, mode } });
      setA(res as Answer);
    } finally {
      setLoading(false);
    }
  }

  const placeholder =
    mode === "patient" ? "Tell me about…" : "Ask anything about her care…";

  return (
    <>
      {/* Floating button — clears bottom nav */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.94 }}
        whileHover={{ y: -2 }}
        aria-label="Ask COMPANION"
        className="fixed right-4 z-[60] inline-flex items-center gap-2 rounded-full px-5 h-14 font-medium text-white shadow-[0_10px_30px_-8px_rgba(79,70,229,0.65)] bg-[var(--c-indigo)] hover:bg-[var(--c-indigo-hover)] focus:outline-none focus:ring-4 focus:ring-indigo-300/40"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
      >
        <MessageCircleQuestion size={22} strokeWidth={1.9} />
        <span className="hidden sm:inline">Ask COMPANION</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close"
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Ask COMPANION"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative w-full sm:max-w-xl mx-3 sm:mx-0 mb-3 sm:mb-0 rounded-3xl bg-white text-slate-900 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <MessageCircleQuestion size={18} strokeWidth={2} />
                  </span>
                  <h2 className="text-base font-semibold">Ask COMPANION</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submit} className="px-5 pt-4">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !q.trim()}
                    aria-label="Send"
                    className="m-1.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Plain-language guidance. Not medical advice.
                </p>
              </form>

              <div className="px-5 pb-5 pt-4 min-h-[120px] max-h-[55vh] overflow-y-auto">
                {!a && !loading && (
                  <div className="flex flex-wrap gap-2">
                    {(mode === "patient"
                      ? ["How am I today?", "Who's coming to visit?", "What should I do now?"]
                      : [
                          "Why does she keep asking the same question?",
                          "How do I handle sundowning?",
                          "She refuses to eat — what now?",
                        ]
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQ(s)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Thinking…
                  </div>
                )}
                {a && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-[15px] leading-relaxed text-slate-800">
                    {a.answer}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
