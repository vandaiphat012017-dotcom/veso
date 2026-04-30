import { DOUBLE_SETS, UGLY_NUMBERS, BEAUTIFUL_NUMBERS, FORBIDDEN_GROUPS, EXTREMELY_UGLY_NUMBERS, EXTREMELY_BEAUTIFUL_NUMBERS, getPairId } from '../constants';
import { Seller, DistributionResult, LotterySet, DistributionReport, Shortage } from '../types';

export function getNeutralNumbers(): string[] {
  const allNumbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
  return allNumbers.filter(n => !UGLY_NUMBERS.includes(n) && !BEAUTIFUL_NUMBERS.includes(n));
}

export function getDecade(num: string): number {
  return Math.floor(parseInt(num) / 10);
}

export function isForbidden(numbers: string[], setId?: string): boolean {
  for (const group of FORBIDDEN_GROUPS) {
    const intersection = group.filter(n => numbers.includes(n));
    if (intersection.length > 1) return true;
  }
  if (setId && ['00', '04', '05'].includes(setId)) {
    if (numbers.includes('45') || numbers.includes('85')) return true;
  }
  return false;
}

export function violatesDistributionRules(num: string, existing: string[], targetTotal: number): boolean {
  const decade = getDecade(num);
  const ending = num.slice(-1);
  
  const numbersToTakeCount = Math.ceil(targetTotal / 16); 
  
  // Rule 7: Ending Uniqueness
  const endingCount = existing.filter(n => n.slice(-1) === ending).length;
  // If we take 10 numbers, we want 10 different endings.
  if (numbersToTakeCount <= 12 && endingCount >= 1) return true;
  if (endingCount >= 2) return true; 

  // Rule 8: Decade Uniqueness (The "Duplicate Rows" Fix)
  const decadeCount = existing.filter(n => getDecade(n) === decade).length;
  // For 10 numbers, ideally 1 per decade. Use a stricter threshold.
  const threshold = numbersToTakeCount <= 12 ? 1 : Math.ceil(numbersToTakeCount / 8);
  if (decadeCount >= threshold) return true;
  
  return false;
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffle<T>(array: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function distributeTickets(
  date: string,
  sellers: Seller[],
  mainStationPool: Record<string, number>,
  subStations: { id: string, name: string, tickets: Record<string, number> }[],
  lotterySets: LotterySet[],
  doubleSets: Record<string, string>,
  history: DistributionResult[][] = []
): DistributionReport {
  const results: DistributionResult[] = [];
  const shortages: Shortage[] = [];
  
  const currentMainPool = { ...mainStationPool };
  const currentSubPools: Record<string, Record<string, number>> = {};
  subStations.forEach(s => {
    currentSubPools[s.id] = { ...s.tickets };
  });

  const getPairIdLocal = (id: string): string | undefined => {
    if (doubleSets[id]) return doubleSets[id];
    return Object.keys(doubleSets).find(key => doubleSets[key] === id);
  };

  const day = new Date(date).getDate();
  const baseSetIndex = (day - 1) % 10;
  
  const totalMainTickets = Object.values(currentMainPool).reduce((a, b) => a + b, 0);
  const totalSubTickets = Object.values(currentSubPools).reduce((acc, pool) => acc + Object.values(pool).reduce((a, b) => a + b, 0), 0);
  const globalMainRatio = (totalMainTickets + totalSubTickets) > 0 
    ? totalMainTickets / (totalMainTickets + totalSubTickets) 
    : 0.6;

  // Global history for gaps
  const recentHistory = history.slice(0, 3).flat();

  // Sort sellers by priority (High quantity first)
  const sortedSellers = [...sellers.filter(s => s.isEnabled)].sort((a, b) => b.targetTotalTickets - a.targetTotalTickets);

  sortedSellers.forEach((seller, idx) => {
    const sellerHistory = history
      .slice(0, 3) 
      .flatMap(dayResults => dayResults.filter(r => r.sellerId === seller.id))
      .flatMap(r => [...r.mainStationNumbers, ...r.subStationResults.flatMap(sr => sr.numbers)]);

    const stableIdx = (seller as any).originalIndex !== undefined ? (seller as any).originalIndex : idx;
    let startSetIndex = baseSetIndex;
    
    // Jump set logic (simplified: use manual or auto rotation)
    if (seller.fixedSetId) {
      const fixedIdx = lotterySets.findIndex(s => s.id === seller.fixedSetId);
      if (fixedIdx !== -1) startSetIndex = fixedIdx;
    } else if (seller.manualSetId) {
      const manualIdx = lotterySets.findIndex(s => s.id === seller.manualSetId);
      if (manualIdx !== -1) startSetIndex = manualIdx;
    } else {
      const secondaryEntropy = seller.id.split('').reduce((a,b) => a + b.charCodeAt(0), 0) % 10;
      startSetIndex = (baseSetIndex + stableIdx + secondaryEntropy) % 10;
    }

    const startSetId = lotterySets[startSetIndex]?.id || '00';
    let sheetsPerNumber = 16;
    if (seller.sheetsOption === '32') sheetsPerNumber = 32;
    else if (seller.sheetsOption === 'custom') sheetsPerNumber = seller.customSheets || 16;

    let mainNumbers: string[] = [];
    let mainStationQuantities: Record<string, number> = {};
    let subResults: { id: string, name: string, numbers: string[], quantities: Record<string, number> }[] = subStations.map(s => ({ id: s.id, name: s.name, numbers: [], quantities: {} }));
    
    let currentTargetTotal = seller.targetTotalTickets;

    // Special Rules for Sets
    const specialNumbersForSet: string[] = [];
    if (['00', '04', '05'].includes(startSetId)) {
      // Logic handled in isForbidden
    } else if (['02', '03'].includes(startSetId)) {
      specialNumbersForSet.push(Math.random() > 0.5 ? '45' : '85');
    } else if (['06', '07', '08', '09'].includes(startSetId)) {
      const choices = ['00', '04', '05'];
      specialNumbersForSet.push(choices[Math.floor(Math.random() * choices.length)]);
    }

    // Special Numbers Limit (00, 04, 05, 45, 85): Max 2/week
    const extremelyUglyHistory = sellerHistory.filter(n => EXTREMELY_UGLY_NUMBERS.includes(n)).length;
    const canAcceptExtremelyUgly = extremelyUglyHistory < 2;

    // 1. Initial Set Selection
    const rawSetNumbers: string[] = [];
    const setIdsToTake = [startSetId];
    if (seller.setType === 'double') {
      const pairId = getPairIdLocal(startSetId);
      if (pairId) setIdsToTake.push(pairId);
    }

    setIdsToTake.forEach(sid => {
      const s = lotterySets.find(ls => ls.id === sid);
      if (s) {
        s.numbers.forEach(num => {
          if (!rawSetNumbers.includes(num)) {
            const isSpec = EXTREMELY_UGLY_NUMBERS.includes(num);
            if ((!isSpec || canAcceptExtremelyUgly) && !isForbidden([...rawSetNumbers, num], startSetId)) {
              rawSetNumbers.push(num);
            }
          }
        });
      }
    });

    // Add Special Numbers
    specialNumbersForSet.forEach(num => {
      if (!rawSetNumbers.includes(num)) {
        const isSpec = EXTREMELY_UGLY_NUMBERS.includes(num);
        if ((!isSpec || canAcceptExtremelyUgly) && !isForbidden([...rawSetNumbers, num], startSetId)) {
          rawSetNumbers.push(num);
        }
      }
    });

    // Calculate Target Count
    let sheetsPerNumberToUse = sheetsPerNumber;
    let numbersToTakeCount = Math.ceil(seller.targetTotalTickets / sheetsPerNumberToUse);
    
    if (seller.setType === 'double' && rawSetNumbers.length > numbersToTakeCount) {
      numbersToTakeCount = rawSetNumbers.length;
      sheetsPerNumberToUse = Math.floor(seller.targetTotalTickets / numbersToTakeCount);
    }

    // 2. Select / Fill to reach numbersToTakeCount with balanced categories using Hare-Niemeyer
    const finalSelection: string[] = [];
    const getCat = (n: string) => BEAUTIFUL_NUMBERS.includes(n) ? 'B' : (UGLY_NUMBERS.includes(n) ? 'U' : 'N');
    
    const catRatios = { 'N': 0.5, 'B': 0.3, 'U': 0.2 };
    const catAllocations = (['N', 'B', 'U'] as const).map(cat => ({
      id: cat,
      ideal: numbersToTakeCount * catRatios[cat],
      base: Math.floor(numbersToTakeCount * catRatios[cat]),
      remainder: (numbersToTakeCount * catRatios[cat]) - Math.floor(numbersToTakeCount * catRatios[cat]),
      final: Math.floor(numbersToTakeCount * catRatios[cat])
    }));

    let catTotal = catAllocations.reduce((a, b) => a + b.final, 0);
    while (catTotal < numbersToTakeCount) {
      const top = [...catAllocations].sort((a, b) => b.remainder - a.remainder);
      for (const t of top) {
        const orig = catAllocations.find(a => a.id === t.id)!;
        orig.final++;
        catTotal++;
        if (catTotal === numbersToTakeCount) break;
      }
    }

    const targetCats: Record<string, number> = {};
    catAllocations.forEach(a => targetCats[a.id] = a.final);

    // Shuffle the set and pools for diversity
    const sellerSeed = `${date}-${seller.id}`;
    const shuffledSet = shuffle(rawSetNumbers, sellerSeed);
    
    // Distribute set numbers into categories
    const setByCat: Record<string, string[]> = { 'N': [], 'B': [], 'U': [] };
    shuffledSet.forEach(n => setByCat[getCat(n)].push(n));

    // First take from shuffled set
    (['N', 'B', 'U'] as const).forEach(cat => {
      const takeCount = Math.min(targetCats[cat], setByCat[cat].length);
      for (let i = 0; i < takeCount; i++) {
        finalSelection.push(setByCat[cat][i]);
      }
    });

    // Replenishment pools
    const remainingSet = shuffledSet.filter(n => !finalSelection.includes(n));
    const warehousePool = shuffle([...getNeutralNumbers(), ...BEAUTIFUL_NUMBERS, ...UGLY_NUMBERS], sellerSeed + "-wh");

    const fillFromPool = (pool: string[]) => {
      let tempPool = [...pool];
      while (finalSelection.length < numbersToTakeCount && tempPool.length > 0) {
        let bestNum: string | null = null;
        // Prioritize satisfying category ratios
        for (const cat of (['N', 'B', 'U'] as const)) {
          const currentCount = finalSelection.filter(n => getCat(n) === cat).length;
          if (currentCount < targetCats[cat]) {
            const found = tempPool.find(n => getCat(n) === cat && !sellerHistory.includes(n) && !isForbidden([...finalSelection, n], startSetId));
            if (found) {
              bestNum = found;
              break;
            }
          }
        }
        // Fallback: any valid number
        if (!bestNum) {
          bestNum = tempPool.find(n => !sellerHistory.includes(n) && !isForbidden([...finalSelection, n], startSetId)) || null;
        }

        if (bestNum) {
          finalSelection.push(bestNum);
          tempPool = tempPool.filter(n => n !== bestNum);
        } else {
          break; // Exhausted even with fallback
        }
      }
    };

    fillFromPool(remainingSet);
    if (finalSelection.length < numbersToTakeCount) {
      fillFromPool(warehousePool.filter(n => !finalSelection.includes(n)));
    }

    const finalSheetsPerNumber = sheetsPerNumberToUse;

    // Classification and Extraction
    const canExtract = (num: string) => {
      if (EXTREMELY_BEAUTIFUL_NUMBERS.includes(num)) return false;
      if (EXTREMELY_UGLY_NUMBERS.includes(num)) return false; // Rule says only extract neutral
      if (BEAUTIFUL_NUMBERS.includes(num)) return true; // Can extract standard beautiful if needed
      if (UGLY_NUMBERS.includes(num)) return false; // Avoid extracting ugly (keep them)
      const decade = getDecade(num);
      if (decade === 0 || decade === 9) return false;
      return true; // Neutral is best to extract
    };

    // Phase 3: Split into Main and specific Sub stations based on exact Ratios
    const mainRatio = (seller.customRatio !== undefined ? seller.customRatio : (globalMainRatio * 100)) / 100;
    const subStationIds = subStations.map(s => s.id);
    const subRatioTotal = subStationIds.reduce((acc, sid) => acc + (seller.subStationRatios[sid] || 0), 0);
    
    const totalNumbersCount = finalSelection.length;
    
    // Step 1: Calculate global targets using Highest Remainder Method (Hare-Niemeyer)
    interface AllocationTarget {
      id: string; // 'main' or subStationId
      ratio: number;
      ideal: number;
      base: number;
      remainder: number;
      final: number;
    }

    const allocations: AllocationTarget[] = [];

    // Main station
    const mainIdeal = totalNumbersCount * mainRatio;
    allocations.push({
      id: 'main',
      ratio: mainRatio,
      ideal: mainIdeal,
      base: Math.floor(mainIdeal),
      remainder: mainIdeal - Math.floor(mainIdeal),
      final: Math.floor(mainIdeal)
    });

    // Sub stations
    const remainingRatioForSubs = 1 - mainRatio;
    subStationIds.forEach(sid => {
      const subRatioWeight = subRatioTotal > 0 ? (seller.subStationRatios[sid] || 0) : (1 / subStationIds.length);
      const normalizedSubRatio = subRatioTotal > 0 ? (subRatioWeight / subRatioTotal) * remainingRatioForSubs : (remainingRatioForSubs / subStationIds.length);
      
      const ideal = totalNumbersCount * normalizedSubRatio;
      allocations.push({
        id: sid,
        ratio: normalizedSubRatio,
        ideal: ideal,
        base: Math.floor(ideal),
        remainder: ideal - Math.floor(ideal),
        final: Math.floor(ideal)
      });
    });

    // Distribute remainder numbers to highest fractional parts
    let totalAllocated = allocations.reduce((acc, a) => acc + a.final, 0);
    while (totalAllocated < totalNumbersCount) {
      const sortedByRemainder = [...allocations].sort((a, b) => b.remainder - a.remainder);
      for (const target of sortedByRemainder) {
        const original = allocations.find(a => a.id === target.id)!;
        original.final += 1;
        totalAllocated += 1;
        if (totalAllocated === totalNumbersCount) break;
      }
    }

    const targetMainCount = allocations.find(a => a.id === 'main')?.final || 0;
    const targetSubCounts: Record<string, number> = {};
    subStationIds.forEach(sid => {
      targetSubCounts[sid] = allocations.find(a => a.id === sid)?.final || 0;
    });

    let poolForBuckets = [...finalSelection];
    const nonExtractableForMain = poolForBuckets.filter(n => !canExtract(n));
    
    let mainNumbersToAssign: string[] = [];
    let subNumbersToAssign: Record<string, string[]> = {};
    subStationIds.forEach(sid => subNumbersToAssign[sid] = []);

    // Fill Main bucket with priority to non-extractable (Neutrals/Ugly in the middle)
    while (mainNumbersToAssign.length < targetMainCount && nonExtractableForMain.length > 0) {
      const num = nonExtractableForMain.shift()!;
      mainNumbersToAssign.push(num);
      poolForBuckets = poolForBuckets.filter(n => n !== num);
    }
    while (mainNumbersToAssign.length < targetMainCount && poolForBuckets.length > 0) {
      const num = poolForBuckets.shift()!;
      mainNumbersToAssign.push(num);
    }
    
    // Fill Sub buckets
    subStationIds.forEach(sid => {
      const target = targetSubCounts[sid] || 0;
      while (subNumbersToAssign[sid].length < target && poolForBuckets.length > 0) {
        const num = poolForBuckets.shift()!;
        subNumbersToAssign[sid].push(num);
      }
    });

    // Phase 4: Assign Main Numbers
    mainNumbersToAssign.forEach(num => {
      if (currentMainPool[num] >= finalSheetsPerNumber && !violatesDistributionRules(num, mainNumbers, seller.targetTotalTickets)) {
        mainNumbers.push(num);
        mainStationQuantities[num] = finalSheetsPerNumber;
        currentMainPool[num] -= finalSheetsPerNumber;
        currentTargetTotal -= finalSheetsPerNumber;
      } else {
        // Find replacement in warehouse (same category)
        const pool = Object.keys(currentMainPool).filter(n => currentMainPool[n] >= finalSheetsPerNumber);
        const rep = findReplacementStandard(num, pool, [...mainNumbers, ...sellerHistory], sellerHistory, seller.targetTotalTickets, startSetId);
        if (rep) {
          mainNumbers.push(rep);
          mainStationQuantities[rep] = finalSheetsPerNumber;
          currentMainPool[rep] -= finalSheetsPerNumber;
          currentTargetTotal -= finalSheetsPerNumber;
        }
      }
    });

    // Phase 5: Assign Sub Numbers to their specific stations
    subStationIds.forEach(sid => {
      const res = subResults.find(r => r.id === sid);
      if (!res) return;

      subNumbersToAssign[sid].forEach(targetNum => {
        const currentAssigned = [...mainNumbers, ...subResults.flatMap(r => r.numbers)];
        // Try to find same number first in its assigned sub station
        if (currentSubPools[sid] && currentSubPools[sid][targetNum] >= finalSheetsPerNumber && !violatesDistributionRules(targetNum, currentAssigned, seller.targetTotalTickets)) {
          res.numbers.push(targetNum);
          res.quantities[targetNum] = finalSheetsPerNumber;
          currentSubPools[sid][targetNum] -= finalSheetsPerNumber;
          currentTargetTotal -= finalSheetsPerNumber;
        } else {
          // Find replacement in THIS specific sub station
          const pool = Object.keys(currentSubPools[sid]).filter(n => currentSubPools[sid][n] >= finalSheetsPerNumber);
          const rep = findReplacementStandard(targetNum, pool, [...currentAssigned, ...sellerHistory], sellerHistory, seller.targetTotalTickets, startSetId);
          if (rep) {
            res.numbers.push(rep);
            res.quantities[rep] = finalSheetsPerNumber;
            currentSubPools[sid][rep] -= finalSheetsPerNumber;
            currentTargetTotal -= finalSheetsPerNumber;
          }
        }
      });
    });

    // Final Balance Check: 5-3-2 (roughly)
    // This is hard to enforce strictly but we prioritize keeping beautiful/ugly to avoid losing them.

    results.push({
      date, sellerId: seller.id, sellerName: seller.name, setNames: [startSetId],
      mainStationNumbers: [...mainNumbers].sort((a, b) => parseInt(a) - parseInt(b)),
      mainStationQuantities,
      subStationResults: subResults,
      totalSheets: seller.targetTotalTickets - currentTargetTotal
    });
  });

  return { results, shortages, updatedMainPool: currentMainPool, updatedSubPools: currentSubPools };
}

function findReplacementStandard(
  targetNum: string, 
  pool: string[], 
  current: string[], 
  history: string[],
  targetTotal: number,
  setId?: string
): string | null {
  const targetDecade = getDecade(targetNum);
  const targetEnding = targetNum.slice(-1);
  const targetCat = BEAUTIFUL_NUMBERS.includes(targetNum) ? 'B' : (UGLY_NUMBERS.includes(targetNum) ? 'U' : 'N');
  
  const getCat = (n: string) => BEAUTIFUL_NUMBERS.includes(n) ? 'B' : (UGLY_NUMBERS.includes(n) ? 'U' : 'N');
  
  const exclude = [...current, ...history];
  const sellerSeedForRep = current.join(',') + history.slice(0, 5).join(','); // Deterministic but diverse seed
  const safePool = shuffle(pool.filter(n => !exclude.includes(n) && !isForbidden([...current, n], setId)), sellerSeedForRep);
  
  if (safePool.length === 0) return null;

  // Priority 1: Same category + Same decade + unique ending
  const sameCatDecade = safePool.filter(n => getCat(n) === targetCat && getDecade(n) === targetDecade && !violatesDistributionRules(n, current, targetTotal));
  if (sameCatDecade.length > 0) {
    const targetVal = parseInt(targetNum);
    return sameCatDecade.sort((a,b) => Math.abs(parseInt(a) - targetVal) - Math.abs(parseInt(b) - targetVal))[0];
  }

  // Priority 2: Same category + unique ending
  const sameCat = safePool.filter(n => getCat(n) === targetCat && !violatesDistributionRules(n, current, targetTotal));
  if (sameCat.length > 0) return sameCat[0];

  // Priority 3: Same decade, unique ending
  const sameDecade = safePool.filter(n => getDecade(n) === targetDecade && !violatesDistributionRules(n, current, targetTotal));
  if (sameDecade.length > 0) return sameDecade[0];

  // Priority 4: Same ending, different decade
  const sameEnding = safePool.filter(n => n.slice(-1) === targetEnding && !violatesDistributionRules(n, current, targetTotal));
  if (sameEnding.length > 0) return sameEnding[0];

  // Priority 5: Any safe number
  const anySafe = safePool.filter(n => !violatesDistributionRules(n, current, targetTotal));
  if (anySafe.length > 0) return anySafe[0];

  return safePool[0];
}
