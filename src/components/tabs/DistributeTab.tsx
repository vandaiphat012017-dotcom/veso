import { motion } from 'motion/react';
import { 
  Calendar, 
  RefreshCw, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  MinusCircle, 
  ChevronDown, 
  Users, 
  CheckCircle2, 
  Play, 
  Star, 
  Printer, 
  Ticket, 
  ArrowRight, 
  Download, 
  Share2 
} from 'lucide-react';
import { Seller, DistributionResult, LotterySet, DailyStationConfig, WeeklySchedule, Shortage } from '../../types';

interface DistributeTabProps {
  dailyInput: any;
  setDailyInput: (input: any) => void;
  weeklySchedules: WeeklySchedule[];
  applyWeeklySchedule: () => void;
  resetPools: () => void;
  setIsWeeklyScheduleOpen: (open: boolean) => void;
  searchNumber: string;
  setSearchNumber: (num: string) => void;
  adjustAmount: number;
  setAdjustAmount: (amt: number) => void;
  adjustInventory: (num: string, amt: number, station: string) => void;
  editingStation: string;
  setEditingStation: (station: string) => void;
  stationConfigs: DailyStationConfig[];
  lotterySets: LotterySet[];
  setInventory: Record<string, Record<string, { q16: number, q32: number }>>;
  setSetInventory: (inv: any) => void;
  updateSetInventory: (setId: string, type: 'q16' | 'q32', val: number) => void;
  updateTicketQuantity: (num: string, qty: number, station: string) => void;
  sellers: Seller[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleDistribute: (sellerId?: string) => void;
  isProcessing: boolean;
  results: DistributionResult[];
  setResults: (res: DistributionResult[]) => void;
  setCurrentPools: (pools: any) => void;
  updateSeller: (id: string, updates: Partial<Seller>) => void;
  setEditingSellerId: (id: string) => void;
  setIsSellerPrefOpen: (open: boolean) => void;
  currentPools: any;
  currentRatio: number;
  handlePrintResults: (res: DistributionResult[]) => void;
  getDraftResults: () => DistributionResult[];
}

export default function DistributeTab({
  dailyInput,
  setDailyInput,
  weeklySchedules,
  applyWeeklySchedule,
  resetPools,
  setIsWeeklyScheduleOpen,
  searchNumber,
  setSearchNumber,
  adjustAmount,
  setAdjustAmount,
  adjustInventory,
  editingStation,
  setEditingStation,
  stationConfigs,
  lotterySets,
  setInventory,
  setSetInventory,
  updateSetInventory,
  updateTicketQuantity,
  sellers,
  searchTerm,
  setSearchTerm,
  handleDistribute,
  isProcessing,
  results,
  setResults,
  setCurrentPools,
  updateSeller,
  setEditingSellerId,
  setIsSellerPrefOpen,
  currentPools,
  currentRatio,
  handlePrintResults,
  getDraftResults
}: DistributeTabProps) {
  const currentDayOfWeek = new Date(dailyInput.date).getDay();
  const currentConfig = stationConfigs.find(c => c.dayOfWeek === currentDayOfWeek);

  return (
    <motion.div 
      key="distribute"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Input Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Kho Vé Ngày</h3>
                <p className="text-xs text-slate-400 font-medium">Nhập tổng vé hiện có</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(() => {
                const schedule = weeklySchedules.find(s => s.dayOfWeek === currentDayOfWeek);
                if (schedule && schedule.isActive) {
                  return (
                    <button 
                      onClick={applyWeeklySchedule}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                      title={`Áp dụng lịch trình (${schedule.mainStationBaseQuantity} vé)`}
                    >
                      <RefreshCw size={20} />
                    </button>
                  );
                }
                return null;
              })()}
              <button 
                onClick={resetPools}
                className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                title="Làm mới kho vé"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ngày Phân Phối</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input 
                    type="date" 
                    value={dailyInput.date}
                    onChange={(e) => setDailyInput({ ...dailyInput, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>
              <div className="pt-5">
                <button 
                  onClick={() => setIsWeeklyScheduleOpen(true)}
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100"
                  title="Lịch trình hàng tuần"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Tìm số (00-99)..."
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value.slice(0, 2))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    className="w-16 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => searchNumber.length === 2 && adjustInventory(searchNumber, adjustAmount, editingStation)}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => searchNumber.length === 2 && adjustInventory(searchNumber, -adjustAmount, editingStation)}
                    className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                  >
                    <MinusCircle size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setEditingStation('main')}
                className={`flex-1 min-w-[100px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${editingStation === 'main' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}
              >
                <div className="text-[8px] font-bold text-slate-400 uppercase mb-1 relative z-10">
                  {currentConfig?.mainStationName || 'Đài Chính'}
                </div>
                <div className="text-lg font-black text-slate-800 relative z-10">{(Object.values(dailyInput.mainStationTickets) as number[]).reduce((a, b) => a + b, 0)}</div>
                {editingStation === 'main' && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-600/5 rounded-full" />}
              </button>
              {(dailyInput?.subStations || []).map((sub: any) => {
                const subConfig = currentConfig?.subStations.find(s => s.id === sub.id);
                return (
                  <button 
                    key={sub.id}
                    onClick={() => setEditingStation(sub.id)}
                    className={`flex-1 min-w-[100px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${editingStation === sub.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-1 relative z-10">{subConfig?.name || sub.name}</div>
                    <div className="text-lg font-black text-slate-800 relative z-10">{(Object.values(sub.tickets || {}) as number[]).reduce((a, b) => a + b, 0)}</div>
                    {editingStation === sub.id && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-emerald-500/5 rounded-full" />}
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase">Nhập theo Bộ (16/32 vé)</div>
                <button 
                  onClick={() => {
                    setSetInventory((prev: any) => ({ ...prev, [editingStation]: {} }));
                    setDailyInput((prev: any) => {
                      if (editingStation === 'main') return { ...prev, mainStationTickets: {} };
                      return {
                        ...prev,
                        subStations: prev.subStations.map((s: any) => s.id === editingStation ? { ...s, tickets: {} } : s)
                      };
                    });
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Xoá hết
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                {lotterySets.map(set => {
                  const inv = setInventory[editingStation]?.[set.id] || { q16: 0, q32: 0 };
                  return (
                    <div key={set.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">Bộ {set.id}</span>
                          <span className="text-[8px] font-medium text-slate-400 truncate w-32">{set.numbers.join(', ')}</span>
                        </div>
                        <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {inv.q16 * 16 + inv.q32 * 32} vé/số
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Bộ 16 vé</label>
                          <input 
                            type="number" 
                            value={inv.q16 || ''}
                            onChange={(e) => updateSetInventory(set.id, 'q16', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Bộ 32 vé</label>
                          <input 
                            type="number" 
                            value={inv.q32 || ''}
                            onChange={(e) => updateSetInventory(set.id, 'q32', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Panel */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chia Từng Người</h3>
                <p className="text-xs text-slate-400 font-medium">Xử lý phân phối riêng biệt</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Tìm người bán..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48"
                />
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={applyWeeklySchedule}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  Áp dụng lịch
                </button>
                <button 
                  onClick={() => handleDistribute()}
                  disabled={isProcessing || sellers.filter(s => s.isEnabled).every(s => results.some(r => r.sellerId === s.id))}
                  className="text-[10px] font-bold text-indigo-600 hover:underline disabled:opacity-50"
                >
                  Chia tất cả
                </button>
                <button 
                  onClick={() => {
                    setResults([]);
                    const initialSubPools: Record<string, Record<string, number>> = {};
                    dailyInput.subStations.forEach((s: any) => {
                      initialSubPools[s.id] = { ...s.tickets };
                    });
                    setCurrentPools({
                      main: { ...dailyInput.mainStationTickets },
                      subPools: initialSubPools
                    });
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Xóa kết quả
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {sellers
              .filter(s => s.isEnabled && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(seller => {
                const isDistributed = results.some(r => r.sellerId === seller.id);
                const result = results.find(r => r.sellerId === seller.id);
                
                return (
                  <div key={seller.id} className={`p-6 rounded-[32px] border transition-all ${isDistributed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDistributed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {seller.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 truncate max-w-[140px]">{seller.name}</span>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                              {seller.targetTotalTickets} TỜ
                            </span>
                          </div>
                          {!isDistributed && (
                            <div className="flex items-center gap-2 mt-1">
                              <button 
                                onClick={() => updateSeller(seller.id, { mainEnabled: !seller.mainEnabled })}
                                className={`px-2 py-0.5 rounded text-[8px] font-bold transition-colors ${seller.mainEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                              >
                                Chính
                              </button>
                              {(dailyInput?.subStations || []).map((sub: any) => (
                                <span key={sub.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded uppercase">
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {(seller.customPreferences || []).length > 0 && !isDistributed && (
                            <div className="mt-3 flex flex-wrap gap-1 items-center">
                              <div className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                <Star size={8} fill="currentColor" />
                                <span>SỞ THÍCH:</span>
                              </div>
                              {seller.customPreferences?.map((pref, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[8px] font-bold rounded border border-slate-200">
                                  {pref.number} ({pref.quantity}t)
                                </span>
                              ))}
                              <button 
                                onClick={() => {
                                  setEditingSellerId(seller.id);
                                  setIsSellerPrefOpen(true);
                                }}
                                className="text-[8px] font-bold text-indigo-600 hover:underline ml-1"
                              >
                                Sửa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isDistributed ? (
                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Hoàn tất</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleDistribute(seller.id)}
                          disabled={isProcessing}
                          className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2"
                        >
                          {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                          <span>Chia ngay</span>
                        </button>
                      )}
                    </div>

                    {!isDistributed ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Loại Bộ</label>
                            <select 
                              value={seller.setType}
                              onChange={(e) => updateSeller(seller.id, { setType: e.target.value as 'single' | 'double' })}
                              className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="single">Bộ Đơn (10 số)</option>
                              <option value="double">Bộ Đôi (20 số)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bộ Số</label>
                            <select 
                              value={seller.manualSetId || ''}
                              onChange={(e) => updateSeller(seller.id, { manualSetId: e.target.value || undefined, isAutoMode: !e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Tự động xoay vòng</option>
                              {lotterySets.map(set => (
                                <option key={set.id} value={set.id}>Bộ {set.id}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Số Tờ/Số</label>
                            <select 
                              value={seller.sheetsOption}
                              onChange={(e) => {
                                const option = e.target.value as '16' | '32' | 'custom';
                                const sheets = option === '16' ? 16 : option === '32' ? 32 : (seller.customSheets || 10);
                                updateSeller(seller.id, { 
                                  sheetsOption: option,
                                  targetTotalTickets: sheets * (seller.setType === 'single' ? 10 : 20)
                                });
                              }}
                              className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="16">16 tờ/số</option>
                              <option value="32">32 tờ/số</option>
                              <option value="custom">Tùy chỉnh</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phân bổ đài</label>
                            <div className="flex bg-slate-50 p-1 rounded-xl">
                              <button 
                                onClick={() => updateSeller(seller.id, { allocationMode: 'auto' })}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${seller.allocationMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                              >
                                Tự động
                              </button>
                              <button 
                                onClick={() => updateSeller(seller.id, { allocationMode: 'manual' })}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${seller.allocationMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                              >
                                Tùy chỉnh
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                              {seller.allocationMode === 'manual' ? 'Vé Đài Chính' : 'Tổng Vé Lấy'}
                            </label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={seller.targetTotalTickets}
                                onChange={(e) => updateSeller(seller.id, { targetTotalTickets: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Tờ</span>
                            </div>
                          </div>
                          {seller.allocationMode === 'auto' && seller.mainEnabled && (
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Tỷ lệ Đài Chính</label>
                                  <span className="text-[10px] font-bold text-indigo-600">{seller.customRatio !== undefined ? seller.customRatio : currentRatio}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" max="100" step="5"
                                  value={seller.customRatio !== undefined ? seller.customRatio : currentRatio}
                                  onChange={(e) => updateSeller(seller.id, { customRatio: parseInt(e.target.value) })}
                                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>
                              {(dailyInput?.subStations || []).map((sub: any) => (
                                <div key={sub.id}>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Tỷ lệ {sub.name}</label>
                                    <span className="text-[10px] font-bold text-indigo-600">{seller.subStationRatios?.[sub.id] || 0}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" max="100" step="5"
                                    value={seller.subStationRatios?.[sub.id] || 0}
                                    onChange={(e) => {
                                      const newRatios = { ...(seller.subStationRatios || {}) };
                                      newRatios[sub.id] = parseInt(e.target.value);
                                      updateSeller(seller.id, { subStationRatios: newRatios });
                                    }}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5">Bộ đã chia</div>
                            <div className="text-xs font-black text-emerald-700">{result?.setNames?.join(', ') || (result as any)?.setName || ''}</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5">Tổng vé nhận</div>
                            <div className="text-xs font-black text-emerald-700">{result?.totalSheets} tờ</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {result?.mainStationNumbers.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-[8px] font-bold text-slate-400 uppercase mr-1">Chính:</span>
                              {result?.mainStationNumbers.map(n => (
                                <span key={n} className="px-1.5 py-0.5 bg-white rounded text-[10px] font-bold text-emerald-600 border border-emerald-100">{n}</span>
                              ))}
                            </div>
                          )}
                          {result?.subStationResults.map(sr => sr.numbers.length > 0 && (
                            <div key={sr.id} className="flex flex-wrap gap-1 items-center">
                              <span className="text-[8px] font-bold text-slate-400 uppercase mr-1 truncate max-w-[40px]">{sr.name}:</span>
                              {sr.numbers.map(n => (
                                <span key={n} className="px-1.5 py-0.5 bg-emerald-100 rounded text-[10px] font-bold text-emerald-700">{n}</span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
