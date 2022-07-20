import Big, { BigSource } from 'big.js';

export function bigIntToNumber(
  bigInt: BigSource,
  units = 18,
  precision = 4,
): number {
  return +Big(bigInt).div(Big(10).pow(units)).toFixed(precision);
}
