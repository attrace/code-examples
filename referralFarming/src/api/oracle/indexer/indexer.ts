import { IEventLog } from 'types';

import { Bytes32, EvmAddress } from 'types';

interface ILogParams {
  // Logs from these addresses only
  addresses?: EvmAddress[];
  // Search across all topics
  topics?: Bytes32[];
  // Topic1 is commonly the event id
  topic1?: Bytes32[];
  // Topics 2-4 are the 1-3 indexed event params
  topic2?: Bytes32[];
  topic3?: Bytes32[];
  topic4?: Bytes32[];
  // Logs from these chains only
  chainId?: number[];
  // Logs from these transactions only
  transactionHash?: Bytes32[];
  // Default AND search is done by the indexers
  strategy?: 'AND' | 'OR';
}

function makeUrlPath(params: ILogParams): string {
  const parts = [];
  if (params.addresses)
    params.addresses.forEach((d) => parts.push(`address=${d}`));
  if (params.topics) params.topics.forEach((d) => parts.push(`topic=${d}`));
  if (params.topic1) params.topic1.forEach((d) => parts.push(`topic1=${d}`));
  if (params.topic2) params.topic2.forEach((d) => parts.push(`topic2=${d}`));
  if (params.topic3) params.topic3.forEach((d) => parts.push(`topic3=${d}`));
  if (params.topic4) params.topic4.forEach((d) => parts.push(`topic4=${d}`));
  if (params.chainId) params.chainId.forEach((d) => parts.push(`chainId=${d}`));
  if (params.transactionHash)
    params.transactionHash.forEach((d) => parts.push(`transactionHash=${d}`));
  if (params.strategy) parts.push(`strategy=${params.strategy}`);

  return `/v1/logsearch?${parts.join('&')}`;
}

async function queryIndexer(
  oracleUrl: string,
  searchParams: ILogParams,
): Promise<{ items: IEventLog[] } | undefined> {
  try {
    const urlPath = makeUrlPath(searchParams);

    const response = await (await fetch(oracleUrl + urlPath)).json();

    return response;
  } catch (e) {
    console.log('queryIndexer error', e);
  }
}

export const indexer = {
  queryIndexer,
};
