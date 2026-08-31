import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, User, Gem, Gift, Wallet, ChevronRight, Activity, CircleDashed, ArrowUpCircle, Shield, LayoutGrid } from 'lucide-react';
import { gradients, patterns, getRandomNftStyling } from './nftData';
import defaultGiftsDb from './gifts_data.json';
import { Upgrade } from './components/Upgrade';
import { LiveFeed } from './components/LiveFeed';
import { PremiumImage } from './components/PremiumImage';
import { AdminPanel } from './components/AdminPanel';
import { Inventory } from './components/Inventory';
import { GramIcon } from './components/GramIcon';
import { useTelegramAuth } from './lib/useTelegramAuth';


function UpgradeAnimatedIcon() {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <motion.div
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="absolute inset-1 rounded-full bg-gradient-to-tr from-brand/40 via-violet-500/30 to-cyan-400/40 blur-md pointer-events-none"
      />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <ArrowUpCircle className="w-9 h-9 text-brand drop-shadow-[0_0_8px_rgba(120,120,255,0.5)]" />
      </div>
    </div>
  );
}

function Shop({ onPlayUpgrade, giftsDb }: { onPlayUpgrade: () => void, giftsDb: any[] }) {
  const games = [
    {
      id: 'upgrade',
      name: 'Апгрейд',
      description: 'Улучшай подарок до более редкого — шанс зависит от разницы в цене',
      customIcon: UpgradeAnimatedIcon,
      color: 'from-brand/25 via-violet-500/20 to-cyan-500/25',
      badge: 'HOT'
    }
  ];

  return (
    <div className="space-y-4">
      <LiveFeed />
      <h2 className="font-display text-2xl font-semibold mb-6 px-1">Популярные игры</h2>
      <div className="grid grid-cols-1 gap-4">
        {games.map(game => (
          <div 
            key={game.id} 
            onClick={() => { if (game.id === 'upgrade') onPlayUpgrade(); }}
            className="glass-panel-interactive rounded-2xl p-6 flex flex-col cursor-pointer group"
          >
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} p-[1px] shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
                  <game.customIcon />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-display text-xl font-semibold">{game.name}</h3>
                  {game.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-danger/15 text-danger text-[10px] font-bold uppercase tracking-wider border border-danger/30">
                      {game.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted leading-tight">{game.description}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-muted group-hover:text-[color:var(--color-text)] transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gifts({ giftsDb }: { giftsDb: any[] }) {
  const gifts = giftsDb.map(data => {
    // Генерация цвета и паттерна на основе ID
    const numId = parseInt(data.id) || Math.floor(Math.random() * 100);
    
    return {
      id: data.id,
      name: data.name,
      price: data.floor_price_gram,
      imageByName: data.image_url,
      gradient: gradients[numId % gradients.length],
      pattern: patterns[numId % patterns.length],
      rarityText: data.rarity
    };
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold mb-6 px-1">Подарки NFT</h2>
      <div className="grid grid-cols-2 gap-4">
        {gifts.map(gift => {
          // Define rarity based on price
          let rarity = { label: 'Обычный', color: 'text-muted bg-white/5 border-white/15' };
          if (gift.price > 80) rarity = { label: 'Легендарный', color: 'text-gold bg-gold/10 border-gold/30' };
          else if (gift.price > 50) rarity = { label: 'Эпический', color: 'text-brand bg-brand/10 border-brand/30' };
          else if (gift.price > 20) rarity = { label: 'Редкий', color: 'text-sky-300 bg-sky-400/10 border-sky-400/30' };

          return (
          <div id={`gift-${gift.id}`} key={gift.id} className="facet-card glass-panel-interactive rounded-2xl p-3 flex flex-col items-center cursor-pointer group">
            <div className={`w-full aspect-square rounded-xl overflow-hidden mb-3 relative bg-gradient-to-tr ${gift.gradient}`}>
              <div 
                className="absolute inset-0 opacity-50" 
                style={{ backgroundImage: gift.pattern, backgroundSize: '24px 24px' }}
              />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 z-0" />
              <PremiumImage 
                src={gift.imageByName}
                alt={gift.name}
                className="w-full h-full object-cover relative z-10 drop-shadow-2xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500"
              />
              <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border z-20 backdrop-blur-md ${rarity.color}`}>
                {rarity.label}
              </div>
            </div>
            <div className="w-full text-center relative z-10">
              <div className="text-xs font-medium text-[color:var(--color-text)] mb-1 truncate px-1">{gift.name}</div>
              {gift.price && (
                <div className="flex items-center justify-center gap-1.5 bg-black/40 rounded-lg py-1">
                  <span className="font-display text-xs font-bold text-gold">
                    {gift.price.toFixed(2)}
                  </span>
                  <GramIcon className="w-4 h-4 drop-shadow-md" />
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

    </div>
  );
}

function Profile({ user, inventory, setInventory, balance, setBalance }: { user: any, inventory: any[], setInventory: any, balance: number, setBalance: any }) {
  const firstName = user?.firstName || 'Алексей';
  const username = user?.username ? `@${user.username}` : '@alexey_dev';
  const photoUrl = user?.photoUrl;
  
  const [selectedNft, setSelectedNft] = useState<any>(null);

  const handleSell = (item: any) => {
    const itemPrice = Number(item.price);
    setBalance((prev: number) => Number((prev + itemPrice).toFixed(2)));
    setInventory((prev: any[]) => prev.filter(i => i.uniqueId !== item.uniqueId));
    setSelectedNft(null);
  };

  const handleToggleWithdraw = (item: any) => {
    setInventory((prev: any[]) => prev.map(i => i.uniqueId === item.uniqueId ? { ...i, isWithdrawing: !i.isWithdrawing } : i));
    setSelectedNft((prev: any) => ({ ...prev, isWithdrawing: !prev.isWithdrawing }));
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand to-gold p-[2px] shadow-lg shadow-brand/20">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 bg-white/5" />
               {photoUrl ? (
                 <img src={photoUrl} alt={firstName} className="w-full h-full object-cover relative z-10" />
               ) : (
                 <User className="w-10 h-10 text-muted relative z-10" />
               )}
            </div>
          </div>
          <div className="absolute bottom-2 right-1 w-5 h-5 rounded-full bg-positive border-4 border-canvas-deep" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-1">{firstName}</h2>
        <p className="text-brand font-medium text-sm">{username}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-4 rounded-2xl text-center">
          <div className="text-muted text-[10px] mb-1 font-medium uppercase tracking-wider">Отправлено</div>
          <div className="font-display text-2xl font-semibold">12 <span className="text-sm font-normal text-muted">шт</span></div>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <div className="text-muted text-[10px] mb-1 font-medium uppercase tracking-wider">Получено</div>
          <div className="font-display text-2xl font-semibold">5 <span className="text-sm font-normal text-muted">шт</span></div>
        </div>
      </div>
      
      <div className="glass-panel rounded-2xl overflow-hidden p-5">
        <h3 className="font-display font-semibold mb-4">Мой инвентарь NFT</h3>
        {inventory.length === 0 ? (
          <p className="text-muted text-sm">Инвентарь пуст</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {inventory.map((item, i) => {
              const currentPrice = Number(item.price);
              return (
                <div 
                  key={item.uniqueId || i} 
                  onClick={() => setSelectedNft({ ...item, price: currentPrice })}
                  className={`bg-white/5 border border-hairline rounded-xl p-2 flex flex-col items-center cursor-pointer active:scale-95 transition-transform relative ${item.isWithdrawing ? 'opacity-50' : ''}`}
                >
                  {item.isWithdrawing && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center z-20">
                      <span className="text-[8px] font-bold text-white tracking-wider uppercase rotate-[-20deg] border border-white/20 px-1 py-0.5 rounded backdrop-blur-sm">Вывод</span>
                    </div>
                  )}
                  <div className={`w-full aspect-square rounded-lg p-1 mb-2 relative overflow-hidden bg-gradient-to-tr ${item.gradient || 'from-gray-800 to-gray-900'}`}>
                    <div 
                      className="absolute inset-0 opacity-50" 
                      style={{ backgroundImage: item.pattern, backgroundSize: '24px 24px' }}
                    />
                    <PremiumImage src={item.image_url || `/nft/${item.name}.png`} alt={item.name} className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
                  </div>
                  <div className="text-[10px] font-semibold text-center leading-tight truncate w-full">{item.name}</div>
                  <div className="text-[9px] text-gold font-medium">{currentPrice.toFixed(2)} GRAM</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {['История покупок', 'Способы оплаты', 'Настройки', 'Поддержка'].map((item, i) => (
          <div key={item} className={`flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors active:bg-white/10 ${i !== 0 ? 'border-t border-hairline' : ''}`}>
            <span className="text-sm font-medium">{item}</span>
            <ChevronRight className="w-5 h-5 text-muted" />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedNft && (() => {
          const currentPrice = Number(selectedNft.price);
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedNft(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-[8px]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 shadow-2xl flex flex-col items-center z-50"
              >
                <div className={`w-32 h-32 rounded-2xl p-4 mb-4 relative overflow-hidden bg-gradient-to-tr ${selectedNft.gradient || 'from-gray-800 to-gray-900'}`}>
                  <div 
                    className="absolute inset-0 opacity-50" 
                    style={{ backgroundImage: selectedNft.pattern, backgroundSize: '24px 24px' }}
                  />
                  <PremiumImage src={selectedNft.image_url || `/nft/${selectedNft.name}.png`} alt={selectedNft.name} className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-center mb-1">{selectedNft.name}</h3>
                <p className="text-gold font-medium mb-6">Оценка: {currentPrice.toFixed(2)} GRAM</p>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => handleSell({ ...selectedNft, price: currentPrice })}
                    disabled={selectedNft.isWithdrawing}
                    className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-dim disabled:bg-white/10 disabled:text-muted text-white font-semibold transition-colors shadow-lg active:scale-95"
                  >
                    Продать за {currentPrice.toFixed(2)} GRAM
                  </button>
                  <button 
                    onClick={() => handleToggleWithdraw(selectedNft)}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-colors border active:scale-95 ${selectedNft.isWithdrawing ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-white/5 border-hairline hover:bg-white/10'}`}
                  >
                    {selectedNft.isWithdrawing ? 'Отменить вывод' : 'Вывести NFT на кошелек'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const [giftsDb, setGiftsDb] = useState<any[]>(() => {
    const saved = localStorage.getItem('app_admin_gifts_db');
    return saved ? JSON.parse(saved) : defaultGiftsDb;
  });

  useEffect(() => {
    localStorage.setItem('app_admin_gifts_db', JSON.stringify(giftsDb));
  }, [giftsDb]);

  // Подтягиваем реальные флор-цены с fragment.com и накатываем поверх
  // локальной базы подарков — floor_price_gram больше не выдумка.
  useEffect(() => {
    import('./lib/api').then(({ fetchFragmentPrices }) =>
      fetchFragmentPrices()
        .then((prices) => {
          const bySlug = new Map(prices.map((p) => [p.slug, p]));
          setGiftsDb((prev) =>
            prev.map((g) => {
              const p = g.slug ? bySlug.get(g.slug) : undefined;
              return p && p.floorPriceTon != null ? { ...g, floor_price_gram: p.floorPriceTon } : g;
            })
          );
        })
        .catch((e) => console.warn('Fragment prices unavailable:', e.message))
    );
  }, []);

  // Реальная авторизация через Telegram (проверяется на сервере по initData,
  // см. src/lib/useTelegramAuth.ts). Баланс и инвентарь больше не живут
  // только в localStorage браузера — они привязаны к настоящему Telegram-юзеру
  // и подтягиваются с сервера при входе.
  const auth = useTelegramAuth();
  const user = auth.user;

  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<any[]>([]);

  // Как только авторизация готова — заполняем локальное состояние тем,
  // что реально лежит на сервере для этого юзера.
  useEffect(() => {
    if (auth.status === 'ready') {
      setBalance(auth.balance);
      setInventory(auth.inventory);
    }
  }, [auth.status]);

  // Дебаунс-синк изменений баланса/инвентаря на сервер (источник правды).
  useEffect(() => {
    if (auth.status !== 'ready') return;
    const t = setTimeout(() => auth.syncState(balance, inventory), 600);
    return () => clearTimeout(t);
  }, [balance, inventory, auth.status]);

  useEffect(() => {
    // @ts-ignore
    if (window.Telegram?.WebApp) {
      // @ts-ignore
      const tg = window.Telegram.WebApp;
      tg.setHeaderColor?.('#050508');
      tg.setBackgroundColor?.('#050508');
    }
  }, []);

  const navItems = [
    { id: 'shop', icon: Activity, label: 'Игры' },
    { id: 'gifts', icon: Gift, label: 'Подарки' },
    { id: 'catalog', icon: LayoutGrid, label: 'Каталог' },
    { id: 'profile', icon: User, label: 'Профиль' },
    { id: 'admin', icon: Shield, label: 'Админ' }
  ];

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-white/60 text-sm">
        Авторизация через Telegram…
      </div>
    );
  }

  if (auth.status === 'no_telegram' || auth.status === 'error') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-center px-8">
        <h1 className="font-display text-xl font-semibold">Platina Gift</h1>
        <p className="text-white/60 text-sm max-w-xs">
          {auth.status === 'no_telegram'
            ? 'Открой это приложение через Telegram-бота — вход возможен только с настоящим Telegram-аккаунтом.'
            : `Не удалось войти: ${auth.error}`}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-[color:var(--color-text)] overflow-hidden selection:bg-brand/30">
      {/* Ambient backdrop: a single soft brand glow + faint grid, not a double-blob gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] rounded-full bg-brand/10 blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
          }}
        />
      </div>

      {/* Main Container simulating mobile view bounds on desktop, or full on mobile */}
      <div className="relative z-10 h-[100dvh] w-full max-w-md mx-auto flex flex-col">
        
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between sticky top-0 bg-canvas-deep/70 backdrop-blur-xl z-20 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center -ml-1 drop-shadow-[0_0_12px_rgba(46,143,255,0.45)]">
               <tgs-player 
                 autoplay 
                 loop 
                 mode="normal" 
                 src="/chpic.su_-_Gift_NFT_086.tgs" 
                 style={{ width: '100%', height: '100%', objectFit: 'contain' }}
               ></tgs-player>
            </div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-[color:var(--color-text)]">
              Platina <span className="text-gold">Gift</span>
            </h1>
          </div>
          <button className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-hairline active:scale-95 transition-transform">
            <span className="font-display text-sm font-semibold text-gold">{balance.toFixed(2)}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted">GRAM</span>
            <GramIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto pt-2 pb-6 px-5 scrollbar-hide relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {activeTab === 'shop' && <Shop onPlayUpgrade={() => setActiveGame('upgrade')} giftsDb={giftsDb} />}
              {activeTab === 'gifts' && <Gifts giftsDb={giftsDb} />}
              {activeTab === 'catalog' && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2 px-1">Каталог TON</h2>
                  <Inventory mode="catalog" />
                </div>
              )}
              {activeTab === 'profile' && <Profile user={user} inventory={inventory} setInventory={setInventory} balance={balance} setBalance={setBalance} />}
              {activeTab === 'admin' && <AdminPanel giftsDb={giftsDb} setGiftsDb={setGiftsDb} />}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {activeGame === 'upgrade' && (
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-black"
              >
                <Upgrade onBack={() => setActiveGame(null)} inventory={inventory} setInventory={setInventory} user={user} giftsDb={giftsDb} onWin={auth.recordOpen} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom tab bar — flush, squared, with a thin gold rail marking the active tab
            instead of a floating frosted pill */}
        <AnimatePresence>
          {!activeGame && (
            <motion.nav
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="shrink-0 z-[90] bg-canvas-deep/90 backdrop-blur-xl border-t border-hairline pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex items-stretch">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 outline-none transition-colors ${
                        isActive ? 'text-[color:var(--color-text)]' : 'text-muted hover:text-[color:var(--color-text)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-rail"
                          className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gold rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon size={19} strokeWidth={isActive ? 2.25 : 1.75} />
                      <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}
