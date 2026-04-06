import { LotterySet } from './types';

export const LOTTERY_SETS: LotterySet[] = [
  { id: '00', numbers: ['00', '12', '24', '36', '48', '51', '63', '75', '87', '99'] },
  { id: '01', numbers: ['01', '13', '25', '37', '49', '52', '64', '76', '88', '90'] },
  { id: '02', numbers: ['02', '14', '26', '38', '40', '53', '65', '77', '89', '91'] },
  { id: '03', numbers: ['03', '15', '27', '39', '41', '54', '66', '78', '80', '92'] },
  { id: '04', numbers: ['04', '16', '28', '30', '42', '55', '67', '79', '81', '93'] },
  { id: '05', numbers: ['05', '17', '29', '31', '43', '56', '68', '70', '82', '94'] },
  { id: '06', numbers: ['06', '18', '20', '32', '44', '57', '69', '71', '83', '95'] },
  { id: '07', numbers: ['07', '19', '21', '33', '45', '58', '60', '72', '84', '96'] },
  { id: '08', numbers: ['08', '10', '22', '34', '46', '59', '61', '73', '85', '97'] },
  { id: '09', numbers: ['09', '11', '23', '35', '47', '50', '62', '74', '86', '98'] },
];

export const DOUBLE_SETS: Record<string, string> = {
  '00': '06',
  '01': '07',
  '02': '09',
  '03': '05',
  '04': '08',
};

export const UGLY_NUMBERS = ['00', '04', '05', '20', '40', '45', '50', '60', '80', '85', '90'];
export const EXTREMELY_UGLY_NUMBERS = ['00', '04', '05', '85', '45'];

export const BEAUTIFUL_NUMBERS = [
  '07', '09', '11', '19', '28', '29',
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
  '47', '49',
  '51', '52', '59',
  '68', '69',
  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
  '87', '89', '91'
];
export const EXTREMELY_BEAUTIFUL_NUMBERS = ['39', '79', '38', '78', '51', '52', '32', '72'];

export const FORBIDDEN_GROUPS = [
  ['00', '45', '85', '05', '04'],
  ['32', '72', '38', '78', '39', '79', '51', '52']
];

export const getPairId = (id: string): string | undefined => {
  if (DOUBLE_SETS[id]) return DOUBLE_SETS[id];
  return Object.keys(DOUBLE_SETS).find(key => DOUBLE_SETS[key] === id);
};

export const INITIAL_SELLERS: any[] = [
  { id: '1', name: 'Người A', setType: 'single', sheetsOption: '16', targetTotalTickets: 160, allocationMode: 'auto', currentSetIndex: 0, isAutoMode: true, isEnabled: true, mainEnabled: true, subStationRatios: { 'sub1': 20, 'sub2': 10 }, customPreferences: [], fixedSetId: undefined },
  { id: '2', name: 'Người B', setType: 'double', sheetsOption: '32', targetTotalTickets: 320, allocationMode: 'auto', currentSetIndex: 0, isAutoMode: true, isEnabled: true, mainEnabled: true, subStationRatios: { 'sub1': 20, 'sub2': 10 }, customPreferences: [], fixedSetId: undefined },
  { id: '3', name: 'Người C', setType: 'single', sheetsOption: 'custom', customSheets: 10, targetTotalTickets: 200, allocationMode: 'auto', currentSetIndex: 0, isAutoMode: true, isEnabled: true, mainEnabled: true, subStationRatios: { 'sub1': 20, 'sub2': 10 }, customPreferences: [], fixedSetId: undefined },
];
