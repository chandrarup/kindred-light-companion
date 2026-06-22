import logoAsset from "@/assets/companion-logo.jpg.asset.json";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

/**
 * COMPANION brand mark — tree formed by two people with a heart at the center.
 * Use as a small icon next to the wordmark, or larger as a hero mark.
 */
export function Logo({ size = 28, className = "", alt = "COMPANION" }: Props) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

export default Logo;