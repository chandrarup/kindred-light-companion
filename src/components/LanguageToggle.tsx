import { useT, type Lang } from "@/i18n/I18nProvider";

export function LanguageToggle() {
  const { lang, setLang, t } = useT();
  const options: { value: Lang; label: string }[] = [
    { value: "en", label: t("common.english") },
    { value: "es", label: t("common.spanish") },
  ];
  return (
    <div role="group" aria-label={t("settings.language")} className="inline-flex rounded-md border border-border overflow-hidden text-xs sm:text-sm">
      {options.map((o) => {
        const active = lang === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLang(o.value)}
            aria-pressed={active}
            data-touch
            className={
              "px-2 py-1 sm:px-3 sm:py-2 " +
              (active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-secondary")
            }
          >
            {active ? "● " : "○ "}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}