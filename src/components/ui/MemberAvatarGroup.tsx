import { CircleUserRound } from 'lucide-react';
import { LeagueMember } from '../../hooks/useLeagues';
import { motion } from 'framer-motion';

interface MemberAvatarGroupProps {
  members: LeagueMember[];
  /** How many avatars to show before the +N overflow. Default 4. */
  max?: number;
  size?: 'sm' | 'md';
}

export function MemberAvatarGroup({ members, max = 4, size = 'md' }: MemberAvatarGroupProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  const dim = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-xs';
  const border = 'border-2 border-white dark:border-stone-900';

  return (
    <div className="flex -space-x-2">
      {visible.map((member,i) => {
        const name = member.profile.display_name ?? member.profile.email.split('@')[0];
        return (
          <motion.div
            key={member.id}
            title={name}
            className={`${dim} ${border} rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex items-center justify-center flex-shrink-0 relative`}
            initial={{ opacity: 0, top: '20px' }}
            animate={{ opacity: 1, top: 0  }}
            exit={{ opacity: 0, top: '20px' }}
            transition={{ duration: 0.4, delay: .1 + .1*i, type: "spring", stiffness: 140 }}
          >
            {member.profile.avatar_url ? (
              <img src={member.profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <CircleUserRound className="w-full h-full p-0.5 text-stone-400 dark:text-stone-500" />
            )}
          </motion.div>
        );
      })}
      {overflow > 0 && (
        <div
          className={`${dim} ${border} rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center font-medium text-stone-600 dark:text-stone-300 flex-shrink-0`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
