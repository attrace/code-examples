import { EChainId } from 'config';

import { IDiscoveryChainInfo, TNodeUrl } from './index';

/**
 *
 * @param discovery Data from discovery service
 * @param chainId Network ChaindId(Goerli, Ethereum mainnet etc.)
 * @return return ReferralFarmsV1 address from discovery
 */
export const resolveReferralFarmsV1Addr = (
  discovery: IDiscoveryChainInfo,
  chainId: EChainId,
) =>
  discovery.chainInfo.referralFarmsV1.find(
    (e) => e.chainId === chainId.toString(),
  )?.address || '';

/**
 *
 * @param discovery Data from discovery service
 * @return return oracle url from discovery
 */
export const resolveOracleUrl = (discovery: IDiscoveryChainInfo): TNodeUrl => {
  const oracleChainId = discovery.chainInfo.chainId;
  return (
    discovery.chainInfo.oracles.find((e) => e.chainId === oracleChainId)?.url ||
    ''
  );
};
