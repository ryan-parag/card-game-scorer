import { cn } from "@/lib/utils";

const avatarModules = import.meta.glob<{ default: string }>(
  '../../assets/avatars/*.png',
  { eager: true }
);

function getAvatarUrl(type: string, id: number): string {
  const key = `../../assets/avatars/avatar-${type}-${id}.png`;
  return avatarModules[key]?.default ?? '';
}

export const ImageAvatar = ({ type, name, id, className }: { type: string, name: string, id: string | number, className?: string }) => {
  const avatarType = type === 'f1' ? 'f1' : 'corp';
  const src = getAvatarUrl(avatarType, Number(id) + 1);

  return (
    <div className={cn("inline-flex rounded-full overflow-hidden bg-muted", className)}>
      <img
        src={src}
        alt={name}
        onError={() => console.error(`ImageAvatar failed to load: ${src}`)}
        className="w-full h-full"
      />
    </div>
  );
};
