import { cn } from "@/lib/utils";

interface AgeBadgeProps {
  ageRange: string;
  className?: string;
}

export function AgeBadge({ ageRange, className }: AgeBadgeProps) {
  const getAgeClass = (age: string) => {
    if (age.includes("3") || age.includes("4") || age.includes("5")) {
      return "age-badge-3-5";
    }
    if (age.includes("6") || age.includes("7") || age.includes("8")) {
      return "age-badge-6-8";
    }
    if (age.includes("9") || age.includes("10") || age.includes("11") || age.includes("12")) {
      return "age-badge-9-12";
    }
    return "age-badge-13-plus";
  };

  return (
    <span
      className={cn(
        "text-white px-3 py-1 rounded-full text-xs font-medium",
        getAgeClass(ageRange),
        className
      )}
    >
      {ageRange} años
    </span>
  );
}
