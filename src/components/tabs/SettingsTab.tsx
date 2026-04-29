import { motion } from 'motion/react';
import { WeeklySchedule, DailyStationConfig } from '../../types';

interface SettingsTabProps {
  weeklySchedules: WeeklySchedule[];
  setWeeklySchedules: (schedules: WeeklySchedule[]) => void;
  stationConfigs: DailyStationConfig[];
  setStationConfigs: (configs: DailyStationConfig[]) => void;
}

export default function SettingsTab({
  weeklySchedules,
  setWeeklySchedules,
  stationConfigs,
  setStationConfigs
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
        <div className="p-8 space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Lượng vé Đài Phụ</label>
                    <input 
                      type="number" 
                      value={schedule.subStationBaseQuantities['sub1'] || 0}
                      onChange={(e) => {
                        const newSchedules = [...weeklySchedules];
                        newSchedules[idx].subStationBaseQuantities = {
                          ...newSchedules[idx].subStationBaseQuantities,
                          'sub1': parseInt(e.target.value) || 0,
                          'sub2': parseInt(e.target.value) || 0
                        };
                        setWeeklySchedules(newSchedules);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={!schedule.isActive}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Đài Phụ 1</label>
                    <input 
                      type="text"
                      value={config.subStations[0].name}
                      onChange={(e) => {
                        const newConfigs = [...stationConfigs];
                        newConfigs[idx].subStations[0].name = e.target.value;
                        setStationConfigs(newConfigs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Đài Phụ 2</label>
                    <input 
                      type="text"
                      value={config.subStations[1].name}
                      onChange={(e) => {
                        const newConfigs = [...stationConfigs];
                        newConfigs[idx].subStations[1].name = e.target.value;
                        setStationConfigs(newConfigs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
