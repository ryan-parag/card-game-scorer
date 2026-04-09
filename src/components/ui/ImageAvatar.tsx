import { cn } from "@/lib/utils";

export const ImageAvatar = ({ type, name, id, className }: { type: string, name: string, id: string | number, className?: string }) => {
  const avatarType = type === 'f1' ? 'f1' : 'corp';
  
  const src = `/images/avatars/avatar-${avatarType}-${id + 1}.png`;

  return (
    <div className={cn("inline-flex rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800", className)}>
      <img
        src={src}
        alt={name}
        onError={() => console.error(`ImageAvatar failed to load: ${src}`)}
				className="w-full h-full"
      />
    </div>
  );
};