import { LotterySet } from './types';

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
