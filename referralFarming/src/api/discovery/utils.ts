import { EChainId, EOracleChainId } from 'config';

import { IDiscovery, TNodeUrl } from './index';

export const resolveReferralFarmsV1Addr = (
  discovery: IDiscovery,
  chainId: EChainId,
) =>
  discovery?.farmOracles?.referralFarmsV1.find((e) => e.chainId === chainId)
    ?.address || '';

export const getOracleUrl = (
  discovery: IDiscovery,
  oracleChainId: EOracleChainId,
): TNodeUrl => {
  return (
    discovery.farmOracles.oracles.find(
      (e) => e.chainId === Number(oracleChainId),
    )?.url || ''
  );
};
