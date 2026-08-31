import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PremiumImage } from './PremiumImage';

interface RealDrop {
  id: string;
  ts: string;
  firstName: string;
  gift: { name: string; image_url?: string; slug?: string };
  price: number;
}

const POLL_MS = 3000;

// Лента больше не рандомная симуляция — только реальные открытия реальных
// юзеров, записанные сервером в момент фактического выигрыша (см. /api/opens).
export const LiveFeed: React.FC = () => {
  const [drops, setDrops] = useState<RealDrop[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetch('/api/opens/recent?limit=10')
        .then((res) => res.json())
        .then((data: RealDrop[]) => {
          if (!cancelled) {
            setDrops(data);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loaded && drops.length === 0) {
    return null; // нечего показывать — не подсовываем фейк вместо пустой ленты
  }

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest px-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live Drops
      </h3>
      <div className="flex flex-row gap-2 h-[50px] relative overflow-hidden px-1 w-full items-center">
        <AnimatePresence>
          {drops.map((drop) => (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, x: -20, scale: 0.5 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-tr from-white/5 to-white/10 p-1.5 shrink-0 border border-white/5 shadow-lg flex items-center justify-center"
              title={`${drop.firstName} — ${drop.gift.name}`}
            >
              <PremiumImage src={drop.gift.image_url} alt={drop.gift.name} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-canvas-deep to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};
