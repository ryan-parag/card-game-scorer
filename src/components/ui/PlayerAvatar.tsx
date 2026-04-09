import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarStyle, Player } from '../../types/game';
import { FaceAvatar } from './FaceAvatar';
import { ImageAvatar } from './ImageAvatar';
import { TextAvatar } from './TextAvatar';

interface PlayerAvatarProps {
  player: Player;
  index: number;
  avatarStyle?: AvatarStyle;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, index, avatarStyle, className }) => {
  switch (avatarStyle) {
    case 'text':
      return <TextAvatar name={player.name || 'Player'} className={className} />;
    case 'f1':
      return <ImageAvatar id={index} name={player.name || 'Player'} type="f1" className={cn('w-full h-full', className)} />;
    case 'corp':
      return <ImageAvatar id={index} name={player.name || 'Player'} type="corp" className={cn('w-full h-full', className)} />;
    default:
      return <FaceAvatar seed={player.avatar || String(index + 1)} title={player.name || 'Player'} className={className} />;
  }
};
