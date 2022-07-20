import { ChainId } from 'types';
import { OracleChainId } from 'config';

import { IDiscovery, TNodeUrl } from './index';

export const resolveReferralFarmsV1Addr = (
  discovery: IDiscovery,
  supportedChainId: ChainId,
) =>
  discovery?.farmOracles?.referralFarmsV1.find(
    (e) => e.chainId === supportedChainId,
  )?.address || '';

export const getOracleUrl = (
  discovery: IDiscovery,
  oracleChainId: keyof typeof OracleChainId,
): TNodeUrl => {
  return (
    discovery.farmOracles.oracles.find(
      (e) => e.chainId === Number(oracleChainId),
    )?.url || ''
  );
};
