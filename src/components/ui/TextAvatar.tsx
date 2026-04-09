import { cn } from "@/lib/utils";

export const TextAvatar = ({ name, className }: { name: string, className?: string }) => {
  return (
    <div className={cn("w-full h-full inline-flex items-center justify-center font-semibold text-xl text-white", className)}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};
