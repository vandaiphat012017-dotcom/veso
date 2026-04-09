import { useState, useEffect } from 'react';
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
import { Seller, DistributionResult, DailyInput, LotterySet, Shortage, WeeklySchedule, DailyStationConfig } from './types';
import { INITIAL_SELLERS, LOTTERY_SETS, DOUBLE_SETS, getPairId } from './constants';
import { distributeTickets } from './utils/lotteryLogic';

export default function App() {
  const [sellers, setSellers] = useState<Seller[]>(INITIAL_SELLERS);
  const [lotterySets, setLotterySets] = useState<LotterySet[]>(LOTTERY_SETS);
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
  const [history, setHistory] = useState<DistributionResult[][]>([]);
  const [activeTab, setActiveTab] = useState<'distribute' | 'sellers' | 'history'>('distribute');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingStation, setEditingStation] = useState<string>('main');
  const [isSetManagerOpen, setIsSetManagerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<LotterySet | null>(null);
  const [setInventory, setSetInventory] = useState<Record<string, Record<string, { q16: number, q32: number }>>>({});
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSellerPrefOpen, setIsSellerPrefOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      mainStationBaseQuantity: 160, // Default 160 tickets
      subStationBaseQuantities: { 'sub1': 0, 'sub2': 0 },
      isActive: false
    }))
  );
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState(false);
  const [doubleSets, setDoubleSets] = useState<Record<string, string>>(DOUBLE_SETS);
  const [isDoubleSetManagerOpen, setIsDoubleSetManagerOpen] = useState(false);
  const [stationConfigs, setStationConfigs] = useState<DailyStationConfig[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      mainStationName: i === 0 ? 'Kiên Giang' : i === 1 ? 'TP.HCM' : i === 2 ? 'Bến Tre' : i === 3 ? 'Cần Thơ' : i === 4 ? 'Tây Ninh' : i === 5 ? 'Vĩnh Long' : 'TP.HCM',
      subStations: [
        { id: 'sub1', name: 'Đài Phụ 1' },
        { id: 'sub2', name: 'Đài Phụ 2' }
      ]
    }))
  );
  const [searchNumber, setSearchNumber] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);

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
    
    if (schedule && schedule.isActive) {
      // If active, we could automatically fill the inventory
      // But maybe it's better to just provide a "Apply Schedule" button to avoid overwriting manual work
    }
  }, [dailyInput.date, weeklySchedules]);

  const updateSetInventory = (setId: string, type: 'q16' | 'q32', val: number) => {
    const currentInv = setInventory[editingStation]?.[setId] || { q16: 0, q32: 0 };
    const newQ16 = type === 'q16' ? val : currentInv.q16;
    const newQ32 = type === 'q32' ? val : currentInv.q32;
    const totalPerNum = (newQ16 * 16) + (newQ32 * 32);

    setSetInventory(prev => ({
      ...prev,
      [editingStation]: {
        ...(prev[editingStation] || {}),
        [setId]: { q16: newQ16, q32: newQ32 }
      }
    }));

    const set = lotterySets.find(s => s.id === setId);
    if (!set) return;

    setDailyInput(prev => {
      if (editingStation === 'main') {
        const newMain = { ...prev.mainStationTickets };
        set.numbers.forEach(n => {
          if (totalPerNum <= 0) delete newMain[n];
          else newMain[n] = totalPerNum;
        });
        return { ...prev, mainStationTickets: newMain };
      } else {
        const newSubs = prev.subStations.map(s => {
          if (s.id === editingStation) {
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
      } else if (seller.isAutoMode) {
        startSetIndex = (baseSetIndex + sIdx) % lotterySets.length;
      } else if (seller.manualSetId) {
        const manualIdx = lotterySets.findIndex(ls => ls.id === seller.manualSetId);
        if (manualIdx !== -1) startSetIndex = manualIdx;
      }
      
      const startSet = lotterySets[startSetIndex] || { id: '??' };
      
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
        setName: startSet.id,
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
      
      // Main station tickets
      Object.entries(res.mainStationQuantities || {}).forEach(([num, qty]) => {
        if (qty > 0) {
          const stationName = config?.mainStationName || 'Đài Chính';
          allTickets.push(`
            <div class="ticket">
              <div class="header">
                ${new Date(res.date).toLocaleDateString('vi-VN')} - ${stationName}
              </div>
              <div class="quantity">
                ${qty}
              </div>
              <div class="footer">
                <div class="seller-name">${res.sellerName} ${num !== 'Dự kiến' ? `- Số ${num}` : ''}</div>
                <div class="set-name">Bộ ${res.setName}</div>
              </div>
            </div>
          `);
        }
      });
      
      // Sub stations tickets
      res.subStationResults.forEach(sub => {
        Object.entries(sub.quantities || {}).forEach(([num, qty]) => {
          if (qty > 0) {
            allTickets.push(`
              <div class="ticket">
                <div class="header">
                  ${new Date(res.date).toLocaleDateString('vi-VN')} - ${sub.name}
                </div>
                <div class="quantity">
                  ${qty}
                </div>
                <div class="footer">
                  <div class="seller-name">${res.sellerName} ${num !== 'Dự kiến' ? `- Số ${num}` : ''}</div>
                  <div class="set-name">Bộ ${res.setName}</div>
                </div>
              </div>
            `);
          }
        });
      });
    });

    if (allTickets.length === 0) {
      printWindow.close();
      return;
    }

    const html = `
      <html>
        <head>
          <title>In Phiếu Phân Phối</title>
          <style>
            @page {
              size: A4;
              margin: 5mm;
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: sans-serif; 
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              grid-template-rows: repeat(5, 1fr);
              width: 200mm;
              height: 287mm;
              gap: 0;
              page-break-after: always;
            }
            .ticket { 
              border: 0.5pt solid #ccc; 
              padding: 5px; 
              display: flex; 
              flex-direction: column; 
              justify-content: space-between; 
              align-items: center;
              box-sizing: border-box;
              overflow: hidden;
              text-align: center;
            }
            .header { 
              font-size: 12px; 
              font-weight: bold; 
              color: #000;
              width: 100%;
              border-bottom: 1pt solid #000;
              padding-bottom: 1px;
            }
            .quantity { 
              font-size: 72px; 
              font-weight: 900; 
              line-height: 0.9;
              margin: 0;
              color: #000;
            }
            .footer { 
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 0;
              color: #000;
              border-top: 1pt solid #000;
              padding-top: 1px;
            }
            .seller-name {
              font-size: 24px;
              font-weight: 900;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
            }
            .set-name {
              font-size: 14px;
              font-weight: bold;
              line-height: 1;
            }
            @media print {
              .grid-container {
                page-break-after: always;
              }
              .grid-container:last-child {
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          ${Array.from({ length: Math.ceil(allTickets.length / 20) }).map((_, i) => `
            <div class="grid-container">
              ${allTickets.slice(i * 20, (i + 1) * 20).join('')}
            </div>
          `).join('')}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;
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
        csv += `${res.date},${res.sellerName},${res.setName},${config?.mainStationName || 'Đài Chính'},${num},${qty}\n`;
      });
      
      // Subs
      res.subStationResults.forEach(sub => {
        Object.entries(sub.quantities || {}).forEach(([num, qty]) => {
          csv += `${res.date},${res.sellerName},${res.setName},${sub.name},${num},${qty}\n`;
        });
      });
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `chia_ve_${dailyInput.date}.csv`);
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
    link.setAttribute("download", `backup_chia_ve_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load history and sets from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('lottery_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSets = localStorage.getItem('lottery_sets');
    if (savedSets) setLotterySets(JSON.parse(savedSets));

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
    if (savedWeekly) setWeeklySchedules(JSON.parse(savedWeekly));

    const savedDailyInput = localStorage.getItem('lottery_daily_input');
    if (savedDailyInput) setDailyInput(JSON.parse(savedDailyInput));

    const savedStationConfigs = localStorage.getItem('lottery_station_configs');
    if (savedStationConfigs) setStationConfigs(JSON.parse(savedStationConfigs));
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
      const qty = schedule.mainStationBaseQuantity;
      const newMain: Record<string, number> = {};
      lotterySets.forEach(set => {
        set.numbers.forEach(num => {
          newMain[num] = qty;
        });
      });
      
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
    const targetSellers = sellerId 
      ? sellers.filter(s => s.id === sellerId)
      : sellers.filter(s => s.isEnabled);

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
        targetSellers,
        initialMain,
        dailyInput.subStations,
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
      
      setShortages(report.shortages);

      if (report.results.length > 0) {
        const updatedHistory = [report.results, ...history].slice(0, 30); // Keep 30 days
        setHistory(updatedHistory);
        localStorage.setItem('lottery_history', JSON.stringify(updatedHistory));
      }
      
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
      name: `Người mới ${sellers.length + 1}`,
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
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 z-10 shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Ticket className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">CHIA VÉ 4.0</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('distribute')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'distribute' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Play size={20} />
            <span>Chia Vé</span>
          </button>
          <button 
            onClick={() => setActiveTab('sellers')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'sellers' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={20} />
            <span>Người Bán</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} />
            <span>Lịch Sử</span>
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setIsSetManagerOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
          >
            <Edit3 size={20} />
            <span>Quản Lý Bộ Số</span>
          </button>

          <button 
            onClick={() => setIsDoubleSetManagerOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
          >
            <Layers size={20} />
            <span>Quản Lý Bộ Đôi</span>
          </button>

          {showInstallBtn && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <Download size={20} />
              <span>Cài Đặt Ứng Dụng</span>
            </button>
          )}

          <button 
            onClick={() => setIsQrModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
          >
            <QrCode size={20} />
            <span>Quét Mã QR Cài Đặt</span>
          </button>

          <button 
            onClick={handleExportCSV}
            disabled={results.length === 0}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border border-transparent ${results.length > 0 ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100' : 'text-slate-300 cursor-not-allowed'}`}
          >
            <Download size={20} />
            <span>Tải Kết Quả (CSV)</span>
          </button>

          <button 
            onClick={handleBackupData}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
          >
            <Save size={20} />
            <span>Sao Lưu Toàn Bộ</span>
          </button>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <TrendingUp size={14} />
              <span>Tỷ lệ kho vé hiện tại</span>
            </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">Đài Chính</span>
                  <span className="text-xs font-black text-indigo-600">{currentRatio}%</span>
                </div>
                {(dailyInput?.subStations || []).map(sub => {
                  const subTotal = (Object.values(sub.tickets || {}) as number[]).reduce((a, b) => a + b, 0);
                  const ratio = totalTickets > 0 ? Math.round((subTotal / totalTickets) * 100) : 0;
                  return (
                    <div key={sub.id} className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">{sub.name}</span>
                      <span className="text-xs font-black text-emerald-600">{ratio}%</span>
                    </div>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-800 uppercase">Tổng Cộng</span>
                  <span className="text-xs font-black text-slate-800">100%</span>
                </div>
              </div>
          </div>
        </div>
      </div>

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
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handlePrintResults(results.length > 0 ? results : getDraftResults())}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${results.length > 0 ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'}`}
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

        <AnimatePresence>
          {activeTab === 'distribute' && (
            <motion.div 
              key="distribute"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Input Panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Daily Input Panel */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Kho Vé Ngày</h3>
                        <p className="text-xs text-slate-400 font-medium">Nhập tổng vé hiện có</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(() => {
                        const date = new Date(dailyInput.date);
                        const dayOfWeek = date.getDay();
                        const schedule = weeklySchedules.find(s => s.dayOfWeek === dayOfWeek);
                        if (schedule && schedule.isActive) {
                          return (
                            <button 
                              onClick={applyWeeklySchedule}
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                              title={`Áp dụng lịch trình (${schedule.mainStationBaseQuantity} vé)`}
                            >
                              <RefreshCw size={20} />
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <button 
                        onClick={resetPools}
                        className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                        title="Làm mới kho vé"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ngày Phân Phối</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="date" 
                            value={dailyInput.date}
                            onChange={(e) => setDailyInput({ ...dailyInput, date: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="pt-5">
                        <button 
                          onClick={() => setIsWeeklyScheduleOpen(true)}
                          className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100"
                          title="Lịch trình hàng tuần"
                        >
                          <Settings size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Search and Quick Adjust */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input 
                            type="text"
                            placeholder="Tìm số (00-99)..."
                            value={searchNumber}
                            onChange={(e) => setSearchNumber(e.target.value.slice(0, 2))}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                            className="w-16 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button 
                            onClick={() => searchNumber.length === 2 && adjustInventory(searchNumber, adjustAmount, editingStation)}
                            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                            title="Cộng vào kho"
                          >
                            <Plus size={20} />
                          </button>
                          <button 
                            onClick={() => searchNumber.length === 2 && adjustInventory(searchNumber, -adjustAmount, editingStation)}
                            className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                            title="Trừ khỏi kho"
                          >
                            <MinusCircle size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setEditingStation('main')}
                        className={`flex-1 min-w-[100px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${editingStation === 'main' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}
                      >
                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-1 relative z-10">
                          {stationConfigs.find(c => c.dayOfWeek === new Date(dailyInput.date).getDay())?.mainStationName || 'Đài Chính'}
                        </div>
                        <div className="text-lg font-black text-slate-800 relative z-10">{(Object.values(dailyInput.mainStationTickets) as number[]).reduce((a, b) => a + b, 0)}</div>
                        {editingStation === 'main' && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-600/5 rounded-full" />}
                      </button>
                      {(dailyInput?.subStations || []).map(sub => {
                        const subConfig = stationConfigs.find(c => c.dayOfWeek === new Date(dailyInput.date).getDay())?.subStations.find(s => s.id === sub.id);
                        return (
                          <button 
                            key={sub.id}
                            onClick={() => setEditingStation(sub.id)}
                            className={`flex-1 min-w-[100px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${editingStation === sub.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}
                          >
                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-1 relative z-10">{subConfig?.name || sub.name}</div>
                            <div className="text-lg font-black text-slate-800 relative z-10">{(Object.values(sub.tickets || {}) as number[]).reduce((a, b) => a + b, 0)}</div>
                            {editingStation === sub.id && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-emerald-500/5 rounded-full" />}
                          </button>
                        );
                      })}
                    </div>

                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-bold text-slate-400 uppercase">
                            Nhập theo Bộ (16/32 vé)
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSetInventory(prev => ({ ...prev, [editingStation]: {} }));
                                setDailyInput(prev => {
                                  if (editingStation === 'main') {
                                    return { ...prev, mainStationTickets: {} };
                                  } else {
                                    return {
                                      ...prev,
                                      subStations: prev.subStations.map(s => s.id === editingStation ? { ...s, tickets: {} } : s)
                                    };
                                  }
                                });
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              Xoá hết
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                          {lotterySets.map(set => {
                            const inv = setInventory[editingStation]?.[set.id] || { q16: 0, q32: 0 };
                            
                            return (
                              <div key={set.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">Bộ {set.id}</span>
                                    <span className="text-[8px] font-medium text-slate-400 truncate w-32">{set.numbers.join(', ')}</span>
                                  </div>
                                  <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                    {inv.q16 * 16 + inv.q32 * 32} vé/số ({ (inv.q16 * 16 + inv.q32 * 32) * set.numbers.length } vé tổng)
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Bộ 16 vé</label>
                                    <input 
                                      type="number" 
                                      value={inv.q16 || ''}
                                      onChange={(e) => updateSetInventory(set.id, 'q16', parseInt(e.target.value) || 0)}
                                      className="w-full text-center py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Bộ 32 vé</label>
                                    <input 
                                      type="number" 
                                      value={inv.q32 || ''}
                                      onChange={(e) => updateSetInventory(set.id, 'q32', parseInt(e.target.value) || 0)}
                                      className="w-full text-center py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4">
                        <button 
                          onClick={() => {
                            const grid = document.getElementById('full-grid');
                            if (grid) grid.classList.toggle('hidden');
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <ChevronDown size={12} />
                          <span>Xem chi tiết 100 con</span>
                        </button>
                        
                        <div id="full-grid" className="hidden mt-4 grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1 scrollbar-hide border-t border-slate-100 pt-4">
                          {Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')).map(num => {
                            const qty = editingStation === 'main' 
                              ? dailyInput.mainStationTickets[num] || 0 
                              : (dailyInput.subStations.find(s => s.id === editingStation)?.tickets[num] || 0);
                            return (
                              <div key={num} className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 mb-1">{num}</span>
                                <input 
                                  type="number" 
                                  value={qty || ''}
                                  onChange={(e) => updateTicketQuantity(num, parseInt(e.target.value) || 0, editingStation)}
                                  className={`w-full text-center py-2 text-xs font-bold rounded-xl border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                  placeholder="0"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Individual Distribution Panel */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Chia Từng Người</h3>
                        <p className="text-xs text-slate-400 font-medium">Xử lý phân phối riêng biệt</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Tìm người bán..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48"
                        />
                        <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleDistribute()}
                          disabled={isProcessing || sellers.filter(s => s.isEnabled).every(s => results.some(r => r.sellerId === s.id))}
                          className="text-[10px] font-bold text-indigo-600 hover:underline disabled:opacity-50"
                        >
                          Chia tất cả
                        </button>
                      <button 
                        onClick={() => {
                          setResults([]);
                          const initialSubPools: Record<string, Record<string, number>> = {};
                          dailyInput.subStations.forEach(s => {
                            initialSubPools[s.id] = { ...s.tickets };
                          });
                          setCurrentPools({
                            main: { ...dailyInput.mainStationTickets },
                            subPools: initialSubPools
                          });
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Xóa kết quả
                      </button>
                    </div>
                  </div>
                </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                    {sellers
                      .filter(s => s.isEnabled && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(seller => {
                        const isDistributed = results.some(r => r.sellerId === seller.id);
                      const result = results.find(r => r.sellerId === seller.id);
                      
                      return (
                        <div key={seller.id} className={`p-6 rounded-[32px] border transition-all ${isDistributed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'}`}>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDistributed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {seller.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">{seller.name}</span>
                                {!isDistributed && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <button 
                                      onClick={() => updateSeller(seller.id, { mainEnabled: !seller.mainEnabled })}
                                      className={`px-2 py-0.5 rounded text-[8px] font-bold transition-colors ${seller.mainEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                      Chính
                                    </button>
                                    {(dailyInput?.subStations || []).map(sub => (
                                      <span key={sub.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded uppercase">
                                        {sub.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Sở Thích Summary */}
                                {(seller.customPreferences || []).length > 0 && !isDistributed && (
                                  <div className="mt-3 flex flex-wrap gap-1 items-center">
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                      <Star size={8} fill="currentColor" />
                                      <span>SỞ THÍCH:</span>
                                    </div>
                                    {seller.customPreferences?.map((pref, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[8px] font-bold rounded border border-slate-200">
                                        {pref.number} ({pref.quantity}t)
                                      </span>
                                    ))}
                                    <button 
                                      onClick={() => {
                                        setEditingSellerId(seller.id);
                                        setIsSellerPrefOpen(true);
                                      }}
                                      className="text-[8px] font-bold text-indigo-600 hover:underline ml-1"
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isDistributed ? (
                              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Hoàn tất</span>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleDistribute(seller.id)}
                                disabled={isProcessing}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2"
                              >
                                {isProcessing ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Play size={14} fill="currentColor" />
                                )}
                                <span>Chia ngay</span>
                              </button>
                            )}
                          </div>

                          {!isDistributed ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Loại Bộ</label>
                                  <select 
                                    value={seller.setType}
                                    onChange={(e) => updateSeller(seller.id, { setType: e.target.value as 'single' | 'double' })}
                                    className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="single">Bộ Đơn (10 số)</option>
                                    <option value="double">Bộ Đôi (20 số)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bộ Số</label>
                                  <select 
                                    value={seller.manualSetId || ''}
                                    onChange={(e) => updateSeller(seller.id, { manualSetId: e.target.value || undefined, isAutoMode: !e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Tự động xoay vòng</option>
                                    {lotterySets.map(set => (
                                      <option key={set.id} value={set.id}>Bộ {set.id}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Số Tờ/Số</label>
                                  <select 
                                    value={seller.sheetsOption}
                                    onChange={(e) => {
                                      const option = e.target.value as '16' | '32' | 'custom';
                                      const sheets = option === '16' ? 16 : option === '32' ? 32 : (seller.customSheets || 10);
                                      updateSeller(seller.id, { 
                                        sheetsOption: option,
                                        targetTotalTickets: sheets * (seller.setType === 'single' ? 10 : 20)
                                      });
                                    }}
                                    className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="16">16 tờ/số</option>
                                    <option value="32">32 tờ/số</option>
                                    <option value="custom">Tùy chỉnh</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phân bổ đài</label>
                                  <div className="flex bg-slate-50 p-1 rounded-xl">
                                    <button 
                                      onClick={() => updateSeller(seller.id, { allocationMode: 'auto' })}
                                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${seller.allocationMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                      Tự động
                                    </button>
                                    <button 
                                      onClick={() => updateSeller(seller.id, { allocationMode: 'manual' })}
                                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${seller.allocationMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                      Tùy chỉnh
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                                    {seller.allocationMode === 'manual' ? 'Vé Đài Chính' : 'Tổng Vé Lấy'}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      value={seller.targetTotalTickets}
                                      onChange={(e) => updateSeller(seller.id, { targetTotalTickets: parseInt(e.target.value) || 0 })}
                                      className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tờ</span>
                                  </div>
                                </div>
                                {seller.allocationMode === 'auto' && seller.mainEnabled && (
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Tỷ lệ Đài Chính</label>
                                        <span className="text-[10px] font-bold text-indigo-600">{seller.customRatio !== undefined ? seller.customRatio : currentRatio}%</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        step="5"
                                        value={seller.customRatio !== undefined ? seller.customRatio : currentRatio}
                                        onChange={(e) => updateSeller(seller.id, { customRatio: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                      />
                                    </div>
                                    {(dailyInput?.subStations || []).map(sub => (
                                      <div key={sub.id}>
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Tỷ lệ {sub.name}</label>
                                          <span className="text-[10px] font-bold text-indigo-600">{seller.subStationRatios?.[sub.id] || 0}%</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min="0" 
                                          max="100" 
                                          step="5"
                                          value={seller.subStationRatios?.[sub.id] || 0}
                                          onChange={(e) => {
                                            const newRatios = { ...(seller.subStationRatios || {}) };
                                            newRatios[sub.id] = parseInt(e.target.value);
                                            updateSeller(seller.id, { subStationRatios: newRatios });
                                          }}
                                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5">Bộ đã chia</div>
                                  <div className="text-xs font-black text-emerald-700">{result?.setName}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5">Tổng vé nhận</div>
                                  <div className="text-xs font-black text-emerald-700">{result?.totalSheets} tờ</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {result?.mainStationNumbers.length > 0 && (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase mr-1">Chính:</span>
                                    {result?.mainStationNumbers.map(n => {
                                      const qty = result.mainStationQuantities?.[n];
                                      return (
                                        <div key={n} className="flex flex-col items-center">
                                          <span className="px-1.5 py-0.5 bg-white rounded text-[10px] font-bold text-emerald-600 border border-emerald-100">{n}</span>
                                          {qty && qty !== (sellers.find(s => s.id === seller.id)?.sheetsOption === '32' ? 32 : (sellers.find(s => s.id === seller.id)?.sheetsOption === 'custom' ? (sellers.find(s => s.id === seller.id)?.customSheets || 16) : 16)) && (
                                            <span className="text-[6px] font-black text-rose-500 mt-0.5">{qty}t</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {result?.subStationResults.some(r => r.numbers.length > 0) && (
                                  <div className="flex flex-col gap-1">
                                    {result?.subStationResults.map(sr => sr.numbers.length > 0 && (
                                      <div key={sr.id} className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase mr-1 truncate max-w-[40px]">{sr.name}:</span>
                                        {sr.numbers.map(n => {
                                          const qty = sr.quantities?.[n];
                                          return (
                                            <div key={n} className="flex flex-col items-center">
                                              <span key={n} className="px-1.5 py-0.5 bg-emerald-100 rounded text-[10px] font-bold text-emerald-700">{n}</span>
                                              {qty && qty !== (sellers.find(s => s.id === seller.id)?.sheetsOption === '32' ? 32 : (sellers.find(s => s.id === seller.id)?.sheetsOption === 'custom' ? (sellers.find(s => s.id === seller.id)?.customSheets || 16) : 16)) && (
                                                <span className="text-[6px] font-black text-rose-500 mt-0.5">{qty}t</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                {results.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <LayoutDashboard size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Tổng Hợp Kết Quả</h3>
                            <p className="text-xs text-slate-400 font-medium">Thống kê lượng vé đã chia</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Đài Chính Đã Chia</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-indigo-600">
                              {results.reduce((acc, r) => acc + (Object.values(r.mainStationQuantities || {}) as number[]).reduce((a, b) => a + b, 0), 0)}
                            </span>
                            <span className="text-xs font-bold text-indigo-400">/ {totalMain} tờ</span>
                          </div>
                        </div>
                        
                        {(dailyInput?.subStations || []).map(sub => {
                          const subTotalDistributed = results.reduce((acc, r) => {
                            const subRes = r.subStationResults.find(sr => sr.id === sub.id);
                            return acc + (subRes ? (Object.values(subRes.quantities || {}) as number[]).reduce((a, b) => a + b, 0) : 0);
                          }, 0);
                          const subInitialTotal = (Object.values(sub.tickets || {}) as number[]).reduce((a, b) => a + b, 0);
                          
                          return (
                            <div key={sub.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">{sub.name} Đã Chia</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-600">{subTotalDistributed}</span>
                                <span className="text-xs font-bold text-emerald-400">/ {subInitialTotal} tờ</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {results.map((res, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={res.sellerId}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-xl font-bold text-slate-800">{res.sellerName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md uppercase">Bộ {res.setName}</span>
                              <span className="text-slate-400 text-xs font-medium">• {res.totalSheets} tờ tổng cộng</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handlePrint(res)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                              title="In phiếu"
                            >
                              <Printer size={18} />
                            </button>
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} />
                              Hợp lệ
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-3">
                              <Hash size={14} />
                              Đài Chính
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {res.mainStationNumbers.map(n => {
                                const qty = res.mainStationQuantities?.[n];
                                return (
                                  <div key={n} className="flex flex-col items-center gap-1">
                                    <span className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg font-bold text-slate-700 shadow-sm">
                                      {n}
                                    </span>
                                    {qty && qty !== (sellers.find(s => s.id === res.sellerId)?.sheetsOption === '32' ? 32 : (sellers.find(s => s.id === res.sellerId)?.sheetsOption === 'custom' ? (sellers.find(s => s.id === res.sellerId)?.customSheets || 16) : 16)) && (
                                      <span className="text-[10px] font-black text-rose-500">{qty} tờ</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {res.subStationResults.map(subRes => (
                            <div key={subRes.id} className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase mb-3">
                                <Hash size={14} />
                                {subRes.name}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {subRes.numbers.map(n => {
                                  const qty = subRes.quantities?.[n];
                                  return (
                                    <div key={n} className="flex flex-col items-center gap-1">
                                      <span className="w-10 h-10 flex items-center justify-center bg-white border border-indigo-100 rounded-lg font-bold text-indigo-600 shadow-sm">
                                        {n}
                                      </span>
                                      {qty && qty !== (sellers.find(s => s.id === res.sellerId)?.sheetsOption === '32' ? 32 : (sellers.find(s => s.id === res.sellerId)?.sheetsOption === 'custom' ? (sellers.find(s => s.id === res.sellerId)?.customSheets || 16) : 16)) && (
                                        <span className="text-[10px] font-black text-rose-500">{qty} tờ</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Play size={32} className="text-slate-300 ml-1" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 mb-2">Sẵn sàng chia vé</h3>
                    <p className="max-w-xs text-sm">Nhấn nút "CHIA VÉ NGAY" để bắt đầu phân phối số cho ngày hôm nay.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'sellers' && (
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
                      setSellers(INITIAL_SELLERS);
                      localStorage.removeItem('lottery_sellers');
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    title="Khôi phục danh sách người bán gốc"
                  >
                    <RefreshCw size={18} />
                    Đặt lại mặc định
                  </button>
                  <button 
                    onClick={() => {
                      const newId = (sellers.length + 1).toString().padStart(2, '0');
                      setSellers([...sellers, { ...INITIAL_SELLERS[0], id: newId, name: `Người Bán ${newId}` }]);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <Plus size={20} />
                    Thêm Người Bán
                  </button>
                  {results.length > 0 && (
                    <button 
                      onClick={() => handlePrintResults(results)}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <Printer size={20} />
                      In Tất Cả Phiếu
                    </button>
                  )}
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
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tổng Vé Cần Lấy</th>
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
                    {Array.isArray(sellers) && sellers
                      .filter(s => s && s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                              title="% Đài Chính"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                          {(dailyInput?.subStations || []).map(sub => (
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
                                title={`% ${sub.name}`}
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
                            <option value="custom">Tuỳ chọn</option>
                          </select>
                          {seller.sheetsOption === 'custom' && (
                            <input 
                              type="number" 
                              value={seller.customSheets || ''}
                              onChange={(e) => updateSeller(seller.id, { customSheets: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-3 py-1 outline-none"
                              placeholder="Số tờ..."
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          value={seller.targetTotalTickets}
                          onChange={(e) => updateSeller(seller.id, { targetTotalTickets: parseInt(e.target.value) || 0 })}
                          className="w-24 bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-600 px-3 py-1.5 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {(seller.customPreferences || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {seller.customPreferences?.map((pref, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100">
                                  {pref.number}({pref.quantity})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Trống</span>
                          )}
                          <button 
                            onClick={() => {
                              setEditingSellerId(seller.id);
                              setIsSellerPrefOpen(true);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline text-left mt-1"
                          >
                            + Chỉnh sửa
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateSeller(seller.id, { isAutoMode: !seller.isAutoMode })}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${seller.isAutoMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                              {seller.isAutoMode ? 'TỰ ĐỘNG' : 'CỐ ĐỊNH'}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingSellerId(seller.id);
                                setIsSellerPrefOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                              title="Sở thích & Ưu tiên"
                            >
                              <Settings size={14} />
                            </button>
                          </div>
                          
                          <select 
                            value={seller.isAutoMode ? seller.currentSetIndex : (seller.manualSetId || '00')}
                            onChange={(e) => {
                              if (seller.isAutoMode) {
                                updateSeller(seller.id, { currentSetIndex: parseInt(e.target.value) });
                              } else {
                                updateSeller(seller.id, { manualSetId: e.target.value });
                              }
                            }}
                            className="bg-slate-100 border-none rounded-lg text-sm font-semibold text-slate-600 px-3 py-1.5 outline-none"
                          >
                            {seller.setType === 'single' ? (
                              lotterySets.map((set, idx) => (
                                <option key={set.id} value={seller.isAutoMode ? idx : set.id}>
                                  Bộ {set.id}
                                </option>
                              ))
                            ) : (
                              lotterySets.map((set, idx) => {
                                const pairId = getPairId(set.id);
                                return (
                                  <option key={set.id} value={seller.isAutoMode ? idx : set.id}>
                                    Cặp {set.id} - {pairId}
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handlePrintResults(getDraftResults(seller.id))}
                            className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                            title="In phiếu dự kiến"
                          >
                            <Printer size={18} />
                          </button>
                          <button 
                            onClick={() => removeSeller(seller.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </motion.div>
      )}

          {activeTab === 'history' && (
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
                            <span className="text-xs font-bold text-indigo-500">Bộ {res.setName}</span>
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
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Chưa có lịch sử phân phối.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Shortage Modal */}
      <AnimatePresence>
        {shortages.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-rose-500 p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle size={24} />
                    <h3 className="text-2xl font-bold">Thiếu hụt kho vé!</h3>
                  </div>
                  <p className="opacity-90 font-medium">Hệ thống không tìm đủ vé để chia cho một số người bán.</p>
                </div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="p-8">
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-8 pr-2">
                  {shortages.map((s, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-5 bg-rose-50 rounded-3xl border border-rose-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-lg">{s.sellerName}</div>
                          <div className="text-xs font-bold text-rose-500 uppercase mt-1">
                            Thiếu {s.needed} số {s.station === 'main' ? 'Đài Chính' : s.station === 'ưu tiên' ? 'Số Ưu Tiên' : `Đài Phụ (${s.station})`}
                          </div>
                        </div>
                        <div className="text-rose-400">
                          <AlertCircle size={24} />
                        </div>
                      </div>

                      {s.missingNumber && (
                        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-rose-100/50">
                          <p className="text-xs text-slate-500 font-medium italic">
                            Số bị thiếu: <span className="text-rose-600 font-bold text-sm">{s.missingNumber}</span>
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                addTicketsToInventory(s.station, s.missingNumber!, s.needed);
                                setShortages(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="flex-1 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
                            >
                              <Plus size={12} /> Thêm {s.needed} vé
                            </button>
                            <button 
                              onClick={() => {
                                setEditingSellerId(s.sellerId);
                                setIsSellerPrefOpen(true);
                                setShortages([]);
                              }}
                              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-1"
                            >
                              <Edit3 size={12} /> Đổi số khác
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!s.missingNumber && (
                        <div className="mt-2 pt-3 border-t border-rose-100/50">
                          <button 
                            onClick={() => {
                              setEditingSellerId(s.sellerId);
                              setIsSellerPrefOpen(true);
                              setShortages([]);
                            }}
                            className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-1"
                          >
                            <Settings size={12} /> Điều chỉnh người bán
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setShortages([])}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Đóng và tự xử lý
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Double Set Manager Modal */}
      <AnimatePresence>
        {isDoubleSetManagerOpen && (
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
                  onClick={() => setIsDoubleSetManagerOpen(false)}
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
                  onClick={() => setDoubleSets(DOUBLE_SETS)}
                  className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Khôi phục mặc định
                </button>
                <button 
                  onClick={() => setIsDoubleSetManagerOpen(false)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Lưu & Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Set Manager Modal */}
      <AnimatePresence>
        {isSetManagerOpen && (
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
                    onClick={() => setIsSetManagerOpen(false)}
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
                      setLotterySets(LOTTERY_SETS);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  <RefreshCw size={20} />
                  Khôi phục mặc định
                </button>
                <button 
                  onClick={() => setIsSetManagerOpen(false)}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  <Save size={20} />
                  Lưu & Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Weekly Schedule Modal */}
      <AnimatePresence>
        {isWeeklyScheduleOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <div>
                  <h3 className="text-2xl font-bold">Lịch Trình Hàng Tuần</h3>
                  <p className="text-sm opacity-80 font-medium">Thiết lập lượng vé cố định cho từng ngày trong tuần</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const base = weeklySchedules[0].mainStationBaseQuantity;
                      setWeeklySchedules(prev => prev.map(s => ({ ...s, mainStationBaseQuantity: base })));
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                    title="Áp dụng giá trị của Chủ Nhật cho tất cả các ngày"
                  >
                    Sao chép CN
                  </button>
                  <button 
                    onClick={() => {
                      setWeeklySchedules(prev => prev.map(s => ({ ...s, isActive: true })));
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                  >
                    Bật tất cả
                  </button>
                  <button 
                    onClick={() => setIsWeeklyScheduleOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                {['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].map((dayName, idx) => {
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
                  onClick={() => setIsWeeklyScheduleOpen(false)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSellerPrefOpen && editingSellerId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              {(() => {
                const seller = sellers.find(s => s.id === editingSellerId);
                if (!seller) return null;
                return (
                  <>
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                      <div>
                        <h3 className="text-2xl font-bold">Sở Thích Người Bán</h3>
                        <p className="text-sm opacity-80 font-medium">{seller.name}</p>
                      </div>
                      <button 
                        onClick={() => setIsSellerPrefOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                      {/* Fixed Set Preference */}
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <Target size={18} className="text-indigo-600" />
                          <h4 className="font-bold text-slate-800">Bộ Số Cố Định</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <button 
                            onClick={() => updateSeller(seller.id, { fixedSetId: undefined })}
                            className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all ${!seller.fixedSetId ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                          >
                            Không cố định
                          </button>
                          {lotterySets.map(set => (
                            <button 
                              key={set.id}
                              onClick={() => updateSeller(seller.id, { fixedSetId: set.id })}
                              className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all ${seller.fixedSetId === set.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                            >
                              Bộ {set.id}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Custom Number Preferences */}
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Hash size={18} className="text-indigo-600" />
                            <h4 className="font-bold text-slate-800">Số Lượng Riêng Biệt</h4>
                          </div>
                          <button 
                            onClick={() => {
                              const prefs = seller.customPreferences || [];
                              updateSeller(seller.id, { customPreferences: [...prefs, { number: '00', quantity: 16 }] });
                            }}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            + Thêm số ưu tiên
                          </button>
                        </div>

                        {/* Quick Select Grid */}
                        <div className="mb-6">
                          <button 
                            onClick={() => setIsQuickSelectOpen(!isQuickSelectOpen)}
                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 mb-3"
                          >
                            <ChevronDown size={12} className={`transition-transform ${isQuickSelectOpen ? 'rotate-180' : ''}`} />
                            <span>Chọn nhanh từ bảng 100 số (Mặc định 16 tờ)</span>
                          </button>
                          {isQuickSelectOpen && (
                            <div className="grid grid-cols-10 gap-1 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              {Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')).map(num => {
                                const isSelected = (seller.customPreferences || []).some(p => p.number === num);
                                return (
                                  <button 
                                    key={num}
                                    onClick={() => {
                                      const prefs = [...(seller.customPreferences || [])];
                                      if (isSelected) {
                                        updateSeller(seller.id, { customPreferences: prefs.filter(p => p.number !== num) });
                                      } else {
                                        updateSeller(seller.id, { customPreferences: [...prefs, { number: num, quantity: 16 }] });
                                      }
                                    }}
                                    className={`aspect-square flex items-center justify-center text-[9px] font-bold rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {(seller.customPreferences || []).length > 0 ? (
                            (seller.customPreferences || []).map((pref, idx) => (
                              <div key={idx} className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Con số</label>
                                    <input 
                                      type="text" 
                                      value={pref.number}
                                      onChange={(e) => {
                                        const newPrefs = [...(seller.customPreferences || [])];
                                        newPrefs[idx].number = e.target.value.padStart(2, '0').slice(-2);
                                        updateSeller(seller.id, { customPreferences: newPrefs });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      maxLength={2}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Số lượng vé</label>
                                    <select 
                                      value={pref.quantity}
                                      onChange={(e) => {
                                        const newPrefs = [...(seller.customPreferences || [])];
                                        newPrefs[idx].quantity = parseInt(e.target.value);
                                        updateSeller(seller.id, { customPreferences: newPrefs });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                      <option value={16}>16 tờ</option>
                                      <option value={32}>32 tờ</option>
                                      <option value={160}>160 tờ</option>
                                      <option value={320}>320 tờ</option>
                                    </select>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newPrefs = (seller.customPreferences || []).filter((_, i) => i !== idx);
                                      updateSeller(seller.id, { customPreferences: newPrefs });
                                    }}
                                    className="mt-4 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Đài lấy vé</label>
                                    <select 
                                      value={pref.stationId || ''}
                                      onChange={(e) => {
                                        const newPrefs = [...(seller.customPreferences || [])];
                                        newPrefs[idx].stationId = e.target.value || undefined;
                                        updateSeller(seller.id, { customPreferences: newPrefs });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                      <option value="">Tự động (Chính {'>'} Phụ)</option>
                                      <option value="main">Đài Chính</option>
                                      {(dailyInput?.subStations || []).map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Ngày áp dụng</label>
                                    <select 
                                      value={pref.dayOfWeek === undefined ? '' : pref.dayOfWeek}
                                      onChange={(e) => {
                                        const newPrefs = [...(seller.customPreferences || [])];
                                        newPrefs[idx].dayOfWeek = e.target.value === '' ? undefined : parseInt(e.target.value);
                                        updateSeller(seller.id, { customPreferences: newPrefs });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                      <option value="">Tất cả các ngày</option>
                                      <option value="1">Thứ Hai</option>
                                      <option value="2">Thứ Ba</option>
                                      <option value="3">Thứ Tư</option>
                                      <option value="4">Thứ Năm</option>
                                      <option value="5">Thứ Sáu</option>
                                      <option value="6">Thứ Bảy</option>
                                      <option value="0">Chủ Nhật</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                              Chưa có số ưu tiên nào.
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                      <button 
                        onClick={() => setIsSellerPrefOpen(false)}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                      >
                        Hoàn Tất
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Quét Mã QR Để Cài Đặt</h3>
              <p className="text-sm text-slate-500 mb-8">Dùng camera điện thoại quét mã này để mở ứng dụng và cài đặt vào màn hình chính.</p>
              
              <div className="p-4 bg-white border-4 border-slate-50 rounded-2xl shadow-inner mb-6">
                <QRCodeSVG 
                  value={process.env.SHARED_APP_URL || process.env.APP_URL || window.location.origin} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="mb-6 w-full text-left">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Link Cài Đặt</p>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium truncate flex-1">
                    {process.env.SHARED_APP_URL || process.env.APP_URL || window.location.origin}
                  </span>
                  <button 
                    onClick={handleCopyLink}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                  >
                    {copySuccess ? 'Đã chép!' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 text-left">
                <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">Lưu ý lỗi 403/404:</p>
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  Nếu quét bị lỗi 403, bạn cần đăng nhập Google trên điện thoại hoặc sử dụng link <b>"Shared App"</b> từ menu AI Studio.
                </p>
              </div>

              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
