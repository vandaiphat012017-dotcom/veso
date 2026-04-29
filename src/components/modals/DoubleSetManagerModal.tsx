import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, ArrowRightLeft } from 'lucide-react';
import { LotterySet } from '../../types';

interface DoubleSetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doubleSets: Record<string, string>;
  setDoubleSets: (sets: Record<string, string>) => void;
  lotterySets: LotterySet[];
  defaultDoubleSets: Record<string, string>;
}

export default function DoubleSetManagerModal({
  isOpen,
  onClose,
  doubleSets,
  setDoubleSets,
  lotterySets,
  defaultDoubleSets
}: DoubleSetManagerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Quản Lý Bộ Đôi</h3>
                <p className="text-sm text-slate-500">Thiết lập các cặp bộ số đi cùng nhau khi chọn loại "Bộ Đôi".</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(doubleSets).map(([setA, setB], idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bộ Thứ Nhất</label>
                      <select 
                        value={setA}
                        onChange={(e) => {
                          const newSets = { ...doubleSets };
                          const val = e.target.value;
                          delete newSets[setA];
                          newSets[val] = setB;
                          setDoubleSets(newSets);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {lotterySets.map(s => <option key={s.id} value={s.id}>Bộ {s.id}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-center pt-5">
                      <ArrowRightLeft size={20} className="text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bộ Thứ Hai</label>
                      <select 
                        value={setB}
                        onChange={(e) => {
                          const newSets = { ...doubleSets };
                          newSets[setA] = e.target.value;
                          setDoubleSets(newSets);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {lotterySets.map(s => <option key={s.id} value={s.id}>Bộ {s.id}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        const newSets = { ...doubleSets };
                        delete newSets[setA];
                        setDoubleSets(newSets);
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors mt-5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button 
                  onClick={() => {
                    const availableSets = lotterySets.map(s => s.id).filter(id => !doubleSets[id] && !Object.values(doubleSets).includes(id));
                    if (availableSets.length >= 2) {
                      setDoubleSets({ ...doubleSets, [availableSets[0]]: availableSets[1] });
                    } else {
                      alert("Không còn đủ bộ số trống để tạo cặp mới.");
                    }
                  }}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Thêm Cặp Bộ Đôi Mới
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setDoubleSets(defaultDoubleSets)}
                className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Khôi phục mặc định
              </button>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Lưu & Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
