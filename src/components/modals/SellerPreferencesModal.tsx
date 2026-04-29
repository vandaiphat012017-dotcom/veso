import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Hash, ChevronDown, Trash2 } from 'lucide-react';
import { Seller, LotterySet, DailyStationConfig } from '../../types';

interface SellerPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string | null;
  sellers: Seller[];
  updateSeller: (id: string, updates: Partial<Seller>) => void;
  lotterySets: LotterySet[];
  dailyInput: any;
  isQuickSelectOpen: boolean;
  setIsQuickSelectOpen: (open: boolean) => void;
}

export default function SellerPreferencesModal({
  isOpen,
  onClose,
  sellerId,
  sellers,
  updateSeller,
  lotterySets,
  dailyInput,
  isQuickSelectOpen,
  setIsQuickSelectOpen
}: SellerPreferencesModalProps) {
  const seller = sellers.find(s => s.id === sellerId);
  if (!seller) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-bold">Sở Thích Người Bán</h3>
                <p className="text-sm opacity-80 font-medium">{seller.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Fixed Set Preference */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-slate-800">Bộ Số Cố Định</h4>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <button 
                    onClick={() => updateSeller(seller.id, { fixedSetId: undefined })}
                    className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all ${!seller.fixedSetId ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                  >
                    Không cố định
                  </button>
                  {lotterySets.map(set => (
                    <button 
                      key={set.id}
                      onClick={() => updateSeller(seller.id, { fixedSetId: set.id })}
                      className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all ${seller.fixedSetId === set.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                      Bộ {set.id}
                    </button>
                  ))}
                </div>
              </section>

              {/* Custom Number Preferences */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hash size={18} className="text-indigo-600" />
                    <h4 className="font-bold text-slate-800">Số Lượng Riêng Biệt</h4>
                  </div>
                  <button 
                    onClick={() => {
                      const prefs = seller.customPreferences || [];
                      updateSeller(seller.id, { customPreferences: [...prefs, { number: '00', quantity: 16 }] });
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    + Thêm số ưu tiên
                  </button>
                </div>

                {/* Quick Select Grid */}
                <div className="mb-6">
                  <button 
                    onClick={() => setIsQuickSelectOpen(!isQuickSelectOpen)}
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 mb-3"
                  >
                    <ChevronDown size={12} className={`transition-transform ${isQuickSelectOpen ? 'rotate-180' : ''}`} />
                    <span>Chọn nhanh từ bảng 100 số (Mặc định 16 tờ)</span>
                  </button>
                  {isQuickSelectOpen && (
                    <div className="grid grid-cols-10 gap-1 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      {Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')).map(num => {
                        const isSelected = (seller.customPreferences || []).some(p => p.number === num);
                        return (
                          <button 
                            key={num}
                            onClick={() => {
                              const prefs = [...(seller.customPreferences || [])];
                              if (isSelected) {
                                updateSeller(seller.id, { customPreferences: prefs.filter(p => p.number !== num) });
                              } else {
                                updateSeller(seller.id, { customPreferences: [...prefs, { number: num, quantity: 16 }] });
                              }
                            }}
                            className={`aspect-square flex items-center justify-center text-[9px] font-bold rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {(seller.customPreferences || []).length > 0 ? (
                    (seller.customPreferences || []).map((pref, idx) => (
                      <div key={idx} className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Con số</label>
                            <input 
                              type="text" 
                              value={pref.number}
                              onChange={(e) => {
                                const newPrefs = [...(seller.customPreferences || [])];
                                newPrefs[idx].number = e.target.value.padStart(2, '0').slice(-2);
                                updateSeller(seller.id, { customPreferences: newPrefs });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                              maxLength={2}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Số lượng vé</label>
                            <select 
                              value={pref.quantity}
                              onChange={(e) => {
                                const newPrefs = [...(seller.customPreferences || [])];
                                newPrefs[idx].quantity = parseInt(e.target.value);
                                updateSeller(seller.id, { customPreferences: newPrefs });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value={16}>16 tờ</option>
                              <option value={32}>32 tờ</option>
                              <option value={160}>160 tờ</option>
                              <option value={320}>320 tờ</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => {
                              const newPrefs = (seller.customPreferences || []).filter((_, i) => i !== idx);
                              updateSeller(seller.id, { customPreferences: newPrefs });
                            }}
                            className="mt-4 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Đài lấy vé</label>
                            <select 
                              value={pref.stationId || ''}
                              onChange={(e) => {
                                const newPrefs = [...(seller.customPreferences || [])];
                                newPrefs[idx].stationId = e.target.value || undefined;
                                updateSeller(seller.id, { customPreferences: newPrefs });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">Tự động (Chính {'>'} Phụ)</option>
                              <option value="main">Đài Chính</option>
                              {(dailyInput?.subStations || []).map((sub: any) => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Ngày áp dụng</label>
                            <select 
                              value={pref.dayOfWeek === undefined ? '' : pref.dayOfWeek}
                              onChange={(e) => {
                                const newPrefs = [...(seller.customPreferences || [])];
                                newPrefs[idx].dayOfWeek = e.target.value === '' ? undefined : parseInt(e.target.value);
                                updateSeller(seller.id, { customPreferences: newPrefs });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">Tất cả các ngày</option>
                              <option value="1">Thứ Hai</option>
                              <option value="2">Thứ Ba</option>
                              <option value="3">Thứ Tư</option>
                              <option value="4">Thứ Năm</option>
                              <option value="5">Thứ Sáu</option>
                              <option value="6">Thứ Bảy</option>
                              <option value="0">Chủ Nhật</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                      Chưa có số ưu tiên nào.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Hoàn Tất
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
