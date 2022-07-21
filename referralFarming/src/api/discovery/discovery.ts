import { EChainId, resolveOracleChainIdByNetwork } from 'config';
import { IDiscoveryRes, IDiscoveryChainInfo } from './types';

const discoveryUrl = 'https://discovery.attrace.com';

type TDiscoveryFile =
  | 'tokenLists.json'
  | 'chains.json'
  | 'chains/4470.json'
  | 'chains/147.json';

/**
 * @returns JSON contains tokenLists API urls, chains data.
 */
export async function fetchDiscovery<T>(
  fileName: TDiscoveryFile,
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

/**
 *
 * @param chainId 1 for Mainnet, 4 for Rinkeby
 * @returns JSON contains oracleChainId, pacemaker chainId, authority, referralFarmsV1, confirmationsV1 addresses and oracle nodes.
 */
export async function fetchDiscoveryChain(
  chainId: EChainId,
): Promise<IDiscoveryRes<IDiscoveryChainInfo>> {
  try {
    const oracleChainId = resolveOracleChainIdByNetwork(chainId);
    const { data, pop } = await fetchDiscovery<IDiscoveryChainInfo>(
      `chains/${oracleChainId}.json`,
    );

    return {
      data,
      pop,
    };
  } catch (e) {
    return Promise.reject(e);
  }
}
