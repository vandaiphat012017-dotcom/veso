import { DOUBLE_SETS, UGLY_NUMBERS, BEAUTIFUL_NUMBERS, FORBIDDEN_GROUPS, EXTREMELY_UGLY_NUMBERS, EXTREMELY_BEAUTIFUL_NUMBERS, getPairId } from '../constants';
import { Seller, DistributionResult, LotterySet, DistributionReport, Shortage } from '../types';

export function getNeutralNumbers(): string[] {
  const allNumbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
  return allNumbers.filter(n => !UGLY_NUMBERS.includes(n) && !BEAUTIFUL_NUMBERS.includes(n));
}

export function isForbidden(numbers: string[], setId?: string): boolean {
  // Rule: Forbidden Groups
  for (const group of FORBIDDEN_GROUPS) {
    const intersection = group.filter(n => numbers.includes(n));
    if (intersection.length > 1) return true;
  }

  // Rule: Special Sets (00, 04, 05 cannot have 45, 85)
  if (setId && ['00', '04', '05'].includes(setId)) {
    if (numbers.includes('45') || numbers.includes('85')) return true;
  }

  return false;
}

export function hasDuplicateEnding(numbers: string[], newNumber: string): boolean {
  const ending = newNumber.slice(-1);
  return numbers.some(n => n.slice(-1) === ending);
}

export function distributeTickets(
  date: string,
  sellers: Seller[],
  mainStationPool: Record<string, number>,
  subStationPools: Record<string, Record<string, number>>, // sub-station ID -> Pool
  lotterySets: LotterySet[],
  history: DistributionResult[][] = []
): DistributionReport {
  const results: DistributionResult[] = [];
  const shortages: Shortage[] = [];
  const neutralNumbers = getNeutralNumbers();
  
  // Clone pools to manage inventory
  const currentMainPool = { ...mainStationPool };
  const currentSubPools: Record<string, Record<string, number>> = {};
  Object.keys(subStationPools).forEach(id => {
    currentSubPools[id] = { ...subStationPools[id] };
  });

  // 1. Determine Base Set Index from Date
  const day = new Date(date).getDate();
  const baseSetIndex = (day - 1) % lotterySets.length;

  sellers.filter(s => s.isEnabled).forEach((seller, sIdx) => {
    // Get seller history for "not in last 2 days" rule
    const sellerHistory = history
      .slice(0, 2)
      .flatMap(dayResults => dayResults.filter(r => r.sellerId === seller.id))
      .flatMap(r => [
        ...r.mainStationNumbers, 
        ...r.subStationResults.flatMap(sr => sr.numbers)
      ]);

    // Determine starting set
    let startSetIndex = baseSetIndex;
    if (seller.fixedSetId) {
      const fixedIdx = lotterySets.findIndex(s => s.id === seller.fixedSetId);
      if (fixedIdx !== -1) startSetIndex = fixedIdx;
    } else if (seller.isAutoMode) {
      startSetIndex = (baseSetIndex + sIdx) % lotterySets.length;
    } else if (seller.manualSetId) {
      const manualIdx = lotterySets.findIndex(s => s.id === seller.manualSetId);
      if (manualIdx !== -1) startSetIndex = manualIdx;
    }

    // Calculate sheets per number
    let sheetsPerNumber = 16;
    if (seller.sheetsOption === '32') sheetsPerNumber = 32;
    else if (seller.sheetsOption === 'custom') sheetsPerNumber = seller.customSheets || 16;

    // 1. Process Custom Preferences First
    let mainNumbers: string[] = [];
    let mainStationQuantities: Record<string, number> = {};
    let subStationResults: { id: string, name: string, numbers: string[], quantities: Record<string, number> }[] = [];
    
    // Initialize subStationResults
    Object.keys(subStationPools).forEach(id => {
      subStationResults.push({ id, name: id, numbers: [], quantities: {} });
    });

    let currentTargetTotal = seller.targetTotalTickets;

    if (seller.customPreferences && seller.customPreferences.length > 0) {
      seller.customPreferences.forEach(pref => {
        const num = pref.number;
        const qty = pref.quantity;
        const stationId = pref.stationId;
        
        if (stationId === 'main') {
          if (currentMainPool[num] >= qty) {
            mainNumbers.push(num);
            mainStationQuantities[num] = qty;
            currentMainPool[num] -= qty;
            currentTargetTotal -= qty;
          } else {
            shortages.push({ sellerId: seller.id, sellerName: seller.name, station: 'main', needed: qty, available: currentMainPool[num] || 0 });
          }
        } else if (stationId && currentSubPools[stationId]) {
          if (currentSubPools[stationId][num] >= qty) {
            const subRes = subStationResults.find(r => r.id === stationId);
            if (subRes) {
              subRes.numbers.push(num);
              subRes.quantities[num] = qty;
              currentSubPools[stationId][num] -= qty;
              currentTargetTotal -= qty;
            }
          } else {
            shortages.push({ sellerId: seller.id, sellerName: seller.name, station: stationId, needed: qty, available: currentSubPools[stationId][num] || 0 });
          }
        } else {
          // Original logic: Try Main then Sub
          if (currentMainPool[num] >= qty) {
            mainNumbers.push(num);
            mainStationQuantities[num] = qty;
            currentMainPool[num] -= qty;
            currentTargetTotal -= qty;
          } else {
            // Try to take from Sub stations
            let foundInSub = false;
            for (const subId of Object.keys(currentSubPools)) {
              if (currentSubPools[subId][num] >= qty) {
                const subRes = subStationResults.find(r => r.id === subId);
                if (subRes) {
                  subRes.numbers.push(num);
                  subRes.quantities[num] = qty;
                  currentSubPools[subId][num] -= qty;
                  currentTargetTotal -= qty;
                  foundInSub = true;
                  break;
                }
              }
            }
            if (!foundInSub) {
              shortages.push({ sellerId: seller.id, sellerName: seller.name, station: 'ưu tiên', needed: qty, available: 0 });
            }
          }
        }
      });
    }

    // 2. Calculate remaining numbers needed from sets
    let targetMainCount = 0;
    let targetSubCounts: Record<string, number> = {};

    const remainingNumbersNeeded = Math.max(0, Math.ceil(currentTargetTotal / sheetsPerNumber));
    
    if (seller.allocationMode === 'manual') {
      targetMainCount = Math.ceil((currentTargetTotal || 0) / sheetsPerNumber);
      Object.entries(seller.subStationRatios).forEach(([id, qty]) => {
        targetSubCounts[id] = Math.ceil(qty / sheetsPerNumber);
      });
    } else {
      const mainRatio = seller.customRatio !== undefined ? seller.customRatio / 100 : 0.7;
      targetMainCount = seller.mainEnabled ? Math.round(remainingNumbersNeeded * mainRatio) : 0;
      
      const totalSubNeeded = remainingNumbersNeeded - targetMainCount;
      const subStationIds = Object.keys(seller.subStationRatios);
      const totalSubRatio = Object.values(seller.subStationRatios).reduce((a, b) => a + b, 0);
      
      if (totalSubRatio > 0) {
        let allocatedSub = 0;
        subStationIds.forEach((id, idx) => {
          if (idx === subStationIds.length - 1) {
            targetSubCounts[id] = totalSubNeeded - allocatedSub;
          } else {
            const count = Math.round((seller.subStationRatios[id] / totalSubRatio) * totalSubNeeded);
            targetSubCounts[id] = count;
            allocatedSub += count;
          }
        });
      } else if (totalSubNeeded > 0 && subStationIds.length > 0) {
        const countPerSub = Math.floor(totalSubNeeded / subStationIds.length);
        subStationIds.forEach((id, idx) => {
          targetSubCounts[id] = idx === subStationIds.length - 1 ? totalSubNeeded - (countPerSub * (subStationIds.length - 1)) : countPerSub;
        });
      }
    }

    const totalNeededFromSets = targetMainCount + Object.values(targetSubCounts).reduce((a, b) => a + b, 0);
    let initialNumbersFromSets: string[] = [];
    let currentSetOffset = 0;

    // Collect from sets
    while (initialNumbersFromSets.length < totalNeededFromSets) {
      const setIdx = (startSetIndex + currentSetOffset) % lotterySets.length;
      const set = lotterySets[setIdx];
      const setIdsToTake = [set.id];
      if (seller.setType === 'double') {
        const pairId = getPairId(set.id);
        if (pairId) setIdsToTake.push(pairId);
      }

      setIdsToTake.forEach(id => {
        const s = lotterySets.find(ls => ls.id === id);
        if (s) {
          s.numbers.forEach(num => {
            if (initialNumbersFromSets.length < totalNeededFromSets && !initialNumbersFromSets.includes(num) && !mainNumbers.includes(num) && !subStationResults.some(r => r.numbers.includes(num))) {
              if (sellerHistory.includes(num) || isForbidden([...initialNumbersFromSets, num], lotterySets[startSetIndex].id)) {
                const availableMain = Object.keys(currentMainPool).filter(n => currentMainPool[n] > 0);
                const replacement = findReplacement(num, availableMain, [...initialNumbersFromSets, ...mainNumbers], neutralNumbers, sellerHistory, lotterySets[startSetIndex].id);
                if (replacement) initialNumbersFromSets.push(replacement);
              } else {
                initialNumbersFromSets.push(num);
              }
            }
          });
        }
      });
      currentSetOffset++;
      if (currentSetOffset > lotterySets.length * 2) break;
    }

    // 3. Distribute initialNumbersFromSets to Main and Sub stations
    const isReplaceable = (n: string) => {
      const val = parseInt(n);
      return neutralNumbers.includes(n) && val >= 10 && val < 90;
    };

    const replaceableIndices: number[] = [];
    initialNumbersFromSets.forEach((n, i) => {
      if (isReplaceable(n)) replaceableIndices.push(i);
    });

    let indicesToReplace: Record<number, string> = {};
    const availableToReplace = [...replaceableIndices];
    
    Object.entries(targetSubCounts).forEach(([subId, count]) => {
      let allocated = 0;
      while (allocated < count && availableToReplace.length > 0) {
        const randIdx = Math.floor(Math.random() * availableToReplace.length);
        const index = availableToReplace.splice(randIdx, 1)[0];
        indicesToReplace[index] = subId;
        allocated++;
      }
    });

    initialNumbersFromSets.forEach((num, idx) => {
      const subId = indicesToReplace[idx];
      if (subId) {
        const subPool = currentSubPools[subId] || {};
        const subResult = subStationResults.find(r => r.id === subId)!;
        const availableSub = Object.keys(subPool).filter(n => subPool[n] > 0);
        
        let replacement: string | null = null;
        if (availableSub.includes(num) && !isForbidden([...subResult.numbers, num], lotterySets[startSetIndex].id)) {
          replacement = num;
        } else {
          replacement = findReplacement(num, availableSub, subResult.numbers, neutralNumbers, sellerHistory, lotterySets[startSetIndex].id);
        }

        if (replacement) {
          subResult.numbers.push(replacement);
          subResult.quantities[replacement] = sheetsPerNumber;
          subPool[replacement]--;
        } else {
          // Fallback to Main if Sub is empty
          if (currentMainPool[num] > 0) {
            mainNumbers.push(num);
            mainStationQuantities[num] = sheetsPerNumber;
            currentMainPool[num]--;
          } else {
            shortages.push({ sellerId: seller.id, sellerName: seller.name, station: subId, needed: 1, available: 0 });
          }
        }
      } else {
        // Main Station
        if (currentMainPool[num] > 0) {
          mainNumbers.push(num);
          mainStationQuantities[num] = sheetsPerNumber;
          currentMainPool[num]--;
        } else {
          const availableMain = Object.keys(currentMainPool).filter(n => currentMainPool[n] > 0);
          const replacement = findReplacement(num, availableMain, mainNumbers, neutralNumbers, sellerHistory, lotterySets[startSetIndex].id);
          if (replacement) {
            mainNumbers.push(replacement);
            mainStationQuantities[replacement] = sheetsPerNumber;
            currentMainPool[replacement]--;
          } else {
            shortages.push({ sellerId: seller.id, sellerName: seller.name, station: 'main', needed: 1, available: 0 });
          }
        }
      }
    });

    // Rule: Ugly must have Beautiful
    const allAssigned = [...mainNumbers, ...subStationResults.flatMap(r => r.numbers)];
    const uglyCount = allAssigned.filter(n => UGLY_NUMBERS.includes(n)).length;
    const beautifulCount = allAssigned.filter(n => BEAUTIFUL_NUMBERS.includes(n)).length;
    
    if (uglyCount > 0 && beautifulCount === 0) {
      const replaceableIdx = mainNumbers.findIndex(n => isReplaceable(n));
      if (replaceableIdx !== -1) {
        const availableMain = Object.keys(currentMainPool).filter(n => currentMainPool[n] > 0 && BEAUTIFUL_NUMBERS.includes(n));
        if (availableMain.length > 0) {
          const beauty = availableMain[0];
          const old = mainNumbers[replaceableIdx];
          mainNumbers[replaceableIdx] = beauty;
          mainStationQuantities[beauty] = mainStationQuantities[old];
          delete mainStationQuantities[old];
          currentMainPool[beauty]--;
          currentMainPool[old]++;
        }
      }
    }

    const totalSheets = Object.values(mainStationQuantities).reduce((a, b) => a + b, 0) + 
                       subStationResults.reduce((acc, r) => acc + Object.values(r.quantities).reduce((a, b) => a + b, 0), 0);

    results.push({
      date,
      sellerId: seller.id,
      sellerName: seller.name,
      setName: lotterySets[startSetIndex].id,
      mainStationNumbers: [...mainNumbers].sort((a, b) => parseInt(a) - parseInt(b)),
      mainStationQuantities,
      subStationResults: subStationResults.map(r => ({
        ...r,
        numbers: [...r.numbers].sort((a, b) => parseInt(a) - parseInt(b))
      })),
      totalSheets
    });
  });

  return { results, shortages, updatedMainPool: currentMainPool, updatedSubPools: currentSubPools };
}

// Helper for Rule 5: Replacement
function findReplacement(
  targetNum: string, 
  pool: string[], 
  existing: string[], 
  neutralPool: string[],
  history: string[],
  setId?: string
): string | null {
  const targetEnding = targetNum.slice(-1);
  const targetPrefix = targetNum.slice(0, 1);

  // Filter pool by safety rules
  // We exclude targetNum from existing check for the "same ending" priority
  const otherExisting = existing.filter(n => n !== targetNum);
  
  const safePool = pool.filter(n => 
    !existing.includes(n) && 
    !history.includes(n) &&
    !isForbidden([...otherExisting, n], setId)
  );

  if (safePool.length === 0) return null;

  // Priority 1: Same ending, same prefix
  const p1 = safePool.filter(n => n.slice(-1) === targetEnding && n.startsWith(targetPrefix));
  if (p1.length > 0) return p1[Math.floor(Math.random() * p1.length)];

  // Priority 2: Same ending
  const p2 = safePool.filter(n => n.slice(-1) === targetEnding);
  if (p2.length > 0) return p2[Math.floor(Math.random() * p2.length)];

  // Priority 3: Different ending, but must be unique in the set
  const p3 = safePool.filter(n => !hasDuplicateEnding(otherExisting, n));
  if (p3.length > 0) {
    // Within unique endings, prioritize neutral numbers
    const neutralP3 = p3.filter(n => neutralPool.includes(n));
    return neutralP3.length > 0 
      ? neutralP3[Math.floor(Math.random() * neutralP3.length)]
      : p3[Math.floor(Math.random() * p3.length)];
  }

  return null;
}
