import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { WeeklySchedule, DailyStationConfig } from '../../types';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklySchedules: WeeklySchedule[];
  setWeeklySchedules: (schedules: WeeklySchedule[]) => void;
  stationConfigs: DailyStationConfig[];
  setStationConfigs: (configs: DailyStationConfig[]) => void;
}

export default function WeeklyScheduleModal({
  isOpen,
  onClose,
  weeklySchedules,
  setWeeklySchedules,
  stationConfigs,
  setStationConfigs
}: WeeklyScheduleModalProps) {
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-bold">Lịch Trình Hàng Tuần</h3>
                <p className="text-sm opacity-80 font-medium">Thiết lập lượng vé cố định và tên đài cho từng ngày</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const newSchedules = weeklySchedules.map(s => ({ ...s, isActive: true }));
                    setWeeklySchedules(newSchedules);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                >
                  Bật tất cả
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              {dayNames.map((dayName, idx) => {
                const schedule = weeklySchedules.find(s => s.dayOfWeek === idx)!;
                const config = stationConfigs.find(c => c.dayOfWeek === idx)!;
                
                return (
                  <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-700">{dayName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Kích hoạt</span>
                        <button 
                          onClick={() => {
                            const newSchedules = [...weeklySchedules];
                            newSchedules[idx].isActive = !newSchedules[idx].isActive;
                            setWeeklySchedules(newSchedules);
                          }}
                          className={`w-10 h-5 rounded-full relative transition-colors ${schedule.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${schedule.isActive ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tên Đài Chính</label>
                        <input 
                          type="text"
                          value={config.mainStationName}
                          onChange={(e) => {
                            const newConfigs = [...stationConfigs];
                            newConfigs[idx].mainStationName = e.target.value;
                            setStationConfigs(newConfigs);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Lượng vé Đài Chính</label>
                        <input 
                          type="number" 
                          value={schedule.mainStationBaseQuantity}
                          onChange={(e) => {
                            const newSchedules = [...weeklySchedules];
                            newSchedules[idx].mainStationBaseQuantity = parseInt(e.target.value) || 0;
                            setWeeklySchedules(newSchedules);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          disabled={!schedule.isActive}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {config.subStations.map((sub, subIdx) => (
                        <div key={sub.id} className="space-y-2 p-3 bg-white rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Đài Phụ {subIdx + 1}</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={sub.name}
                              onChange={(e) => {
                                const newConfigs = [...stationConfigs];
                                newConfigs[idx].subStations[subIdx].name = e.target.value;
                                setStationConfigs(newConfigs);
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"
                              placeholder="Tên đài"
                            />
                            <input 
                              type="number"
                              value={schedule.subStationBaseQuantities[sub.id] || 0}
                              onChange={(e) => {
                                const newSchedules = [...weeklySchedules];
                                newSchedules[idx].subStationBaseQuantities[sub.id] = parseInt(e.target.value) || 0;
                                setWeeklySchedules(newSchedules);
                              }}
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none text-center"
                              placeholder="Vé"
                              disabled={!schedule.isActive}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Khi kích hoạt, hệ thống sẽ tự động gợi ý áp dụng lượng vé này cho đài chính khi bạn chọn ngày tương ứng. 
                  Bạn có thể nhấn nút <strong>"Áp dụng lịch trình"</strong> ở màn hình chính để điền nhanh.
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
