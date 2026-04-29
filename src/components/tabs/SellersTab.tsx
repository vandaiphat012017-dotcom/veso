import { motion } from 'motion/react';
import { 
  Users, 
  RefreshCw, 
  Plus, 
  Printer, 
  Star, 
  Trash2, 
  Settings, 
  Hash 
} from 'lucide-react';
import { Seller, DistributionResult, LotterySet } from '../../types';

interface SellersTabProps {
  sellers: Seller[];
  setSellers: (sellers: Seller[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  updateSeller: (id: string, updates: Partial<Seller>) => void;
  addSeller: () => void;
  handlePrintResults: (res: DistributionResult[]) => void;
  results: DistributionResult[];
  dailyInput: any;
  lotterySets: LotterySet[];
  setEditingSellerId: (id: string) => void;
  setIsSellerPrefOpen: (open: boolean) => void;
  INITIAL_SELLERS: Seller[];
}

export default function SellersTab({
  sellers,
  setSellers,
  searchTerm,
  setSearchTerm,
  updateSeller,
  addSeller,
  handlePrintResults,
  results,
  dailyInput,
  lotterySets,
  setEditingSellerId,
  setIsSellerPrefOpen,
  INITIAL_SELLERS
}: SellersTabProps) {
  return (
    <motion.div 
      key="sellers"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Danh Sách Người Bán</h2>
          <p className="text-sm text-slate-500">Quản lý thông tin và cấu hình chia vé cho từng người.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Tìm người bán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
            />
            <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button 
            onClick={() => {
              if (confirm('Khôi phục danh sách người bán mặc định?')) {
                setSellers(INITIAL_SELLERS);
                localStorage.removeItem('lottery_sellers');
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            <RefreshCw size={18} />
            Đặt lại
          </button>
          <button 
            onClick={addSeller}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Thêm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Trạng Thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Người Bán</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Đài</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Loại Bộ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Số Tờ/Số</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tổng Vé (C+P)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-500" />
                  <span>Sở Thích</span>
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Bộ Hiện Tại</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sellers
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((seller) => (
                <tr key={seller.id} className={`hover:bg-slate-50/50 transition-colors ${!seller.isEnabled ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => updateSeller(seller.id, { isEnabled: !seller.isEnabled })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${seller.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${seller.isEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={seller.name}
                      onChange={(e) => updateSeller(seller.id, { name: e.target.value })}
                      className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 p-0 w-full"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateSeller(seller.id, { mainEnabled: !seller.mainEnabled })}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${seller.mainEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                          Chính
                        </button>
                        <input 
                          type="number" 
                          value={seller.customRatio || 70}
                          onChange={(e) => updateSeller(seller.id, { customRatio: parseInt(e.target.value) || 0 })}
                          className="w-12 bg-slate-100 border-none rounded text-[10px] font-bold text-slate-600 px-1 py-0.5 outline-none"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                      {(dailyInput?.subStations || []).map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 w-12 truncate">{sub.name}</span>
                          <input 
                            type="number" 
                            value={seller.subStationRatios?.[sub.id] || 0}
                            onChange={(e) => {
                              const newRatios = { ...(seller.subStationRatios || {}) };
                              newRatios[sub.id] = parseInt(e.target.value) || 0;
                              updateSeller(seller.id, { subStationRatios: newRatios });
                            }}
                            className="w-12 bg-slate-100 border-none rounded text-[10px] font-bold text-slate-600 px-1 py-0.5 outline-none"
                          />
                          <span className="text-[10px] text-slate-400">%</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={seller.setType}
                      onChange={(e) => updateSeller(seller.id, { setType: e.target.value as 'single' | 'double' })}
                      className="bg-slate-100 border-none rounded-lg text-sm font-semibold text-slate-600 px-3 py-1.5 outline-none"
                    >
                      <option value="single">Đơn</option>
                      <option value="double">Đôi</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <select 
                        value={seller.sheetsOption}
                        onChange={(e) => updateSeller(seller.id, { sheetsOption: e.target.value as any })}
                        className="bg-slate-100 border-none rounded-lg text-sm font-semibold text-slate-600 px-3 py-1.5 outline-none"
                      >
                        <option value="16">Cố định 16</option>
                        <option value="32">Cố định 32</option>
                        <option value="custom">Tùy chỉnh</option>
                      </select>
                      {seller.sheetsOption === 'custom' && (
                        <input 
                          type="number"
                          value={seller.customSheets || 16}
                          onChange={(e) => updateSeller(seller.id, { customSheets: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-slate-100 border-none rounded text-[10px] font-bold text-slate-600 px-1 py-0.5 outline-none"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={seller.targetTotalTickets}
                        onChange={(e) => updateSeller(seller.id, { targetTotalTickets: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-slate-100 border-none rounded text-xs font-bold text-slate-700 px-2 py-1 outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tờ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        setEditingSellerId(seller.id);
                        setIsSellerPrefOpen(true);
                      }}
                      className="flex items-center gap-1 text-indigo-600 hover:underline text-xs font-bold"
                    >
                      <Settings size={14} />
                      Cài đặt ({(seller.customPreferences || []).length})
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={seller.manualSetId || ''}
                      onChange={(e) => updateSeller(seller.id, { manualSetId: e.target.value || undefined, isAutoMode: !e.target.value })}
                      className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-2 py-1 outline-none"
                    >
                      <option value="">Tự động</option>
                      {lotterySets.map(set => (
                        <option key={set.id} value={set.id}>Bộ {set.id}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        if (confirm(`Xóa người bán ${seller.name}?`)) {
                          setSellers(sellers.filter(s => s.id !== seller.id));
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
