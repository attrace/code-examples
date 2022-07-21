import Big, { BigSource } from 'big.js';

import { APR } from 'types';

export function bigIntToNumber(
  bigInt: BigSource,
  units = 18,
  precision = 4,
): number {
  return +Big(bigInt).div(Big(10).pow(units)).toFixed(precision);
}

export function calcApr(
  farmTokenSize: number,
  lastConfirmedReward: number,
): APR {
  if (farmTokenSize === 0) {
    return '∞';
  }

  let apr: string | number =
    ((lastConfirmedReward * 365) / (farmTokenSize * 2)) * 100;
  if (apr < 1) {
    if (apr === 0) {
      return '-';
    }
    apr = apr.toFixed(2);
  } else {
    apr = Math.round(apr);
  }

  if (Number.isNaN(apr)) {
    return '-';
  }

  return `${apr}%`;
}
