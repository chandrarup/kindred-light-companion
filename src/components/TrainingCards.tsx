import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listSurfacedTraining } from "@/lib/training.functions";

type Card = {
  id: string;
  title: string;
  body: string | null;
  video_url: string | null;
  source_attribution: string | null;
  action_card_text: string | null;
  symptom_tag: string | null;
  observed_count: number;
};

export function TrainingCards({ refreshKey = 0 }: { refreshKey?: number }) {
  const fn = useServerFn(listSurfacedTraining);
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fn();
        setCards(((res?.cards ?? []) as unknown) as Card[]);
      } finally {
        setLoaded(true);
      }
    })();
  }, [fn, refreshKey]);

  if (!loaded || cards.length === 0) return null;

  return (
    <section aria-labelledby="training" className="mt-6">
      <h2 id="training" className="text-lg font-semibold mb-2">
        Try this next time
      </h2>
      <ul className="space-y-3">
        {cards.map((c) => (
          <li key={c.id} className="rounded-lg border-2 border-border p-4 bg-card">
            <div className="text-xs uppercase text-muted-foreground">
              {c.symptom_tag?.replace(/_/g, " ")} · seen {c.observed_count}× this week
            </div>
            <h3 className="font-semibold mt-1">{c.title}</h3>
            {c.video_url && (
              <div className="mt-2 aspect-video">
                <iframe
                  src={c.video_url}
                  title={c.title}
                  className="w-full h-full rounded"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {c.action_card_text && (
              <p className="mt-3 rounded-md bg-primary/10 border border-primary/30 p-3 font-medium">
                {c.action_card_text}
              </p>
            )}
            {c.body && <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>}
            {c.source_attribution && (
              <p className="mt-2 text-xs text-muted-foreground">Source: {c.source_attribution}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}