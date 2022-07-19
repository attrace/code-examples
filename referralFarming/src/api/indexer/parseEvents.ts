import { orderBy } from 'lodash';
import { Interface, LogDescription } from '@ethersproject/abi';

import { IEventLog } from 'types';

export function parseEvents(
  items: IEventLog[],
  iface: Interface,
): LogDescription[] {
  const itemsSorted = orderBy(
    items,
    ['chainId', 'blockNumber', 'logIndex'],
    ['asc', 'asc', 'asc'],
  );
  const parsed = itemsSorted.map((row) =>
    iface.parseLog({
      data: row.data,
      topics: JSON.parse(row.topics),
    }),
  );
  return parsed;
}
