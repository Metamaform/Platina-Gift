import React, { useState, useEffect } from 'react';
import { PremiumImage } from './PremiumImage';
import { Plus, Trash2, Edit2, Save, X, RotateCcw, Search, DownloadCloud } from 'lucide-react';
import defaultGiftsDb from '../gifts_data.json';
import { fetchTelegramGifts } from '../lib/api';

interface AdminPanelProps {
  giftsDb: any[];
  setGiftsDb: (db: any[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ giftsDb, setGiftsDb }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'api'>('local');
  
  // Local DB State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);

  // API State
  const [apiNfts, setApiNfts] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiFilter, setApiFilter] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [collectionAddress, setCollectionAddress] = useState("EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D");

  const handleSave = () => {
    if (isAdding) {
      const newDb = [...giftsDb, { ...editForm, id: Date.now().toString() }].sort((a, b) => a.floor_price_gram - b.floor_price_gram);
      setGiftsDb(newDb);
      setIsAdding(false);
    } else {
      const newDb = giftsDb.map(g => g.id === editingId ? editForm : g).sort((a, b) => a.floor_price_gram - b.floor_price_gram);
      setGiftsDb(newDb);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот предмет?')) {
      setGiftsDb(giftsDb.filter(g => g.id !== id));
    }
  };

  const handleReset = () => {
    if(confirm('Сбросить до стандартной базы?')) {
       setGiftsDb(defaultGiftsDb);
    }
  };

  const openEdit = (gift: any) => {
    setEditingId(gift.id);
    setEditForm(gift);
    setIsAdding(false);
  };

  const openAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: 'Новый NFT', floor_price_gram: 10, rarity: 'Common', image_url: '' });
  };

  const fetchTonApi = async () => {
    setIsLoadingApi(true);
    setApiError(null);
    try {
      // Routed through our own /api/gifts proxy (server.ts) instead of calling
      // tonapi.io directly from the browser — avoids CORS failures in production
      // and reuses the server-side cache.
      const items = await fetchTelegramGifts(50, 0, collectionAddress);
      const parsedNfts = items.map((item: any) => {
        const meta = item.metadata || {};
        const attributes = meta.attributes || [];

        let rarity = "Common";
        for (const attr of attributes) {
          if (attr.trait_type?.toLowerCase() === 'rarity') {
            rarity = attr.value || 'Common';
          }
        }

        return {
          id: item.index ?? meta.name ?? Date.now().toString(),
          name: meta.name || 'Unknown Gift',
          rarity: rarity,
          floor_price_gram: 15.0, // Default mock price — real floor price isn't exposed by this endpoint
          image_url: meta.image || meta.lottie || meta.lottie_url || '',
        };
      });
      setApiNfts(parsedNfts);
      setApiError(null);
    } catch (error: any) {
      console.error("Failed to fetch NFTs", error);
      setApiError(error.message || 'Сетевая ошибка');
      setApiNfts([]);
    }
    setIsLoadingApi(false);
  };

  useEffect(() => {
    if (activeTab === 'api' && apiNfts.length === 0) {
      fetchTonApi();
    }
  }, [activeTab]);

  const addToLocalDb = (gift: any) => {
    const newDb = [...giftsDb, { ...gift, id: Date.now().toString(), floor_price_gram: 50 }].sort((a, b) => a.floor_price_gram - b.floor_price_gram);
    setGiftsDb(newDb);
    alert(`${gift.name} добавлен в вашу локальную БД!`);
  };

  const filteredApiNfts = apiNfts.filter(nft => nft.name.toLowerCase().includes(apiFilter.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-2 mb-2">
        <h2 className="font-display text-2xl font-semibold">Админ Панель</h2>
        
        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'local' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-muted hover:text-[color:var(--color-text)]'}`}
          >
            Локальная БД
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'api' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-muted hover:text-[color:var(--color-text)]'}`}
          >
            TonAPI (Global)
          </button>
        </div>
      </div>
      
      {activeTab === 'local' && (
        <>
          <div className="flex justify-end gap-2 px-2">
            <button onClick={handleReset} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all" title="Сбросить к заводским настройкам">
              <RotateCcw size={20} />
            </button>
            <button onClick={openAdd} className="p-2.5 bg-brand/20 text-brand rounded-xl hover:bg-brand/30 active:scale-95 transition-all" title="Добавить NFT">
              <Plus size={20} />
            </button>
          </div>

          {(editingId || isAdding) && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-xl mx-2">
               <h3 className="text-white font-bold text-lg">{isAdding ? 'Добавить NFT' : 'Редактировать NFT'}</h3>
               
               <div className="space-y-3">
                 <div>
                   <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1 mb-1 block">Название</label>
                   <input 
                     className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand transition-colors" 
                     value={editForm.name || ''} 
                     onChange={e => setEditForm({...editForm, name: e.target.value})} 
                     placeholder="Diamond" 
                   />
                 </div>
                 
                 <div className="flex gap-3">
                   <div className="flex-1">
                     <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1 mb-1 block">Цена (GRAM)</label>
                     <input 
                       type="number" 
                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand transition-colors" 
                       value={editForm.floor_price_gram || 0} 
                       onChange={e => setEditForm({...editForm, floor_price_gram: Number(e.target.value)})} 
                     />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1 mb-1 block">Редкость</label>
                     <select 
                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand transition-colors appearance-none" 
                       value={editForm.rarity || 'Common'} 
                       onChange={e => setEditForm({...editForm, rarity: e.target.value})}
                     >
                       <option value="Common">Common</option>
                       <option value="Rare">Rare</option>
                       <option value="Epic">Epic</option>
                       <option value="Legendary">Legendary</option>
                       <option value="Mythic">Mythic</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1 mb-1 block">URL Изображения</label>
                   <input 
                     className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand transition-colors" 
                     value={editForm.image_url || ''} 
                     onChange={e => setEditForm({...editForm, image_url: e.target.value})} 
                     placeholder="https://..." 
                   />
                 </div>
               </div>

               <div className="flex gap-3 mt-2">
                 <button onClick={handleSave} className="flex-1 bg-brand hover:bg-brand text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors active:scale-95 shadow-lg shadow-brand/20">
                   <Save size={18}/> Сохранить
                 </button>
                 <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors active:scale-95">
                   <X size={18}/> Отмена
                 </button>
               </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {giftsDb.map(gift => (
              <div key={gift.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-white/5 to-white/10 p-1.5 shrink-0 border border-hairline">
                  <PremiumImage src={gift.image_url} alt={gift.name} />
                </div>
                <div className="flex flex-col flex-1 truncate">
                  <span className="text-white font-bold text-lg truncate drop-shadow-md">{gift.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-emerald-400 text-sm font-black">{gift.floor_price_gram}</span>
                    <span className="text-emerald-400/60 text-[10px] uppercase font-bold tracking-wider">GRAM</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-white/20 bg-white/5 text-white/60">
                      {gift.rarity}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 pr-1">
                  <button onClick={() => openEdit(gift)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors active:scale-95">
                    <Edit2 size={18}/>
                  </button>
                  <button onClick={() => handleDelete(gift.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors active:scale-95">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'api' && (
        <div className="flex flex-col gap-4">
          <div className="px-2">
            <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1 mb-1 block">Адрес NFT Коллекции (TonAPI)</label>
            <input 
              type="text" 
              value={collectionAddress}
              onChange={e => setCollectionAddress(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand transition-colors text-sm"
            />
            <p className="text-[10px] text-muted mt-1 ml-1">
              Например (Telegram Numbers): EQAOQdwdw8kGftJCSFgOErM1mBjYPe4DBPq8-AhF6vr9si5-
            </p>
          </div>

          <div className="flex items-center gap-2 px-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Поиск NFT..."
                value={apiFilter}
                onChange={e => setApiFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-brand transition-colors"
              />
            </div>
            <button onClick={fetchTonApi} disabled={isLoadingApi} className="p-3 bg-brand/20 text-brand rounded-xl hover:bg-brand/30 active:scale-95 transition-all disabled:opacity-50">
              <DownloadCloud size={20} className={isLoadingApi ? "animate-pulse" : ""} />
            </button>
          </div>

          <div className="flex flex-col gap-3 px-2">
            {apiError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm font-medium">
                {apiError}
              </div>
            )}
            {isLoadingApi ? (
              <div className="text-center text-muted py-10 font-medium">Загрузка с TonAPI...</div>
            ) : filteredApiNfts.length === 0 && !apiError ? (
              <div className="text-center text-muted py-10 font-medium">Ничего не найдено</div>
            ) : (
              filteredApiNfts.map(gift => (
                <div key={gift.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-4 hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-white/5 to-white/10 p-1.5 shrink-0 border border-hairline">
                    <PremiumImage src={gift.image_url} alt={gift.name} />
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="text-white font-bold text-lg truncate drop-shadow-md">{gift.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-white/20 bg-white/5 text-white/60">
                        {gift.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 pr-1">
                    <button onClick={() => addToLocalDb(gift)} className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors active:scale-95 flex items-center gap-2 text-sm font-bold px-4">
                      <Plus size={16}/> Добавить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
