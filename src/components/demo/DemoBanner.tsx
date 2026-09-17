import { useT } from "@/i18n/I18nProvider";
import { Link } from "@tanstack/react-router";

export function DemoBanner({ onExit }: { onExit?: () => void }) {
  const { t } = useT();
  return (
    <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-300 px-4 py-2 text-sm flex items-center justify-between gap-3" role="note">
      <span className="font-medium truncate">{t("demo.banner")}</span>
      <Link
        to="/"
        onClick={onExit}
        className="shrink-0 rounded-md border border-amber-400 px-3 py-1 text-xs font-medium hover:bg-amber-200"
      >
        {t("demo.exit")}
      </Link>
    </div>
  );
}
