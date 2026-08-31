import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { getRandomNftStyling } from '../nftData';
import { PremiumImage } from './PremiumImage';
import { GramIcon } from './GramIcon';

interface UpgradeProps {
  onBack: () => void;
  inventory: any[];
  setInventory: any;
  user?: any;
  giftsDb: any[];
  onWin?: (gift: { name: string; image_url?: string; slug?: string }, price: number) => void;
}

// Шанс апгрейда = отношение цены своего предмета к цене цели, с house edge 10%,
// зажатое в разумных пределах — так же считают на реальных Tonnel/Portals-апгрейдах.
const HOUSE_EDGE = 0.9;
const MIN_CHANCE = 2;
const MAX_CHANCE = 95;

function computeChance(sourcePrice: number, targetPrice: number): number {
  if (targetPrice <= 0) return 0;
  const raw = (sourcePrice / targetPrice) * 100 * HOUSE_EDGE;
  return Math.min(MAX_CHANCE, Math.max(MIN_CHANCE, raw));
}

export function Upgrade({ onBack, inventory, setInventory, user, giftsDb, onWin }: UpgradeProps) {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [needleAngle, setNeedleAngle] = useState(0);

  const source = inventory.find((i) => i.uniqueId === sourceId) || null;
  const sourcePrice = source?.price ?? 0;

  // Цели апгрейда — из каталога подарков, дороже, чем выбранный источник.
  const targets = useMemo(
    () => giftsDb.filter((g) => g.floor_price_gram > sourcePrice).sort((a, b) => a.floor_price_gram - b.floor_price_gram),
    [giftsDb, sourcePrice]
  );

  const target = targets.find((g) => g.id === targetId) || null;
  const chance = source && target ? computeChance(sourcePrice, target.floor_price_gram) : 0;
  const multiplier = source && target && sourcePrice > 0 ? target.floor_price_gram / sourcePrice : 0;

  const canUpgrade = !!source && !!target && !spinning;

  const handleUpgrade = () => {
    if (!source || !target) return;
    setSpinning(true);
    setResult(null);

    const win = Math.random() * 100 < chance;

    // Needle крутится несколько оборотов и останавливается либо в зелёной,
    // либо в красной зоне гейджа — угол считаем заранее, чтобы совпал с итогом.
    const zoneAngle = win ? Math.random() * (chance / 100) * 360 : 360 - Math.random() * ((100 - chance) / 100) * 360;
    const spins = 4;
    setNeedleAngle(spins * 360 + zoneAngle);

    setTimeout(() => {
      if (win) {
        const wonItem = { ...target, ...getRandomNftStyling(), uniqueId: Math.random().toString(), price: target.floor_price_gram };
        setInventory((prev: any[]) => [wonItem, ...prev.filter((i) => i.uniqueId !== source.uniqueId)]);
        onWin?.({ name: target.name, image_url: target.image_url, slug: target.slug }, target.floor_price_gram);
      } else {
        setInventory((prev: any[]) => prev.filter((i) => i.uniqueId !== source.uniqueId));
      }
      setResult(win ? 'win' : 'lose');
      setSpinning(false);
      setSourceId(null);
      setTargetId(null);
    }, 2600);
  };

  return (
    <div className="h-full w-full flex flex-col bg-canvas text-white">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-hairline shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-semibold">Апгрейд</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Gauge */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1f2b" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="10"
                strokeDasharray={`${(chance / 100) * 264} 264`}
                strokeLinecap="round"
              />
            </svg>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: spinning ? needleAngle : 0 }}
              transition={{ duration: spinning ? 2.4 : 0, ease: [0.15, 0.85, 0.35, 1] }}
            >
              <div className="w-1.5 h-16 bg-white rounded-full origin-bottom translate-y-[-32px]" />
            </motion.div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{chance ? chance.toFixed(1) : '0'}%</span>
              <span className="text-[11px] text-muted uppercase tracking-wide">шанс</span>
            </div>
          </div>
          {multiplier > 0 && (
            <span className="text-[13px] text-muted">
              Множитель <span className="text-white font-semibold">x{multiplier.toFixed(2)}</span>
            </span>
          )}
        </div>

        {/* Source picker */}
        <div>
          <h3 className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2 px-1">Твой предмет</h3>
          {inventory.length === 0 ? (
            <p className="text-muted text-sm px-1">Инвентарь пуст — нечего апгрейдить.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {inventory.map((item) => (
                <button
                  key={item.uniqueId}
                  onClick={() => setSourceId(item.uniqueId)}
                  className={`shrink-0 w-20 rounded-2xl border p-2 flex flex-col items-center gap-1 transition-colors ${
                    sourceId === item.uniqueId ? 'border-brand bg-brand/10' : 'border-hairline bg-surface'
                  }`}
                >
                  <div className="w-14 h-14"><PremiumImage src={item.image_url} alt={item.name} /></div>
                  <span className="text-[10px] text-muted truncate w-full text-center">{item.price} GRAM</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-muted rotate-90" /></div>

        {/* Target picker */}
        <div>
          <h3 className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2 px-1">Цель апгрейда</h3>
          {!source ? (
            <p className="text-muted text-sm px-1">Сначала выбери свой предмет.</p>
          ) : targets.length === 0 ? (
            <p className="text-muted text-sm px-1">Нет подарков дороже этого предмета.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {targets.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setTargetId(g.id)}
                  className={`shrink-0 w-20 rounded-2xl border p-2 flex flex-col items-center gap-1 transition-colors ${
                    targetId === g.id ? 'border-brand bg-brand/10' : 'border-hairline bg-surface'
                  }`}
                >
                  <div className="w-14 h-14"><PremiumImage src={g.image_url} alt={g.name} /></div>
                  <span className="text-[10px] text-muted truncate w-full text-center">{g.floor_price_gram} GRAM</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-hairline shrink-0">
        <button
          onClick={handleUpgrade}
          disabled={!canUpgrade}
          className="w-full py-4 rounded-2xl font-bold text-[15px] bg-brand text-black disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {spinning ? 'Крутим…' : 'Апгрейд'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-3 border ${
                result === 'win' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-danger/10 border-danger/30'
              }`}
            >
              <button onClick={() => setResult(null)} className="self-end -mt-2 -mr-2 text-muted"><X className="w-5 h-5" /></button>
              <h3 className="font-display text-xl font-bold">{result === 'win' ? 'Апгрейд успешен!' : 'Не повезло'}</h3>
              <p className="text-muted text-sm text-center">
                {result === 'win' ? 'Предмет заменён на более редкий.' : 'Предмет потерян. Попробуй ещё раз.'}
              </p>
              <button
                onClick={() => setResult(null)}
                className="mt-2 w-full py-3 rounded-xl bg-white/10 font-semibold text-sm"
              >
                Ок
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
