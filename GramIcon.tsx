import React from 'react';

/**
 * Иконка Gram (бывший TON / Toncoin — токен переименован 15 июня 2026
 * после голосования сообщества, 81.22% "за"; сеть по-прежнему называется
 * The Open Network). Официальный дизайн: белая звезда на синем ромбе,
 * фирменный цвет #30A1F5. См. https://ton.org/media
 */
export const GramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="32" height="32" rx="10" fill="#30A1F5" />
    <path
      d="M20 9 L23.5 17.5 L31 20 L23.5 22.5 L20 31 L16.5 22.5 L9 20 L16.5 17.5 Z"
      fill="#FFFFFF"
    />
  </svg>
);
