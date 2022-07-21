import { IDiscoveryRes } from './types';

const discoveryUrl = 'https://discovery.attrace.com';

export async function getDiscovery(): Promise<IDiscoveryRes> {
  try {
    const response = await fetch(`${discoveryUrl}/mainnet/full.json`);

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
