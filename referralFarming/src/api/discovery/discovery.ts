import { IDiscoveryRes } from './types';

const discoveryUrl = 'https://discovery.attrace.com';

// TODO: add https://github.com/attrace/discovery/tree/feature/chains-discovery/build/chains

export async function getDiscovery<T>(
  fileName: 'tokenLists.json' | 'mainnet/full.json',
): Promise<IDiscoveryRes<T>> {
  try {
    const response = await fetch(`${discoveryUrl}/${fileName}`);

    const discovery = await response.json();
    const pop = response.headers.get('x-amz-cf-pop') || '';

    return {
      data: discovery,
      pop,
    };
  } catch (e) {
    return Promise.reject(e);
  }
}
