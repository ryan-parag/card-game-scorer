import React, { useMemo } from 'react';
import { hashStringToUint32 } from '../utils/avatar';

interface FaceAvatarProps {
  seed: string;
  className?: string;
  title?: string;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FaceAvatar: React.FC<FaceAvatarProps> = ({ seed, className, title }) => {
  const computed = useMemo(() => {
    const seedInt = hashStringToUint32(seed || '');
    const rand = mulberry32(seedInt);

    const accentHue = Math.floor(rand() * 360);
    const accentSat = 80 + Math.floor(rand() * 15); // %
    const accentLight = 45 + Math.floor(rand() * 20); // %

    const headAlpha = 0.14 + rand() * 0.14;
    const eyeY = 42 + Math.floor(rand() * 8); // 42-49
    const eyeOffset = 14 + Math.floor(rand() * 10); // 14-23
    const pupilOffsetX = Math.floor((rand() - 0.5) * 6); // -3..2

    const hairStyle = Math.floor(rand() * 4); // 0..3
    const eyeStyle = Math.floor(rand() * 3); // 0..2
    const mouthStyle = Math.floor(rand() * 3); // 0..2
    const blush = rand() < 0.55;
    const glasses = rand() < 0.3;

    return {
      accent: `hsl(${accentHue} ${accentSat}% ${accentLight}%)`,
      headFill: `rgba(255, 255, 255, ${headAlpha.toFixed(3)})`,
      eyeWhite: 'rgba(255, 255, 255, 0.92)',
      pupil: 'rgba(2, 6, 23, 0.72)', // slate-950-ish
      mouthInk: 'rgba(2, 6, 23, 0.78)',
      hairInk: `rgba(255, 255, 255, ${0.25 + rand() * 0.35})`,
      // slightly different weights based on seed
      hairAccent: `hsla(${accentHue} ${accentSat}% ${accentLight}% / ${0.85})`,
      eyeY,
      eyeOffset,
      pupilOffsetX,
      hairStyle,
      eyeStyle,
      mouthStyle,
      blush,
      glasses,
    };
  }, [seed]);

  const leftEyeX = 50 - computed.eyeOffset;
  const rightEyeX = 50 + computed.eyeOffset;

  const eyeWhiteR = computed.eyeStyle === 2 ? 9 : 10;
  const pupilR = computed.eyeStyle === 2 ? 4 : 3.5;

  const leftPupilX = leftEyeX + computed.pupilOffsetX;
  const rightPupilX = rightEyeX + computed.pupilOffsetX;

  const mouth = (() => {
    switch (computed.mouthStyle) {
      case 0:
        // smile
        return <path d="M40 70 Q50 82 60 70" stroke={computed.mouthInk} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
      case 1:
        // neutral
        return <path d="M41 72 H59" stroke={computed.mouthInk} strokeWidth="5" fill="none" strokeLinecap="round" />;
      default:
        // frown
        return <path d="M40 76 Q50 66 60 76" stroke={computed.mouthInk} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
    }
  })();

  const glasses = computed.glasses ? (
    <>
      <rect x="26" y="48" width="20" height="14" rx="7" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.85)" strokeWidth="3" />
      <rect x="54" y="48" width="20" height="14" rx="7" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.85)" strokeWidth="3" />
      <path d="M46 55 H54" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
    </>
  ) : null;

  const hair = (() => {
    switch (computed.hairStyle) {
      case 0:
        // Straight / bangs
        return (
          <>
            <path
              d="M22 48 C24 22 38 12 50 12 C62 12 76 22 78 48 L78 60 C78 60 72 58 50 58 C28 58 22 60 22 60 Z"
              fill={computed.hairInk}
            />
            <path
              d="M30 28 C34 22 42 18 50 18 C58 18 66 22 70 28"
              stroke={computed.hairAccent}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      case 1:
        // Curly
        return (
          <>
            <path
              d="M20 48 C22 18 36 10 50 10 C64 10 78 18 80 48 L80 60 C80 60 70 56 50 56 C30 56 20 60 20 60 Z"
              fill={computed.hairInk}
            />
            <path d="M30 26 C36 20 40 20 46 26" stroke={computed.hairAccent} strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M54 26 C60 20 64 20 70 26" stroke={computed.hairAccent} strokeWidth="6" strokeLinecap="round" fill="none" />
          </>
        );
      case 2:
        // Spiky
        return (
          <>
            <path d="M22 50 C22 26 34 10 50 10 C66 10 78 26 78 50 L78 60 C78 60 70 58 50 58 C30 58 22 60 22 60 Z" fill={computed.hairInk} />
            <path d="M32 16 L26 26 L36 22 Z" fill={computed.hairAccent} opacity={0.95} />
            <path d="M50 12 L46 24 L54 18 Z" fill={computed.hairAccent} opacity={0.95} />
            <path d="M68 16 L64 26 L74 22 Z" fill={computed.hairAccent} opacity={0.95} />
          </>
        );
      default:
        // Side swoop
        return (
          <>
            <path d="M20 52 C24 18 42 10 54 12 C66 14 78 26 80 52 C78 52 70 48 50 48 C30 48 22 52 20 52 Z" fill={computed.hairInk} />
            <path d="M28 38 C36 30 46 28 56 30 C66 32 72 38 74 46" stroke={computed.hairAccent} strokeWidth="7" strokeLinecap="round" fill="none" />
          </>
        );
    }
  })();

  const eyes = (() => {
    // `eyeStyle`:
    // 0 = normal
    // 1 = wide
    // 2 = sleepy
    const sleepy = computed.eyeStyle === 2;

    return (
      <>
        <circle cx={leftEyeX} cy={computed.eyeY} r={eyeWhiteR} fill={computed.eyeWhite} opacity={sleepy ? 0.85 : 1} />
        <circle cx={rightEyeX} cy={computed.eyeY} r={eyeWhiteR} fill={computed.eyeWhite} opacity={sleepy ? 0.85 : 1} />
        {sleepy ? (
          <>
            <path d={`M${leftEyeX - 10} ${computed.eyeY} Q${leftEyeX} ${computed.eyeY + 2} ${leftEyeX + 10} ${computed.eyeY}`} stroke={computed.pupil} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d={`M${rightEyeX - 10} ${computed.eyeY} Q${rightEyeX} ${computed.eyeY + 2} ${rightEyeX + 10} ${computed.eyeY}`} stroke={computed.pupil} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx={leftPupilX} cy={computed.eyeY} r={pupilR} fill={computed.pupil} />
            <circle cx={rightPupilX} cy={computed.eyeY} r={pupilR} fill={computed.pupil} />
          </>
        )}

        {!sleepy && computed.eyeStyle === 1 && (
          <>
            <circle cx={leftPupilX - 1.2} cy={computed.eyeY - 1.8} r={1.2} fill="rgba(255,255,255,0.9)" />
            <circle cx={rightPupilX - 1.2} cy={computed.eyeY - 1.8} r={1.2} fill="rgba(255,255,255,0.9)" />
          </>
        )}
      </>
    );
  })();

  return (
    <svg
      viewBox="0 0 100 100"
      className={className ? `w-full h-full ${className}` : 'w-full h-full'}
      aria-label={title || 'Player avatar'}
      role="img"
    >
      {/* Head */}
      <circle cx="50" cy="56" r="34" fill={computed.headFill} />
      {/* Hair */}
      {hair}
      {/* Face accessories */}
      {glasses}
      {/* Eyes */}
      {eyes}
      {/* Nose */}
      <path d="M50 58 Q47 66 50 68 Q53 66 50 58" fill={computed.pupil} opacity={0.55} />
      {/* Blush */}
      {computed.blush && (
        <>
          <circle cx="32" cy="70" r="7" fill={computed.accent} opacity={0.22} />
          <circle cx="68" cy="70" r="7" fill={computed.accent} opacity={0.22} />
        </>
      )}
      {/* Mouth */}
      {mouth}
    </svg>
  );
};

