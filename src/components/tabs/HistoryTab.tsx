import { motion } from 'motion/react';
import { History as HistoryIcon } from 'lucide-react';
import { DistributionResult } from '../../types';

interface HistoryTabProps {
  history: DistributionResult[][];
}

export default function HistoryTab({ history }: HistoryTabProps) {
  return (
    <motion.div 
      key="history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {history.length > 0 ? (
        history.map((dayResults, dayIdx) => (
          <div key={dayIdx} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{dayResults[0]?.date || 'Không rõ ngày'}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dayResults.map((res) => (
                <div key={res.sellerId} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-700">{res.sellerName}</span>
                    <span className="text-xs font-bold text-indigo-500">Bộ {res.setNames?.join(', ') || (res as any).setName || ''}</span>
                  </div>
                  <div className="space-y-3">
                    {res.mainStationNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-10">Chính:</span>
                        {res.mainStationNumbers.slice(0, 5).map(n => (
                          <span key={n} className="text-[10px] font-bold w-6 h-6 flex items-center justify-center bg-white rounded border border-slate-100 text-indigo-600">
                            {n}
                          </span>
                        ))}
                        {res.mainStationNumbers.length > 5 && <span className="text-[9px] text-slate-300">+{res.mainStationNumbers.length - 5}</span>}
                      </div>
                    )}
                    {res.subStationResults.map(sr => (
                      <div key={sr.id} className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-10 truncate">{sr.name}:</span>
                        {sr.numbers.slice(0, 5).map(n => (
                          <span key={n} className="text-[10px] font-bold w-6 h-6 flex items-center justify-center bg-indigo-50 rounded border border-indigo-100 text-indigo-700">
                            {n}
                          </span>
                        ))}
                        {sr.numbers.length > 5 && <span className="text-[9px] text-slate-300">+{sr.numbers.length - 5}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 text-slate-400">
          <HistoryIcon size={48} className="mx-auto mb-4 opacity-20" />
          <p>Chưa có lịch sử phân phối.</p>
        </div>
      )}
    </motion.div>
  );
}
