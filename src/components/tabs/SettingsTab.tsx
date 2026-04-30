import { motion } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { WeeklySchedule, DailyStationConfig } from '../../types';

interface SettingsTabProps {
  weeklySchedules: WeeklySchedule[];
  setWeeklySchedules: (schedules: WeeklySchedule[]) => void;
  stationConfigs: DailyStationConfig[];
  setStationConfigs: (configs: DailyStationConfig[]) => void;
  addSubStation: (name?: string) => void;
  removeSubStation: (id: string) => void;
}

export default function SettingsTab({
  weeklySchedules,
  setWeeklySchedules,
  stationConfigs,
  setStationConfigs,
  addSubStation,
  removeSubStation
}: SettingsTabProps) {
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <h3 className="text-2xl font-bold">Lịch Trình Hàng Tuần</h3>
          <p className="text-sm opacity-80 font-medium">Thiết lập lượng vé cố định và tên đài cho từng ngày trong tuần</p>
        </div>
        <div className="p-8 space-y-8">
          {dayNames.map((dayName, idx) => {
            const schedule = weeklySchedules.find(s => s.dayOfWeek === idx)!;
            const config = stationConfigs.find(c => c.dayOfWeek === idx)!;
            
            return (
              <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-800">{dayName}</span>
                    {!schedule.isActive && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded uppercase">Tắt</span>}
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Main Station Config */}
                  <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-bold text-indigo-600 uppercase">Đài Chính</label>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400">Tên đài</span>
                        <input 
                          type="text"
                          value={config.mainStationName}
                          onChange={(e) => {
                            const newConfigs = [...stationConfigs];
                            newConfigs[idx].mainStationName = e.target.value;
                            setStationConfigs(newConfigs);
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400">Mặc định số lượng</span>
                        <input 
                          type="number" 
                          value={schedule.mainStationBaseQuantity}
                          onChange={(e) => {
                            const newSchedules = [...weeklySchedules];
                            newSchedules[idx].mainStationBaseQuantity = parseInt(e.target.value) || 0;
                            setWeeklySchedules(newSchedules);
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          disabled={!schedule.isActive}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub Stations Dynamic Loop */}
                  {config.subStations.map((sub, sIdx) => (
                    <div key={sub.id} className="space-y-4 bg-white p-4 rounded-2xl border border-slate-100 relative group">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-bold text-emerald-600 uppercase">Đài Phụ {sIdx + 1}</label>
                         {config.subStations.length > 1 && (
                            <button 
                              onClick={() => {
                                // We need a way to remove from a specific day in Settings, but for now removeSubStation in App handles current day.
                                // Let's just implement a local remove logic for Settings if we want to be precise.
                                const newConfigs = [...stationConfigs];
                                newConfigs[idx].subStations = newConfigs[idx].subStations.filter(s => s.id !== sub.id);
                                setStationConfigs(newConfigs);
                                
                                const newSchedules = [...weeklySchedules];
                                const newQs = { ...newSchedules[idx].subStationBaseQuantities };
                                delete newQs[sub.id];
                                newSchedules[idx].subStationBaseQuantities = newQs;
                                setWeeklySchedules(newSchedules);
                              }}
                              className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                               <X size={12} />
                            </button>
                         )}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400">Tên đài</span>
                          <input 
                            type="text"
                            value={sub.name}
                            onChange={(e) => {
                              const newConfigs = [...stationConfigs];
                              newConfigs[idx].subStations[sIdx].name = e.target.value;
                              setStationConfigs(newConfigs);
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400">Mặc định số lượng</span>
                          <input 
                            type="number" 
                            value={schedule.subStationBaseQuantities[sub.id] || 0}
                            onChange={(e) => {
                              const newSchedules = [...weeklySchedules];
                              newSchedules[idx].subStationBaseQuantities = {
                                ...newSchedules[idx].subStationBaseQuantities,
                                [sub.id]: parseInt(e.target.value) || 0
                              };
                              setWeeklySchedules(newSchedules);
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={!schedule.isActive}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Substation Button */}
                  {config.subStations.length < 5 && (
                    <button 
                      onClick={() => {
                        const id = 'sub_' + Date.now();
                        const newConfigs = [...stationConfigs];
                        newConfigs[idx].subStations.push({ id, name: `Đài Phụ ${newConfigs[idx].subStations.length + 1}` });
                        setStationConfigs(newConfigs);

                        const newSchedules = [...weeklySchedules];
                        newSchedules[idx].subStationBaseQuantities[id] = 10320;
                        setWeeklySchedules(newSchedules);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 group"
                    >
                      <Plus size={24} />
                      <span className="text-xs font-bold uppercase">Thêm Đài Phụ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
