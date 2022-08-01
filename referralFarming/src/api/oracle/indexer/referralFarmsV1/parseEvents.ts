import { orderBy } from 'lodash';
import { Interface } from '@ethersproject/abi';

import { IEventLog, IEventParsed } from 'types';

import { IFarmExistEventRes } from './types';

/**
 * parses blockchain logs to get only required data
 * @param items blochain logs array
 * @param iface abi interface
 */
export function parseEvents(
  items: IEventLog[],
  iface: Interface,
): IEventParsed[] {
  const itemsSorted = orderBy(
    items,
    ['chainId', 'blockNumber', 'logIndex'],
    ['asc', 'asc', 'asc'],
  );
  return itemsSorted.map((row) => {
    return {
      ...iface.parseLog({
        data: row.data,
        topics: JSON.parse(row.topics),
      }),
      blockNumber: row.blockNumber,
    };
  });
}

/**
 * parses blockchain logs to get only required data
 * @param unparsed blochain logs array
 * @param iface abi interface
 */
export function parseFarmExistsEvents(
  unparsed: IEventLog[],
  iface: Interface,
): IFarmExistEventRes {
  const parsed = parseEvents(unparsed, iface);

  return parsed.map((e: IEventParsed) => {
    const { farmHash, referredTokenDefn, rewardTokenDefn, sponsor } = e.args;

    return {
      farmHash,
      referredTokenDefn,
      rewardTokenDefn,
      sponsor,
      blockNumber: e.blockNumber,
    };
  });
}
