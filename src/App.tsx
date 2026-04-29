import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Ticket, 
  History, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  Calendar, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Hash,
  Edit3,
  X,
  ChevronDown,
  Save,
  RefreshCw,
  Download,
  QrCode,
  Star,
  Layers,
  ArrowRightLeft,
  LayoutDashboard,
  Printer,
  Search,
  MinusCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Seller, 
  DistributionResult, 
  DailyInput, 
  LotterySet, 
  Shortage, 
  WeeklySchedule, 
  DailyStationConfig,
  AppNotification
} from './types';
import { DOUBLE_SETS, getPairId } from './constants';
import { 
  INITIAL_SELLERS, 
  INITIAL_LOTTERY_SETS, 
  INITIAL_WEEKLY_SCHEDULES, 
  INITIAL_STATION_CONFIGS,
  MAIN_STATION_TICKET_MAP
} from './initialData';
import { INITIAL_HISTORY } from './initialHistory';
import { distributeTickets } from './utils/lotteryLogic';

// New Components
import Sidebar from './components/Sidebar';
import DistributeTab from './components/tabs/DistributeTab';
import SellersTab from './components/tabs/SellersTab';
import HistoryTab from './components/tabs/HistoryTab';
import SettingsTab from './components/tabs/SettingsTab';

// New Modals
import SetManagerModal from './components/modals/SetManagerModal';
import DoubleSetManagerModal from './components/modals/DoubleSetManagerModal';
import WeeklyScheduleModal from './components/modals/WeeklyScheduleModal';
import SellerPreferencesModal from './components/modals/SellerPreferencesModal';
import SellerOverridesModal from './components/modals/SellerOverridesModal';
import ShortageModal from './components/modals/ShortageModal';
import QrModal from './components/modals/QrModal';

export default function App() {
  const [sellers, setSellers] = useState<Seller[]>(INITIAL_SELLERS);
  const [lotterySets, setLotterySets] = useState<LotterySet[]>(INITIAL_LOTTERY_SETS);
  const [dailyInput, setDailyInput] = useState<DailyInput>({
    date: new Date().toISOString().split('T')[0],
    mainStationTickets: {},
    subStations: [
      { id: 'sub1', name: 'Đài Phụ 1', tickets: {} },
      { id: 'sub2', name: 'Đài Phụ 2', tickets: {} }
    ]
  });
  const [currentPools, setCurrentPools] = useState<{ main: Record<string, number>, subPools: Record<string, Record<string, number>> }>({
    main: {},
    subPools: { 'sub1': {}, 'sub2': {} }
  });
  const [results, setResults] = useState<DistributionResult[]>([]);
  const [shortages, setShortages] = useState<Shortage[]>([]);
  const [history, setHistory] = useState<DistributionResult[][]>(INITIAL_HISTORY);
  const [activeTab, setActiveTab] = useState<'distribute' | 'sellers' | 'history' | 'settings'>('distribute');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingStation, setEditingStation] = useState<string>('main');
  const [isSetManagerOpen, setIsSetManagerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<LotterySet | null>(null);
  const [setInventory, setSetInventory] = useState<Record<string, Record<string, { q16: number, q32: number }>>>({});
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSellerPrefOpen, setIsSellerPrefOpen] = useState(false);
  const [isSellerOverridesOpen, setIsSellerOverridesOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>(INITIAL_WEEKLY_SCHEDULES);
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState(false);
  const [doubleSets, setDoubleSets] = useState<Record<string, string>>(DOUBLE_SETS);
  const [isDoubleSetManagerOpen, setIsDoubleSetManagerOpen] = useState(false);
  const [stationConfigs, setStationConfigs] = useState<DailyStationConfig[]>(INITIAL_STATION_CONFIGS);
  const [searchNumber, setSearchNumber] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const addNotification = (message: string, type: AppNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification: AppNotification = { id, message, type, timestamp: Date.now() };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const getEffectiveSeller = (seller: Seller, dateStr: string): Seller => {
    const dayOfWeek = new Date(dateStr).getDay();
    const overrides = seller.dailyOverrides?.[dayOfWeek];
    if (!overrides) return seller;
    return { ...seller, ...overrides };
  };

  const effectiveSellers = sellers.map(s => getEffectiveSeller(s, dailyInput.date));

  const addTicketsToInventory = (station: string, number: string, quantity: number) => {
    setDailyInput(prev => {
      if (station === 'main' || station === 'ưu tiên') {
        return {
          ...prev,
          mainStationTickets: {
            ...prev.mainStationTickets,
            [number]: (prev.mainStationTickets[number] || 0) + quantity
          }
        };
      } else {
        return {
          ...prev,
          subStations: prev.subStations.map(sub => 
            sub.id === station 
              ? { ...sub, tickets: { ...sub.tickets, [number]: (sub.tickets[number] || 0) + quantity } }
              : sub
          )
        };
      }
    });
  };

  // Apply weekly schedule when date changes
  useEffect(() => {
    const date = new Date(dailyInput.date);
    const dayOfWeek = date.getDay();
    const schedule = weeklySchedules.find(s => s.dayOfWeek === dayOfWeek);
    const config = stationConfigs.find(c => c.dayOfWeek === dayOfWeek);
    
    if (config) {
      setDailyInput(prev => ({
        ...prev,
        subStations: prev.subStations.map((sub, idx) => ({
          ...sub,
          name: config.subStations[idx]?.name || sub.name
        }))
      }));
    }

    if (schedule && schedule.isActive) {
      // Auto-fill inventory based on schedule if it's currently empty
      const isMainEmpty = Object.keys(dailyInput.mainStationTickets).length === 0;
      if (isMainEmpty) {
        const newMain: Record<string, number> = {};
        // Fill with base quantity for all numbers (or just some logic)
        // Actually, the user probably wants to set the quantity for ALL numbers in the main station
        // Let's assume they want to set a default quantity for all numbers if they haven't entered any
      }
    }
  }, [dailyInput.date, weeklySchedules, stationConfigs]);

  const updateSetInventory = (setId: string, type: 'q16' | 'q32', val: number, stationId: string) => {
    const currentInv = setInventory[stationId]?.[setId] || { q16: 0, q32: 0 };
    const newQ16 = type === 'q16' ? val : currentInv.q16;
    const newQ32 = type === 'q32' ? val : currentInv.q32;
    const totalPerNum = (newQ16 * 16) + (newQ32 * 32);

    setSetInventory(prev => ({
      ...prev,
      [stationId]: {
        ...(prev[stationId] || {}),
        [setId]: { q16: newQ16, q32: newQ32 }
      }
    }));

    const set = lotterySets.find(s => s.id === setId);
    if (!set) return;

    setDailyInput(prev => {
      if (stationId === 'main') {
        const newMain = { ...prev.mainStationTickets };
        set.numbers.forEach(n => {
          if (totalPerNum <= 0) delete newMain[n];
          else newMain[n] = totalPerNum;
        });
        return { ...prev, mainStationTickets: newMain };
      } else {
        const newSubs = prev.subStations.map(s => {
          if (s.id === stationId) {
            const newTickets = { ...s.tickets };
            set.numbers.forEach(n => {
              if (totalPerNum <= 0) delete newTickets[n];
              else newTickets[n] = totalPerNum;
            });
            return { ...s, tickets: newTickets };
          }
          return s;
        });
        return { ...prev, subStations: newSubs };
      }
    });
  };

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePrint = (res: DistributionResult) => {
    handlePrintResults([res]);
  };

  const getDraftResults = (sellerId?: string): DistributionResult[] => {
    const day = new Date(dailyInput.date).getDate();
    const baseSetIndex = (day - 1) % lotterySets.length;
    
    const targetSellers = sellerId 
      ? sellers.filter(s => s.id === sellerId)
      : sellers.filter(s => s.isEnabled);

    return targetSellers.map((seller) => {
      const sIdx = sellers.findIndex(s => s.id === seller.id);
      let startSetIndex = baseSetIndex;
      if (seller.fixedSetId) {
        const fixedIdx = lotterySets.findIndex(ls => ls.id === seller.fixedSetId);
        if (fixedIdx !== -1) startSetIndex = fixedIdx;
      } else if (seller.manualSetId) {
        const manualIdx = lotterySets.findIndex(ls => ls.id === seller.manualSetId);
        if (manualIdx !== -1) startSetIndex = manualIdx;
      } else if (seller.isAutoMode) {
        startSetIndex = (baseSetIndex + sIdx) % lotterySets.length;
      }
      
      const startSet = lotterySets[startSetIndex] || { id: '??' };
      const setNames = [startSet.id];
      if (seller.setType === 'double') {
        const pairId = getPairId(startSet.id);
        if (pairId) setNames.push(pairId);
      }
      
      // Calculate split
      const mainRatio = seller.customRatio !== undefined ? seller.customRatio / 100 : 0.7;
      const mainQty = seller.mainEnabled ? Math.round(seller.targetTotalTickets * mainRatio) : 0;
      
      const subResults = dailyInput.subStations.map(sub => {
        const ratio = seller.subStationRatios?.[sub.id] || 0;
        const qty = Math.round(seller.targetTotalTickets * (ratio / 100));
        return {
          id: sub.id,
          name: sub.name,
          numbers: [],
          quantities: { "Dự kiến": qty }
        };
      }).filter(sr => (Object.values(sr.quantities)[0] as number) > 0);

      return {
        date: dailyInput.date,
        sellerId: seller.id,
        sellerName: seller.name,
        setNames,
        mainStationNumbers: [],
        mainStationQuantities: mainQty > 0 ? { "Dự kiến": mainQty } : {},
        subStationResults: subResults,
        totalSheets: seller.targetTotalTickets
      };
    });
  };

  const handlePrintResults = (resultsToPrint: DistributionResult[]) => {
    if (resultsToPrint.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const allTickets: string[] = [];

    resultsToPrint.forEach((res) => {
      const config = stationConfigs.find(c => c.dayOfWeek === new Date(res.date).getDay());
      
      // Calculate grand total (Main + All Subs)
      const mainTotal = Object.values(res.mainStationQuantities || {}).reduce((a, b) => a + b, 0);
      const subsTotal = res.subStationResults.reduce((acc, sub) => 
        acc + Object.values(sub.quantities || {}).reduce((a, b) => a + b, 0), 0
      );
      const grandTotal = mainTotal + subsTotal;

      if (grandTotal > 0) {
        const stationName = config?.mainStationName || 'Đài Chính';
        const setNameStr = res.setNames?.join(', ') || (res as any).setName || '';
        allTickets.push(
          '<div class="ticket">' +
            '<div class="header">' +
              new Date(res.date).toLocaleDateString('vi-VN') + ' - ' + stationName +
            '</div>' +
            '<div class="quantity">' +
              grandTotal +
            '</div>' +
            '<div class="footer">' +
              '<div class="seller-name">' + res.sellerName + '</div>' +
              '<div class="set-info">' +
                '<span class="set-label">BỘ:</span>' +
                '<span class="set-value">' + setNameStr + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }
    });

    if (allTickets.length === 0) {
      printWindow.close();
      return;
    }

    const html = 
      '<html>' +
        '<head>' +
          '<title>In Phiếu Phân Phối</title>' +
          '<style>' +
            '@page {' +
              'size: A4;' +
              'margin: 5mm;' +
            '}' +
            'body { ' +
              'margin: 0; ' +
              'padding: 0; ' +
              'font-family: sans-serif; ' +
            '}' +
            '.grid-container {' +
              'display: grid;' +
              'grid-template-columns: repeat(4, 1fr);' +
              'grid-template-rows: repeat(5, 1fr);' +
              'width: 200mm;' +
              'height: 287mm;' +
              'gap: 0;' +
              'page-break-after: always;' +
            '}' +
            '.ticket { ' +
              'border: 0.5pt solid #ccc; ' +
              'padding: 5px; ' +
              'display: flex; ' +
              'flex-direction: column; ' +
              'justify-content: space-between; ' +
              'align-items: center;' +
              'box-sizing: border-box;' +
              'overflow: hidden;' +
              'text-align: center;' +
            '}' +
            '.header { ' +
              'font-size: 12px; ' +
              'font-weight: 800; ' +
              'color: #000;' +
              'width: 100%;' +
              'border-bottom: 1pt solid #000;' +
              'padding-bottom: 2px;' +
              'text-transform: uppercase;' +
              'letter-spacing: 0.5px;' +
            '}' +
            '.quantity { ' +
              'font-size: 92px; ' +
              'font-weight: 900; ' +
              'line-height: 0.75;' +
              'margin: 4px 0;' +
              'color: #000;' +
              'letter-spacing: -2px;' +
            '}' +
            '.footer { ' +
              'width: 100%;' +
              'display: flex;' +
              'flex-direction: column;' +
              'gap: 0;' +
              'color: #000;' +
              'border-top: 1pt solid #000;' +
              'padding-top: 3px;' +
            '}' +
            '.seller-name {' +
              'font-size: 22px;' +
              'font-weight: 900;' +
              'line-height: 1.1;' +
              'text-transform: uppercase;' +
              'margin-bottom: 2px;' +
              'white-space: nowrap;' +
              'overflow: hidden;' +
              'text-overflow: ellipsis;' +
              'width: 100%;' +
            '}' +
            '.set-info {' +
              'display: flex;' +
              'justify-content: center;' +
              'gap: 4px;' +
              'align-items: baseline;' +
            '}' +
            '.set-label {' +
              'font-size: 10px;' +
              'font-weight: 700;' +
              'opacity: 0.7;' +
            '}' +
            '.set-value {' +
              'font-size: 18px;' +
              'font-weight: 900;' +
            '}' +
            '@media print {' +
              '.grid-container {' +
                'page-break-after: always;' +
              '}' +
              '.grid-container:last-child {' +
                'page-break-after: auto;' +
              '}' +
            '}' +
          '</style>' +
        '</head>' +
        '<body>' +
          Array.from({ length: Math.ceil(allTickets.length / 20) }).map((_, i) => 
            '<div class="grid-container">' +
              allTickets.slice(i * 20, (i + 1) * 20).join('') +
            '</div>'
          ).join('') +
          '<script>' +
            'window.onload = () => {' +
              'window.print();' +
              'setTimeout(() => window.close(), 500);' +
            '};' +
          '</script>' +
        '</body>' +
      '</html>';
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const adjustInventory = (num: string, amount: number, stationId: string) => {
    if (!num || num.length !== 2) return;
    
    setDailyInput(prev => {
      let newState = { ...prev };
      if (stationId === 'main') {
        const current = prev.mainStationTickets[num] || 0;
        const newVal = Math.max(0, current + amount);
        const newMain = { ...prev.mainStationTickets };
        if (newVal === 0) delete newMain[num];
        else newMain[num] = newVal;
        newState = { ...prev, mainStationTickets: newMain };
      } else {
        const newSubs = prev.subStations.map(s => {
          if (s.id === stationId) {
            const current = s.tickets[num] || 0;
            const newVal = Math.max(0, current + amount);
            const newTickets = { ...s.tickets };
            if (newVal === 0) delete newTickets[num];
            else newTickets[num] = newVal;
            return { ...s, tickets: newTickets };
          }
          return s;
        });
        newState = { ...prev, subStations: newSubs };
      }
      return newState;
    });

    // Explicitly update current pools for immediate feedback
    setCurrentPools(prev => {
      if (stationId === 'main') {
        const current = prev.main[num] || 0;
        const newVal = Math.max(0, current + amount);
        const newMain = { ...prev.main };
        if (newVal === 0) delete newMain[num];
        else newMain[num] = newVal;
        return { ...prev, main: newMain };
      } else {
        const newSubPools = { ...prev.subPools };
        const subPool = newSubPools[stationId] || {};
        const current = subPool[num] || 0;
        const newVal = Math.max(0, current + amount);
        const newTickets = { ...subPool };
        if (newVal === 0) delete newTickets[num];
        else newTickets[num] = newVal;
        newSubPools[stationId] = newTickets;
        return { ...prev, subPools: newSubPools };
      }
    });
  };
  const manuallyUpdateResult = (
    sellerId: string, 
    stationType: 'main' | string, 
    oldNum: string, 
    newNum: string
  ) => {
    if (oldNum === newNum) return;
    if (newNum.length !== 2) return;

    setResults(prev => {
      return prev.map(res => {
        if (res.sellerId !== sellerId) return res;

        const newState = { ...res };
        if (stationType === 'main') {
          newState.mainStationNumbers = res.mainStationNumbers.map(n => n === oldNum ? newNum : n);
          if (newState.mainStationQuantities) {
            const qty = newState.mainStationQuantities[oldNum];
            delete newState.mainStationQuantities[oldNum];
            newState.mainStationQuantities[newNum] = qty;
          }
        } else {
          newState.subStationResults = res.subStationResults.map(sr => {
            if (sr.id !== stationType) return sr;
            const newNumbers = sr.numbers.map(n => n === oldNum ? newNum : n);
            const newQuantities = { ...sr.quantities };
            const qty = newQuantities[oldNum];
            delete newQuantities[oldNum];
            newQuantities[newNum] = qty;
            return { ...sr, numbers: newNumbers, quantities: newQuantities };
          });
        }
        return newState;
      });
    });

    // Update pools
    setCurrentPools(prev => {
      const newPools = { ...prev };
      
      // Return oldNum to its pool
      if (stationType === 'main') {
        newPools.main[oldNum] = (newPools.main[oldNum] || 0) + 1; // Assuming 1 sheet per number for simplicity in basic edit or use the quantity
        // Actually we should handle quantities properly
      } else {
        const subPool = { ...newPools.subPools[stationType] };
        subPool[oldNum] = (subPool[oldNum] || 0) + 1;
        newPools.subPools[stationType] = subPool;
      }

      // Deduct newNum from its pool
      if (stationType === 'main') {
        if (newPools.main[newNum] > 0) newPools.main[newNum]--;
      } else {
        const subPool = { ...newPools.subPools[stationType] };
        if (subPool[newNum] > 0) subPool[newNum]--;
        newPools.subPools[stationType] = subPool;
      }

      return newPools;
    });
  };

  const handleCopyLink = () => {
    const url = process.env.SHARED_APP_URL || process.env.APP_URL || window.location.origin;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    
    let csv = "Ngày,Người Bán,Bộ,Đài,Số,Số Tờ\n";
    results.forEach(res => {
      const config = stationConfigs.find(c => c.dayOfWeek === new Date(res.date).getDay());
      
      // Main
      Object.entries(res.mainStationQuantities || {}).forEach(([num, qty]) => {
        const setName = res.setNames?.join(' & ') || (res as any).setName || '';
        const stationNameLabel = config?.mainStationName || 'Đài Chính';
        csv += res.date + "," + res.sellerName + "," + setName + "," + stationNameLabel + "," + num + "," + qty + "\n";
      });
      
      // Subs
      res.subStationResults.forEach(sub => {
        Object.entries(sub.quantities || {}).forEach(([num, qty]) => {
          const setName = res.setNames?.join(' & ') || (res as any).setName || '';
          csv += res.date + "," + res.sellerName + "," + setName + "," + sub.name + "," + num + "," + qty + "\n";
        });
      });
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "chia_ve_" + dailyInput.date + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupData = () => {
    const data = {
      sellers,
      lotterySets,
      weeklySchedules,
      stationConfigs,
      history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "backup_chia_ve_" + new Date().toISOString().split('T')[0] + ".json");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load history and sets from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('lottery_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Migration: ensure all required properties exist
        const migrated = parsed.map((day: any) => {
          if (!Array.isArray(day)) return [];
          return day.map((res: any) => ({
            ...res,
            setNames: res.setNames || (res.setName ? [res.setName] : []),
            mainStationNumbers: res.mainStationNumbers || [],
            subStationResults: res.subStationResults || [],
            totalSheets: res.totalSheets || 0
          }));
        });
        setHistory(migrated);
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
    
    const savedSets = localStorage.getItem('lottery_sets');
    if (savedSets) {
      try {
        setLotterySets(JSON.parse(savedSets));
      } catch (e) {
        console.error("Error parsing sets", e);
      }
    }

    const savedSellers = localStorage.getItem('lottery_sellers');
    if (savedSellers) {
      try {
        const parsed = JSON.parse(savedSellers);
        if (Array.isArray(parsed)) setSellers(parsed);
      } catch (e) {
        console.error("Error parsing sellers", e);
      }
    }

    const savedWeekly = localStorage.getItem('lottery_weekly_schedule');
    if (savedWeekly) {
      try {
        setWeeklySchedules(JSON.parse(savedWeekly));
      } catch (e) {
        console.error("Error parsing weekly schedule", e);
      }
    }

    const savedDailyInput = localStorage.getItem('lottery_daily_input');
    if (savedDailyInput) {
      try {
        setDailyInput(JSON.parse(savedDailyInput));
      } catch (e) {
        console.error("Error parsing daily input", e);
      }
    }

    const savedStationConfigs = localStorage.getItem('lottery_station_configs');
    if (savedStationConfigs) {
      try {
        setStationConfigs(JSON.parse(savedStationConfigs));
      } catch (e) {
        console.error("Error parsing station configs", e);
      }
    }
  }, []);

  // Save sellers and sets when they change
  useEffect(() => {
    localStorage.setItem('lottery_sets', JSON.stringify(lotterySets));
  }, [lotterySets]);

  useEffect(() => {
    localStorage.setItem('lottery_sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('lottery_weekly_schedule', JSON.stringify(weeklySchedules));
  }, [weeklySchedules]);

  useEffect(() => {
    localStorage.setItem('lottery_daily_input', JSON.stringify(dailyInput));
  }, [dailyInput]);

  useEffect(() => {
    localStorage.setItem('lottery_station_configs', JSON.stringify(stationConfigs));
  }, [stationConfigs]);

  const applyWeeklySchedule = () => {
    const date = new Date(dailyInput.date);
    const dayOfWeek = date.getDay();
    const schedule = weeklySchedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (schedule && schedule.isActive) {
      const newMain: Record<string, number> = {};
      
      // If the base quantity matches our default total, use the high-fidelity map
      if (schedule.mainStationBaseQuantity === 20640) {
        Object.assign(newMain, MAIN_STATION_TICKET_MAP);
      } else {
        const qty = schedule.mainStationBaseQuantity / 100; // Simplified fallback
        lotterySets.forEach(set => {
          set.numbers.forEach(num => {
            newMain[num] = qty;
          });
        });
      }
      
      const newSubStations = dailyInput.subStations.map(sub => {
        const subQty = schedule.subStationBaseQuantities[sub.id] || 0;
        const newSubTickets: Record<string, number> = {};
        lotterySets.forEach(set => {
          set.numbers.forEach(num => {
            newSubTickets[num] = subQty;
          });
        });
        return { ...sub, tickets: newSubTickets };
      });

      setDailyInput(prev => ({ 
        ...prev, 
        mainStationTickets: newMain,
        subStations: newSubStations
      }));
      
      // Also update setInventory for visual consistency
      const newInv: Record<string, Record<string, { q16: number, q32: number }>> = {
        main: {}
      };
      lotterySets.forEach(set => {
        // Find quantity for numbers in this set (assuming same for all in set)
        const firstNum = set.numbers[0];
        const qty = newMain[firstNum] || 0;
        newInv.main[set.id] = { q16: Math.floor(qty / 16), q32: 0 };
      });
      
      newSubStations.forEach(sub => {
        newInv[sub.id] = {};
        const subQty = schedule.subStationBaseQuantities[sub.id] || 0;
        lotterySets.forEach(set => {
          newInv[sub.id][set.id] = { q16: Math.floor(subQty / 16), q32: 0 };
        });
      });

      setSetInventory(newInv);
    }
  };

  const handleDistribute = (sellerId?: string) => {
    setIsProcessing(true);
    
    // Determine which sellers to process
    const currentSellers = effectiveSellers;
    const targetSellers = sellerId 
      ? currentSellers.filter(s => s.id === sellerId)
      : currentSellers.filter(s => s.isEnabled);

    if (targetSellers.length === 0) {
      addNotification("Không có người bán nào được chọn để chia vé", "warning");
      setIsProcessing(false);
      return;
    }

    // Use current pools if distributing individually, otherwise use initial input
    const initialMain = sellerId ? currentPools.main : dailyInput.mainStationTickets;
    const initialSubPools: Record<string, Record<string, number>> = {};
    
    if (sellerId) {
      Object.assign(initialSubPools, currentPools.subPools);
    } else {
      dailyInput.subStations.forEach(s => {
        initialSubPools[s.id] = s.tickets;
      });
    }

    // Simulate processing time
    setTimeout(() => {
      const report = distributeTickets(
        dailyInput.date,
        targetSellers.map(s => ({
          ...s,
          originalIndex: sellers.findIndex(os => os.id === s.id)
        })),
        initialMain,
        dailyInput.subStations.map(sub => ({
          ...sub,
          tickets: sellerId ? currentPools.subPools[sub.id] : sub.tickets
        })),
        lotterySets,
        doubleSets,
        history
      );
      
      if (sellerId) {
        // Individual mode: update result and update current pools
        setResults(prev => {
          const filtered = prev.filter(r => r.sellerId !== sellerId);
          return [...filtered, ...report.results];
        });
        setCurrentPools({
          main: report.updatedMainPool,
          subPools: report.updatedSubPools
        });
      } else {
        // Batch mode: replace results and update current pools from initial
        setResults(report.results);
        setCurrentPools({
          main: report.updatedMainPool,
          subPools: report.updatedSubPools
        });
      }
      
      if (report.results.length > 0) {
        const updatedHistory = [report.results, ...history].slice(0, 30); // Keep 30 days
        setHistory(updatedHistory);
        localStorage.setItem('lottery_history', JSON.stringify(updatedHistory));
        addNotification("Đã chia vé thành công cho " + report.results.length + " người bán", "success");
      }

      if (report.shortages.length > 0) {
        addNotification("Có " + report.shortages.length + " trường hợp thiếu vé", "warning");
      }
      
      setShortages(report.shortages);
      
      // Update seller set indices for next time (rotation) for auto-mode sellers
      const updatedSellers = sellers.map(s => {
        const isTarget = sellerId ? s.id === sellerId : s.isEnabled;
        if (isTarget && s.isAutoMode) {
          return {
            ...s,
            currentSetIndex: (s.currentSetIndex + 1) % lotterySets.length
          };
        }
        return s;
      });
      setSellers(updatedSellers);
      
      setIsProcessing(false);
    }, 1000);
  };

  const resetPools = () => {
    const initialSubPools: Record<string, Record<string, number>> = {};
    dailyInput.subStations.forEach(s => {
      initialSubPools[s.id] = { ...s.tickets };
    });

    setCurrentPools({
      main: { ...dailyInput.mainStationTickets },
      subPools: initialSubPools
    });
    setResults([]);
    setShortages([]);
  };

  useEffect(() => {
    // Sync current pools when daily input changes
    const initialSubPools: Record<string, Record<string, number>> = {};
    dailyInput.subStations.forEach(s => {
      initialSubPools[s.id] = { ...s.tickets };
    });

    setCurrentPools({
      main: { ...dailyInput.mainStationTickets },
      subPools: initialSubPools
    });
  }, [dailyInput.mainStationTickets, dailyInput.subStations]);

  const updateTicketQuantity = (num: string, qty: number, stationId: string) => {
    setDailyInput(prev => {
      if (stationId === 'main') {
        const newMain = { ...prev.mainStationTickets };
        if (qty <= 0) delete newMain[num];
        else newMain[num] = qty;
        return { ...prev, mainStationTickets: newMain };
      } else {
        const newSubStations = prev.subStations.map(s => {
          if (s.id === stationId) {
            const newTickets = { ...s.tickets };
            if (qty <= 0) delete newTickets[num];
            else newTickets[num] = qty;
            return { ...s, tickets: newTickets };
          }
          return s;
        });
        return { ...prev, subStations: newSubStations };
      }
    });

    // Also update current pools to stay in sync
    setCurrentPools(prev => {
      if (stationId === 'main') {
        const newMain = { ...prev.main };
        if (qty <= 0) delete newMain[num];
        else newMain[num] = qty;
        return { ...prev, main: newMain };
      } else {
        const newSubPools = { ...prev.subPools };
        const newTickets = { ...(newSubPools[stationId] || {}) };
        if (qty <= 0) delete newTickets[num];
        else newTickets[num] = qty;
        newSubPools[stationId] = newTickets;
        return { ...prev, subPools: newSubPools };
      }
    });
  };

  const totalMain = (Object.values(dailyInput?.mainStationTickets || {}) as number[]).reduce((a, b) => a + b, 0);
  const totalSub = (dailyInput?.subStations || []).reduce((acc, s) => acc + (Object.values(s?.tickets || {}) as number[]).reduce((a, b) => a + b, 0), 0);
  const totalTickets = totalMain + totalSub;
  const currentRatio = totalTickets > 0 ? Math.round((totalMain / totalTickets) * 100) : 70;

  const addSeller = () => {
    const newSeller: Seller = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Người mới " + (sellers.length + 1),
      setType: 'single',
      sheetsOption: '16',
      targetTotalTickets: 160,
      allocationMode: 'auto',
      currentSetIndex: 0,
      isAutoMode: true,
      isEnabled: true,
      mainEnabled: true,
      subStationRatios: { 'sub1': 20, 'sub2': 10 },
      customPreferences: [],
      fixedSetId: undefined
    };
    setSellers([...sellers, newSeller]);
  };

  const removeSeller = (id: string) => {
    setSellers(sellers.filter(s => s.id !== id));
  };

  const updateSeller = (id: string, updates: Partial<Seller>) => {
    setSellers(sellers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateSetNumber = (setId: string, index: number, value: string) => {
    setLotterySets(prev => prev.map(set => {
      if (set.id === setId) {
        const newNumbers = [...set.numbers];
        newNumbers[index] = value.padStart(2, '0').slice(-2);
        return { ...set, numbers: newNumbers };
      }
      return set;
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={"pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center gap-3 min-w-[300px] " + (
                n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                n.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                n.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                'bg-white border-slate-100 text-slate-700'
              )}
            >
              <div className={"w-8 h-8 rounded-xl flex items-center justify-center shrink-0 " + (
                n.type === 'success' ? 'bg-emerald-100' :
                n.type === 'error' ? 'bg-rose-100' :
                n.type === 'warning' ? 'bg-amber-100' :
                'bg-slate-100'
              )}>
                {n.type === 'success' && <CheckCircle2 size={18} />}
                {n.type === 'error' && <AlertCircle size={18} />}
                {n.type === 'warning' && <AlertCircle size={18} />}
                {n.type === 'info' && <RefreshCw size={18} />}
              </div>
              <p className="text-sm font-bold">{n.message}</p>
              <button 
                onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsSetManagerOpen={setIsSetManagerOpen}
        setIsDoubleSetManagerOpen={setIsDoubleSetManagerOpen}
        showInstallBtn={showInstallBtn}
        handleInstallClick={handleInstallClick}
        setIsQrModalOpen={setIsQrModalOpen}
        handleExportCSV={handleExportCSV}
        handleBackupData={handleBackupData}
        resultsCount={results.length}
        currentRatio={currentRatio}
        dailyInput={dailyInput}
        totalTickets={totalTickets}
      />

      {/* Main Content */}
      <main className="ml-64 p-8 max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-1">
              <Calendar size={18} />
              <span className="capitalize">{new Date(dailyInput.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'distribute' && "Hệ Thống Chia Vé Tự Động"}
              {activeTab === 'sellers' && "Quản Lý Người Bán"}
              {activeTab === 'history' && "Lịch Sử Phân Phối"}
              {activeTab === 'settings' && "Cài Đặt Ngày & Đài"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handlePrintResults(results.length > 0 ? results : getDraftResults())}
              className={"flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 " + (results.length > 0 ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600')}
            >
              <Printer size={20} />
              <span>{results.length > 0 ? 'In Tất Cả Phiếu' : 'In Phiếu Dự Kiến'}</span>
            </button>

            {activeTab === 'distribute' && (
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Tổng Kho Vé</span>
                  <span className="text-sm font-black text-slate-700">{totalTickets}</span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Còn lại Chính</span>
                  <span className="text-sm font-black text-indigo-600">{(Object.values(currentPools.main) as number[]).reduce((a, b) => a + b, 0)}</span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Còn lại Phụ</span>
                  <span className="text-sm font-black text-emerald-600">{Object.values(currentPools.subPools).reduce((acc: number, pool) => acc + (Object.values(pool) as number[]).reduce((a, b) => a + b, 0), 0)}</span>
                </div>
              </div>
            )}

            {activeTab === 'sellers' && (
              <button 
                onClick={addSeller}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <Plus size={20} />
                <span>Thêm Người Bán</span>
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'distribute' && (
            <DistributeTab 
              dailyInput={dailyInput}
              setDailyInput={setDailyInput}
              weeklySchedules={weeklySchedules}
              applyWeeklySchedule={applyWeeklySchedule}
              resetPools={resetPools}
              setIsWeeklyScheduleOpen={setIsWeeklyScheduleOpen}
              searchNumber={searchNumber}
              setSearchNumber={setSearchNumber}
              adjustAmount={adjustAmount}
              setAdjustAmount={setAdjustAmount}
              adjustInventory={adjustInventory}
              editingStation={editingStation}
              setEditingStation={setEditingStation}
              stationConfigs={stationConfigs}
              lotterySets={lotterySets}
              setInventory={setInventory}
              setSetInventory={setSetInventory}
              updateSetInventory={updateSetInventory}
              updateTicketQuantity={updateTicketQuantity}
              sellers={sellers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleDistribute={handleDistribute}
              isProcessing={isProcessing}
              results={results}
              setResults={setResults}
              setCurrentPools={setCurrentPools}
              updateSeller={updateSeller}
              setEditingSellerId={setEditingSellerId}
              setIsSellerPrefOpen={setIsSellerPrefOpen}
              currentPools={currentPools}
              currentRatio={currentRatio}
              handlePrintResults={handlePrintResults}
              getDraftResults={getDraftResults}
              manuallyUpdateResult={manuallyUpdateResult}
            />
          )}

          {activeTab === 'sellers' && (
            <SellersTab 
              sellers={sellers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              updateSeller={updateSeller}
              addSeller={addSeller}
              setSellers={setSellers}
              INITIAL_SELLERS={INITIAL_SELLERS}
              lotterySets={lotterySets}
              handlePrintResults={handlePrintResults}
              setEditingSellerId={setEditingSellerId}
              setIsSellerPrefOpen={setIsSellerPrefOpen}
              setIsSellerOverridesOpen={setIsSellerOverridesOpen}
              stationConfigs={stationConfigs}
              dailyInput={dailyInput}
              results={results}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              weeklySchedules={weeklySchedules}
              setWeeklySchedules={setWeeklySchedules}
              stationConfigs={stationConfigs}
              setStationConfigs={setStationConfigs}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab history={history} />
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <ShortageModal 
        shortages={shortages}
        setShortages={setShortages}
        addTicketsToInventory={addTicketsToInventory}
        setEditingSellerId={setEditingSellerId}
        setIsSellerPrefOpen={setIsSellerPrefOpen}
      />

      <DoubleSetManagerModal 
        isOpen={isDoubleSetManagerOpen}
        onClose={() => setIsDoubleSetManagerOpen(false)}
        doubleSets={doubleSets}
        setDoubleSets={setDoubleSets}
        lotterySets={lotterySets}
        defaultDoubleSets={DOUBLE_SETS}
      />
      <SetManagerModal 
        isOpen={isSetManagerOpen}
        onClose={() => setIsSetManagerOpen(false)}
        lotterySets={lotterySets}
        setLotterySets={setLotterySets}
        updateSetNumber={updateSetNumber}
        defaultLotterySets={INITIAL_LOTTERY_SETS}
      />
      <WeeklyScheduleModal 
        isOpen={isWeeklyScheduleOpen}
        onClose={() => setIsWeeklyScheduleOpen(false)}
        weeklySchedules={weeklySchedules}
        setWeeklySchedules={setWeeklySchedules}
        stationConfigs={stationConfigs}
        setStationConfigs={setStationConfigs}
      />

      <SellerPreferencesModal 
        isOpen={isSellerPrefOpen}
        onClose={() => setIsSellerPrefOpen(false)}
        seller={sellers.find(s => s.id === editingSellerId) || null}
        updateSeller={updateSeller}
        lotterySets={lotterySets}
        dailyInput={dailyInput}
        isQuickSelectOpen={isQuickSelectOpen}
        setIsQuickSelectOpen={setIsQuickSelectOpen}
      />

      <SellerOverridesModal 
        isOpen={isSellerOverridesOpen}
        onClose={() => setIsSellerOverridesOpen(false)}
        seller={sellers.find(s => s.id === editingSellerId) || null}
        updateSeller={updateSeller}
        stationConfigs={stationConfigs}
      />

      <QrModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        copySuccess={copySuccess}
        handleCopyLink={handleCopyLink}
      />
    </div>
  );
}
