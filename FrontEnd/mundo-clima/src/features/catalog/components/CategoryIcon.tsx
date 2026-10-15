import {
  Snowflake,
  Cylinder,
  Gauge,
  Zap,
  SlidersHorizontal,
  Wrench,
  Cable,
  Package,
  type LucideIcon,
} from "lucide-react";
const icons: Record<string, LucideIcon> = {
  "aires-acondicionados": Snowflake,
  compresores: Gauge,
  "gases-refrigerantes": Cylinder,
  "componentes-electricos": Zap,
  "valvulas-y-controles": SlidersHorizontal,
  "tuberia-y-aislamiento": Cable,
  herramientas: Wrench,
};
export function CategoryIcon({
  slug,
  size = 26,
}: {
  slug: string;
  size?: number;
}) {
  const Icon = icons[slug] ?? Package;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
