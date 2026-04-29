import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Hash } from 'lucide-react';
import { LotterySet } from '../../types';

interface SetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotterySets: LotterySet[];
  setLotterySets: (sets: LotterySet[]) => void;
  updateSetNumber: (setId: string, index: number, value: string) => void;
  defaultLotterySets: LotterySet[];
}

export default function SetManagerModal({
  isOpen,
  onClose,
  lotterySets,
  setLotterySets,
  updateSetNumber,
  defaultLotterySets
}: SetManagerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Quản Lý Các Bộ Số</h3>
                <p className="text-sm text-slate-500">Chỉnh sửa hoặc thêm mới các bộ số để hệ thống tự động chia.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const newId = (lotterySets.length + 1).toString().padStart(2, '0');
                    setLotterySets([...lotterySets, { id: newId, numbers: Array(10).fill('00') }]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all"
                >
                  <Plus size={16} />
                  Thêm Bộ Mới
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lotterySets.map((set) => (
                  <div key={set.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">
                    <button 
                      onClick={() => {
                        if (confirm(`Xoá bộ số ${set.id}?`)) {
                          setLotterySets(lotterySets.filter(s => s.id !== set.id));
                        }
                      }}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Mã Bộ:</span>
                        <input 
                          type="text"
                          value={set.id}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setLotterySets(lotterySets.map(s => s.id === set.id ? { ...s, id: newId } : s));
                          }}
                          className="w-12 bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Số lượng:</span>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={set.numbers.length}
                            onChange={(e) => {
                              const newSize = parseInt(e.target.value) || 0;
                              let newNumbers = [...set.numbers];
                              if (newSize > newNumbers.length) {
                                newNumbers = [...newNumbers, ...Array(newSize - newNumbers.length).fill('00')];
                              } else {
                                newNumbers = newNumbers.slice(0, newSize);
                              }
                              setLotterySets(lotterySets.map(s => s.id === set.id ? { ...s, numbers: newNumbers } : s));
                            }}
                            className="w-12 bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <Hash size={12} />
                          {set.numbers.length} con số
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {set.numbers.map((num, idx) => (
                        <div key={idx} className="relative group/num">
                          <input 
                            type="text"
                            value={num}
                            onChange={(e) => updateSetNumber(set.id, idx, e.target.value)}
                            className="w-full text-center py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            maxLength={2}
                          />
                          <button 
                            onClick={() => {
                              const newNumbers = set.numbers.filter((_, i) => i !== idx);
                              setLotterySets(lotterySets.map(s => s.id === set.id ? { ...s, numbers: newNumbers } : s));
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/num:opacity-100 transition-all shadow-sm"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <button 
                        onClick={() => {
                          if (confirm(`Xoá tất cả số trong bộ ${set.id}?`)) {
                            setLotterySets(lotterySets.map(s => s.id === set.id ? { ...s, numbers: [] } : s));
                          }
                        }}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        Xóa tất cả số
                      </button>
                      <button 
                        onClick={() => {
                          const newNumbers = [...set.numbers, '00'];
                          setLotterySets(lotterySets.map(s => s.id === set.id ? { ...s, numbers: newNumbers } : s));
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        + Thêm số vào bộ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn khôi phục bộ số mặc định?')) {
                    setLotterySets(defaultLotterySets);
                  }
                }}
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
