import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Save, Trash2, AlertCircle } from 'lucide-react';
import { Seller, DailyStationConfig } from '../../types';

interface SellerOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller | null;
  updateSeller: (id: string, updates: Partial<Seller>) => void;
  stationConfigs: DailyStationConfig[];
}

export default function SellerOverridesModal({
  isOpen,
  onClose,
  seller,
  updateSeller,
  stationConfigs
}: SellerOverridesModalProps) {
  if (!seller) return null;

  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  const handleToggleOverride = (dayOfWeek: number) => {
    const currentOverrides = { ...(seller.dailyOverrides || {}) };
    if (currentOverrides[dayOfWeek]) {
      delete currentOverrides[dayOfWeek];
    } else {
      currentOverrides[dayOfWeek] = {
        targetTotalTickets: seller.targetTotalTickets,
        mainEnabled: seller.mainEnabled,
        subStationRatios: { ...seller.subStationRatios },
        isEnabled: seller.isEnabled
      };
    }
    updateSeller(seller.id, { dailyOverrides: currentOverrides });
  };

  const updateOverride = (dayOfWeek: number, updates: any) => {
    const currentOverrides = { ...(seller.dailyOverrides || {}) };
    currentOverrides[dayOfWeek] = { ...currentOverrides[dayOfWeek], ...updates };
    updateSeller(seller.id, { dailyOverrides: currentOverrides });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-bold">Cài Đặt Theo Ngày - {seller.name}</h3>
                <p className="text-sm opacity-80 font-medium">Tùy chỉnh cấu hình riêng cho từng thứ trong tuần</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 mb-4">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Thiết lập ở đây sẽ ghi đè lên cài đặt mặc định của người bán vào ngày tương ứng trong tuần.
                  Nếu không bật, cài đặt mặc định sẽ được sử dụng.
                </p>
              </div>

              <div className="space-y-4">
                {dayNames.map((dayName, idx) => {
                  const override = seller.dailyOverrides?.[idx];
                  const config = stationConfigs.find(c => c.dayOfWeek === idx);
                  
                  return (
                    <div key={idx} className={`p-6 rounded-3xl border transition-all ${override ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${override ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                            {idx === 0 ? 'CN' : `T${idx + 1}`}
                          </div>
                          <span className="text-lg font-bold text-slate-700">{dayName}</span>
                        </div>
                        <button 
                          onClick={() => handleToggleOverride(idx)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${override ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                        >
                          {override ? 'Hủy ghi đè' : 'Bật ghi đè'}
                        </button>
                      </div>

                      {override && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-indigo-100/50">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</label>
                              <button 
                                onClick={() => updateOverride(idx, { isEnabled: !override.isEnabled })}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${override.isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                              >
                                {override.isEnabled ? 'Hoạt động' : 'Nghỉ'}
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Tổng vé nhận</label>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="number"
                                  value={override.targetTotalTickets}
                                  onChange={(e) => updateOverride(idx, { targetTotalTickets: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                />
                                <span className="text-xs font-bold text-slate-400">TỜ</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-500 uppercase">{config?.mainStationName || 'Đài Chính'}</label>
                              <button 
                                onClick={() => updateOverride(idx, { mainEnabled: !override.mainEnabled })}
                                className={`w-10 h-5 rounded-full relative transition-colors ${override.mainEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                              >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${override.mainEnabled ? 'right-1' : 'left-1'}`} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ các đài</label>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{config?.mainStationName || 'Đài Chính'}</span>
                                    <span className="text-xs font-black text-indigo-600">{override.subStationRatios?.['main'] ?? 70}%</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="100" step="5"
                                    value={override.subStationRatios?.['main'] ?? 70}
                                    onChange={(e) => {
                                      const ratios = { ...(override.subStationRatios || {}) };
                                      ratios['main'] = parseInt(e.target.value);
                                      updateOverride(idx, { subStationRatios: ratios });
                                    }}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                </div>
                                {config?.subStations.map(sub => (
                                  <div key={sub.id} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{sub.name}</span>
                                      <span className="text-xs font-black text-indigo-600">{override.subStationRatios?.[sub.id] || 0}%</span>
                                    </div>
                                    <input 
                                      type="range" min="0" max="100" step="5"
                                      value={override.subStationRatios?.[sub.id] || 0}
                                      onChange={(e) => {
                                        const ratios = { ...(override.subStationRatios || {}) };
                                        ratios[sub.id] = parseInt(e.target.value);
                                        updateOverride(idx, { subStationRatios: ratios });
                                      }}
                                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4">
               <button 
                onClick={onClose}
                className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
               >
                Thoát
               </button>
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
              >
                <Save size={20} />
                <span>Lưu & Đóng</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
