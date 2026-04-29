import React, { useState } from 'react';
import { Ticket, Users, Layers } from 'lucide-react';
import { DailyInput } from '../types';

interface NumberInventorySummaryProps {
  currentPools: {
    main: Record<string, number>;
    subPools: Record<string, Record<string, number>>;
  };
  dailyInput: DailyInput;
  onNumberClick?: (num: string) => void;
  searchNumber?: string;
}

export default function NumberInventorySummary({ 
  currentPools, 
  dailyInput,
  onNumberClick,
  searchNumber 
}: NumberInventorySummaryProps) {
  const [viewStation, setViewStation] = useState<'main' | string>('main');
  const allNumbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
  
  const getRemainingCount = (num: string, station: 'main' | string) => {
    if (station === 'main') return currentPools.main[num] || 0;
    return currentPools.subPools[station]?.[num] || 0;
  };

  const getInitialCount = (num: string, station: 'main' | string) => {
    if (station === 'main') return dailyInput.mainStationTickets[num] || 0;
    const sub = dailyInput.subStations.find(s => s.id === station);
    return sub?.tickets[num] || 0;
  };

  const currentStationName = viewStation === 'main' ? 'Đài Chính' : dailyInput.subStations.find(s => s.id === viewStation)?.name || 'Đài Phụ';

  const totalInitial = Object.values(viewStation === 'main' ? dailyInput.mainStationTickets : dailyInput.subStations.find(s => s.id === viewStation)?.tickets || {}).reduce((a, b) => (a as number) + (b as number), 0);

  return (
    <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 mt-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-bl-[100px] -mr-16 -mt-16 z-0" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Ticket size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chi tiết 100 con</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Trạng thái vé: {currentStationName}</p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl self-start">
          <button 
            onClick={() => setViewStation('main')}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewStation === 'main' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            CHÍNH
          </button>
          {dailyInput.subStations.map(sub => (
            <button 
              key={sub.id}
              onClick={() => setViewStation(sub.id)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewStation === sub.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {sub.name.split(' ')[1] || sub.name.slice(0, 5)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-10 gap-1.5 relative z-10">
        {allNumbers.map(num => {
          const remaining = getRemainingCount(num, viewStation);
          const initial = getInitialCount(num, viewStation);
          const isSelected = searchNumber === num;
          const isDistributed = remaining < initial;
          
          return (
            <button
              key={num}
              onClick={() => onNumberClick?.(num)}
              title={`${num}: ${remaining}/${initial} vé`}
              className={`
                flex flex-col items-center justify-center py-2 rounded-lg border transition-all relative overflow-hidden group
                ${remaining > 0 
                  ? (isSelected ? 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30') 
                  : (initial > 0 
                      ? (isSelected ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-rose-50/50 border-rose-100 text-rose-500')
                      : (isSelected ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50/40 border-slate-50 text-slate-200 cursor-default opacity-40')
                    )
                }
              `}
            >
              <span className="text-[10px] font-black tracking-tight z-10">{num}</span>
              <span className={`text-[7px] font-bold z-10 ${isSelected ? 'text-white/80' : (remaining > 0 ? (isDistributed ? 'text-indigo-500' : 'text-slate-400') : (initial > 0 ? 'text-rose-400' : 'text-slate-300'))}`}>
                {remaining > 0 ? remaining : (initial > 0 ? 'Hết' : '-')}
              </span>
              
              {/* Progress indicator */}
              {initial > 0 && remaining > 0 && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all" style={{ width: `${(remaining / initial) * 100}%` }} />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap items-center gap-x-6 gap-y-2 text-[8px] font-black text-slate-400 uppercase tracking-widest relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
          <span>Còn vé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-200" />
          <span>Đã hết ({totalInitial > 0 ? 'Trong kho' : 'Dự kiến'})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-300 opacity-40" />
          <span>Không nạp</span>
        </div>
        <div className="flex-1 text-right text-indigo-600 font-black">
          TỔNG: {Object.values(viewStation === 'main' ? currentPools.main : currentPools.subPools[viewStation] || {}).reduce((a, b) => (a as number) + (b as number), 0)} VÉ
        </div>
      </div>
    </div>
  );
}
