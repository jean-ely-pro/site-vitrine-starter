import {
  Building2,
  Calculator,
  FileSearch,
  FileText,
  Gift,
  Globe,
  Heart,
  HeartCrack,
  Home,
  Landmark,
  LineChart,
  Lock,
  Percent,
  Scale,
  Scroll,
  Stamp,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type ServiceIconOption = { label: string; value: string; icon: LucideIcon };

/**
 * The icon choices offered to the owner on the "services détaillés" block.
 * Values are stored in the database, so keep them stable — never rename one.
 */
export const SERVICE_ICON_OPTIONS: ServiceIconOption[] = [
  { label: "Achat / vente", value: "home", icon: Home },
  { label: "Succession", value: "scroll", icon: Scroll },
  { label: "Divorce", value: "heartCrack", icon: HeartCrack },
  { label: "Le couple", value: "heart", icon: Heart },
  { label: "Donation", value: "gift", icon: Gift },
  { label: "Entreprise", value: "building", icon: Building2 },
  { label: "Droit international", value: "globe", icon: Globe },
  { label: "Justice / droit", value: "scale", icon: Scale },
  { label: "Patrimoine", value: "landmark", icon: Landmark },
  { label: "Calculette", value: "calculator", icon: Calculator },
  { label: "Frais / pourcentage", value: "percent", icon: Percent },
  { label: "Marché / tendances", value: "trendingUp", icon: TrendingUp },
  { label: "Statistiques", value: "lineChart", icon: LineChart },
  { label: "Acte / document", value: "fileText", icon: FileText },
  { label: "Analyse", value: "fileSearch", icon: FileSearch },
  { label: "Sceau / acte notarié", value: "stamp", icon: Stamp },
  { label: "Sécurité", value: "lock", icon: Lock },
  { label: "Successeurs", value: "users", icon: Users },
  { label: "Budget", value: "wallet", icon: Wallet },
];

const ICON_BY_VALUE: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_OPTIONS.map(({ value, icon }) => [value, icon]),
);

/** Resolve a stored icon value to its lucide component; falls back to a neutral icon. */
export const getServiceIcon = (value?: string | null): LucideIcon => {
  if (value && ICON_BY_VALUE[value]) return ICON_BY_VALUE[value];
  return Scale;
};
