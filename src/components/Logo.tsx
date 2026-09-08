import Image from "next/image";
import logo from "../../public/junkerz-logo.png";

/**
 * The real Junkerz wordmark, carried over from junkerz.com.
 * Customers already recognise it, so it replaces the placeholder
 * dollar-sign icon everywhere the brand appears.
 */
export default function Logo({
  className = "",
  height = 32,
  priority = false,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt="Junkerz — we buy junk cars"
      height={height}
      width={Math.round(height * (790 / 212))}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
