import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function BrandLogo({ className, size = 36, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label={siteConfig.name}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/logos/raj-logo.png"
        alt={siteConfig.name}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-auto object-contain"
      />
    </Link>
  );
}
