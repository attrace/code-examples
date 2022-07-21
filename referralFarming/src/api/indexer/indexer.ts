import { TAirport, TNode } from 'api/discovery';
import { IEventLog } from 'types';

import { ILogParams } from './types';

function makeIndexerUrlPath(params: ILogParams): string {
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

const indexerUrl = 'https://indexer.attrace.com';

async function queryIndexer(
  searchParams: ILogParams,
  indexers: TNode[],
  airports: TAirport[],
  pop: string,
): Promise<{ items: IEventLog[] } | undefined> {
  try {
    if (!indexers.length || !airports.length || !pop) {
      throw Error('Wrong indexer node search params');
    }

    const urlPath = makeIndexerUrlPath(searchParams);

    const response = await (await fetch(indexerUrl + urlPath)).json();

    if (!response) {
      throw new Error('Indexer response empty');
    }

    return response;
  } catch (e) {
    console.log('queryIndexer error', e);
  }
}

export const indexer = {
  queryIndexer,
};
