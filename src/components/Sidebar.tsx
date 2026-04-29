import { 
  Play, 
  Users, 
  History, 
  Settings, 
  Edit3, 
  Layers, 
  Ticket,
  Download,
  QrCode,
  Save,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setIsSetManagerOpen: (open: boolean) => void;
  setIsDoubleSetManagerOpen: (open: boolean) => void;
  showInstallBtn: boolean;
  handleInstallClick: () => void;
  setIsQrModalOpen: (open: boolean) => void;
  handleExportCSV: () => void;
  handleBackupData: () => void;
  resultsCount: number;
  currentRatio: number;
  dailyInput: any;
  totalTickets: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  setIsSetManagerOpen, 
  setIsDoubleSetManagerOpen,
  showInstallBtn,
  handleInstallClick,
  setIsQrModalOpen,
  handleExportCSV,
  handleBackupData,
  resultsCount,
  currentRatio,
  dailyInput,
  totalTickets
}: SidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-300 flex flex-col z-10 shadow-sm">
      <div className="p-6 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
          <Ticket className="text-white w-5 h-5" />
        </div>
        <h1 className="font-black text-lg tracking-tighter text-slate-900 uppercase">Chia Vé 4.0</h1>
      </div>

      <nav className="flex flex-col overflow-y-auto flex-1 scrollbar-hide">
        <div className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">Menu Chính</div>
        <button 
          onClick={() => setActiveTab('distribute')}
          className={`sidebar-item ${activeTab === 'distribute' ? 'active' : ''}`}
        >
          <Play size={16} className="sidebar-item-icon" />
          <span>01. Chia Vé</span>
        </button>
        <button 
          onClick={() => setActiveTab('sellers')}
          className={`sidebar-item ${activeTab === 'sellers' ? 'active' : ''}`}
        >
          <Users size={16} className="sidebar-item-icon" />
          <span>02. Người Bán</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
        >
          <History size={16} className="sidebar-item-icon" />
          <span>03. Lịch Sử</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={16} className="sidebar-item-icon" />
          <span>04. Cài Đặt</span>
        </button>

        <div className="px-6 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">Quản Lý Dữ Liệu</div>
        <button 
          onClick={() => setIsSetManagerOpen(true)}
          className="sidebar-item"
        >
          <Edit3 size={16} className="sidebar-item-icon" />
          <span>05. Bộ Số Đơn</span>
        </button>
        <button 
          onClick={() => setIsDoubleSetManagerOpen(true)}
          className="sidebar-item"
        >
          <Layers size={16} className="sidebar-item-icon" />
          <span>06. Bộ Số Đôi</span>
        </button>

        <div className="px-6 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">Tiện Ích</div>
        
        {showInstallBtn && (
          <button 
            onClick={handleInstallClick}
            className="sidebar-item text-indigo-600"
          >
            <Download size={16} className="sidebar-item-icon" />
            <span>Cài Đặt App</span>
          </button>
        )}

        <button 
          onClick={() => setIsQrModalOpen(true)}
          className="sidebar-item"
        >
          <QrCode size={16} className="sidebar-item-icon" />
          <span>Mã QR Cài Đặt</span>
        </button>

        <button 
          onClick={handleExportCSV}
          disabled={resultsCount === 0}
          className={`sidebar-item ${resultsCount > 0 ? 'text-emerald-600' : 'opacity-50 grayscale cursor-not-allowed'}`}
        >
          <Download size={16} className="sidebar-item-icon" />
          <span>Xuất CSV</span>
        </button>

        <button 
          onClick={handleBackupData}
          className="sidebar-item"
        >
          <Save size={16} className="sidebar-item-icon" />
          <span>Sao Lưu</span>
        </button>
      </nav>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <TrendingUp size={14} />
          <span>Tỷ lệ kho vé</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500">Chính</span>
            <span className="text-xs font-black text-indigo-600">{currentRatio}%</span>
          </div>
          {(dailyInput?.subStations || []).map((sub: any) => {
            const subTotal = (Object.values(sub.tickets || {}) as number[]).reduce((a, b) => a + b, 0);
            const ratio = totalTickets > 0 ? Math.round((subTotal / totalTickets) * 100) : 0;
            return (
              <div key={sub.id} className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{sub.name}</span>
                <span className="text-xs font-black text-emerald-600">{ratio}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>
    </div>
  );
}

