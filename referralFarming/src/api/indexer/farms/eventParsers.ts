import { Interface } from '@ethersproject/abi';

import { IEventLog } from 'types';

import { parseEvents } from '../parseEvents';
import { IFarmExistEventRes } from './types';

export function parseFarmExistsEvents(
  unparsed: IEventLog[],
  iface: Interface,
): IFarmExistEventRes {
  const parsed = parseEvents(unparsed, iface);

  const farmsMap = new Map();
  parsed.forEach((e: any) => {
    const { farmHash, referredTokenDefn, rewardTokenDefn, sponsor } = e.args;

    farmsMap.set(farmHash, {
      referredTokenDefn,
      rewardTokenDefn,
      sponsor,
    });
  });

  return farmsMap;
}
