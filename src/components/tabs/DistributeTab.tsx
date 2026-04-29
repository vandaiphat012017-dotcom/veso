import React, { useState } from 'react';
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
  Share2,
  X 
} from 'lucide-react';
import { Seller, DistributionResult, LotterySet, DailyStationConfig, WeeklySchedule, Shortage } from '../../types';
import NumberInventorySummary from '../NumberInventorySummary';

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
  updateSetInventory: (setId: string, type: 'q16' | 'q32', val: number, stationId: string) => void;
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
  manuallyUpdateResult: (sellerId: string, stationId: string, oldNum: string, newNum: string) => void;
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
  getDraftResults,
  manuallyUpdateResult
}: DistributeTabProps) {
  const currentDayOfWeek = new Date(dailyInput.date).getDay();
  const currentConfig = stationConfigs.find(c => c.dayOfWeek === currentDayOfWeek);

  const [editingResult, setEditingResult] = useState<{ sellerId: string, stationId: string, index: number, value: string } | null>(null);

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
        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kho Vé</h3>
                <p className="text-[10px] text-slate-400 font-medium">Nhập tổng vé hiện có (3 đài)</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(() => {
                const schedule = weeklySchedules.find(s => s.dayOfWeek === currentDayOfWeek);
                if (schedule && schedule.isActive) {
                  return (
                    <button 
                      onClick={applyWeeklySchedule}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                      title={`Áp dụng lịch trình (${schedule.mainStationBaseQuantity} vé)`}
                    >
                      <RefreshCw size={16} />
                    </button>
                  );
                }
                return null;
              })()}
              <button 
                onClick={resetPools}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                title="Làm mới kho vé"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <input 
                    type="date" 
                    value={dailyInput.date}
                    onChange={(e) => setDailyInput({ ...dailyInput, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
              </div>
              <button 
                onClick={() => setIsWeeklyScheduleOpen(true)}
                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 border border-slate-100"
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Manual Adjust Component */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative mb-3">
                  <input 
                    type="text"
                    placeholder="Tìm số (00-99)..."
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value.slice(0, 2))}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none shadow-sm"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  {searchNumber.length === 2 && (
                    <button onClick={() => setSearchNumber('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {searchNumber.length === 2 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 text-center flex flex-col gap-1 shadow-sm">
                        <span className="text-[7px] font-bold text-slate-400 uppercase truncate">{currentConfig?.mainStationName || 'Đài Chính'}</span>
                        <div className="flex items-center justify-between">
                          <button onClick={() => adjustInventory(searchNumber, -adjustAmount, 'main')} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><MinusCircle size={14} /></button>
                          <span className="text-xs font-black text-slate-700">{dailyInput.mainStationTickets[searchNumber] || 0}</span>
                          <button onClick={() => adjustInventory(searchNumber, adjustAmount, 'main')} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Plus size={14} /></button>
                        </div>
                      </div>
                      {dailyInput.subStations.map((sub: any) => (
                        <div key={sub.id} className="bg-white p-2 rounded-xl border border-slate-100 text-center flex flex-col gap-1 shadow-sm">
                          <span className="text-[7px] font-bold text-slate-400 uppercase truncate">{sub.name}</span>
                          <div className="flex items-center justify-between">
                            <button onClick={() => adjustInventory(searchNumber, -adjustAmount, sub.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><MinusCircle size={14} /></button>
                            <span className="text-xs font-black text-slate-700">{sub.tickets[searchNumber] || 0}</span>
                            <button onClick={() => adjustInventory(searchNumber, adjustAmount, sub.id)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Plus size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-100">
                        {[1, 16, 32].map(amt => (
                          <button 
                            key={amt}
                            onClick={() => setAdjustAmount(amt)}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded-md transition-all ${adjustAmount === amt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          adjustInventory(searchNumber, -999, 'main');
                          dailyInput.subStations.forEach((sub: any) => adjustInventory(searchNumber, -999, sub.id));
                        }}
                        className="text-[8px] font-bold text-rose-500 uppercase hover:underline"
                      >
                        Xóa số {searchNumber}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400">CHỌN SỐ ĐỂ CHỈNH SỬA</p>
                  </div>
                )}
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Nhập Theo Bộ (3 Đài)</div>
                <button 
                  onClick={() => {
                    setSetInventory({});
                    setDailyInput((prev: any) => ({
                      ...prev,
                      mainStationTickets: {},
                      subStations: prev.subStations.map((s: any) => ({ ...s, tickets: {} }))
                    }));
                  }}
                  className="text-[9px] font-bold text-rose-500 uppercase hover:underline"
                >
                  Xoá hết
                </button>
              </div>

              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide">
                {lotterySets.map(set => (
                  <div key={set.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700">Bộ {set.id}</span>
                        <span className="text-[7px] font-medium text-slate-400 truncate w-32">{set.numbers.join(', ')}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       {/* Main Station Row */}
                       <div className="flex items-center gap-2">
                         <div className="w-12 shrink-0 text-[7px] font-bold text-slate-400 uppercase truncate">
                           {currentConfig?.mainStationName || 'Đài Chính'}
                         </div>
                         <div className="flex-1 grid grid-cols-2 gap-1.5">
                           <input 
                             type="number" 
                             placeholder="16"
                             value={setInventory['main']?.[set.id]?.q16 || ''}
                             onChange={(e) => updateSetInventory(set.id, 'q16', parseInt(e.target.value) || 0, 'main')}
                             className="w-full text-center py-1.5 text-[9px] font-black rounded-lg border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                           />
                           <input 
                             type="number" 
                             placeholder="32"
                             value={setInventory['main']?.[set.id]?.q32 || ''}
                             onChange={(e) => updateSetInventory(set.id, 'q32', parseInt(e.target.value) || 0, 'main')}
                             className="w-full text-center py-1.5 text-[9px] font-black rounded-lg border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                           />
                         </div>
                       </div>
                       
                       {/* Sub Station Rows */}
                       {dailyInput.subStations.map((sub: any) => (
                         <div key={sub.id} className="flex items-center gap-2">
                            <div className="w-12 shrink-0 text-[7px] font-bold text-slate-400 uppercase truncate">
                              {sub.name}
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-1.5">
                              <input 
                                type="number" 
                                placeholder="16"
                                value={setInventory[sub.id]?.[set.id]?.q16 || ''}
                                onChange={(e) => updateSetInventory(set.id, 'q16', parseInt(e.target.value) || 0, sub.id)}
                                className="w-full text-center py-1.5 text-[9px] font-black rounded-lg border border-slate-100 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500"
                              />
                              <input 
                                type="number" 
                                placeholder="32"
                                value={setInventory[sub.id]?.[set.id]?.q32 || ''}
                                onChange={(e) => updateSetInventory(set.id, 'q32', parseInt(e.target.value) || 0, sub.id)}
                                className="w-full text-center py-1.5 text-[9px] font-black rounded-lg border border-slate-100 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <NumberInventorySummary 
          currentPools={currentPools}
          dailyInput={dailyInput}
          searchNumber={searchNumber}
          onNumberClick={(num) => setSearchNumber(num)}
        />
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
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 relative overflow-hidden">
                        {/* Status watermark */}
                        <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12">
                          <CheckCircle2 size={120} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                          <div>
                            <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5 tracking-widest opacity-60">Bộ đã chia</div>
                            <div className="text-sm font-black text-emerald-700">{result?.setNames?.join(' & ') || (result as any)?.setName || ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5 tracking-widest opacity-60">Tổng vé nhận</div>
                            <div className="text-sm font-black text-emerald-700">{result?.totalSheets} TỜ</div>
                          </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                          {((result?.mainStationNumbers || []).length > 0 || result?.mainStationQuantities) && (
                            <div className="bg-white/40 p-2.5 rounded-xl border border-emerald-100/50">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[8px] font-black text-indigo-700 uppercase tracking-wider">
                                  {currentConfig?.mainStationName || 'Đài Chính'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {result?.mainStationNumbers.map((n, idx) => {
                                  const isEditing = editingResult?.sellerId === seller.id && editingResult?.stationId === 'main' && editingResult?.index === idx;
                                  return (
                                    <div key={`${idx}-${n}`} className="relative group">
                                      {isEditing ? (
                                        <input 
                                          autoFocus
                                          type="text"
                                          value={editingResult.value}
                                          onChange={(e) => setEditingResult({ ...editingResult, value: e.target.value.slice(0, 2) })}
                                          onBlur={() => {
                                            if (editingResult.value.length === 2) {
                                              manuallyUpdateResult(seller.id, 'main', n, editingResult.value);
                                            }
                                            setEditingResult(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                            if (e.key === 'Escape') setEditingResult(null);
                                          }}
                                          className="w-10 h-7 text-center bg-indigo-600 text-white rounded-lg text-xs font-black shadow-lg shadow-indigo-200 outline-none border-2 border-white"
                                        />
                                      ) : (
                                        <button 
                                          onClick={() => setEditingResult({ sellerId: seller.id, stationId: 'main', index: idx, value: n })}
                                          className="h-7 w-10 flex items-center justify-center bg-white rounded-lg text-xs font-black text-indigo-700 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                                        >
                                          {n}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {result?.subStationResults.map(sr => (sr.numbers.length > 0) && (
                            <div key={sr.id} className="bg-white/40 p-2.5 rounded-xl border border-emerald-100/50">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider">{sr.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sr.numbers.map((n, idx) => {
                                  const isEditing = editingResult?.sellerId === seller.id && editingResult?.stationId === sr.id && editingResult?.index === idx;
                                  return (
                                    <div key={`${idx}-${n}`} className="relative group">
                                      {isEditing ? (
                                        <input 
                                          autoFocus
                                          type="text"
                                          value={editingResult.value}
                                          onChange={(e) => setEditingResult({ ...editingResult, value: e.target.value.slice(0, 2) })}
                                          onBlur={() => {
                                            if (editingResult.value.length === 2) {
                                              manuallyUpdateResult(seller.id, sr.id, n, editingResult.value);
                                            }
                                            setEditingResult(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                            if (e.key === 'Escape') setEditingResult(null);
                                          }}
                                          className="w-10 h-7 text-center bg-emerald-600 text-white rounded-lg text-xs font-black shadow-lg shadow-emerald-200 outline-none border-2 border-white"
                                        />
                                      ) : (
                                        <button 
                                          onClick={() => setEditingResult({ sellerId: seller.id, stationId: sr.id, index: idx, value: n })}
                                          className="h-7 w-10 flex items-center justify-center bg-emerald-100/50 rounded-lg text-xs font-black text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-sm"
                                        >
                                          {n}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center bg-white/30 rounded-xl p-2 border border-emerald-100/30">
                          <span className="text-[7px] font-bold text-emerald-600/60 uppercase tracking-widest italic">* Nhấp vào số để sửa nhanh</span>
                          <button 
                            onClick={() => handlePrintResults([result!])}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg text-[9px] font-black text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 shadow-sm"
                          >
                            <Printer size={10} />
                            IN PHIẾU
                          </button>
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
