import { Interface } from '@ethersproject/abi';
import { keccak256 } from 'web3-utils';

import { address } from 'utils';
import { ChainAddress, EvmAddress } from 'types';
import { EChainId } from 'config';
import { resolveOracleUrl } from 'api';

import { indexer } from '../indexer';
import { IFarmExistEventRes } from './types';
import { parseFarmExistsEvents } from './parseEvents';
import { IDiscoveryChainInfo, resolveReferralFarmsV1Addr } from 'api';

const referralFarmsV1Events = [
  'event FarmDepositDecreaseClaimed(bytes32 indexed farmHash, uint128 delta)',
  'event FarmDepositDecreaseRequested(bytes32 indexed farmHash, uint128 value, uint128 confirmation)',
  'event FarmDepositIncreased(bytes32 indexed farmHash, uint128 delta)',
  'event FarmExists(address indexed sponsor, bytes24 indexed rewardTokenDefn, bytes24 indexed referredTokenDefn, bytes32 farmHash)',
  'event FarmMetastate(bytes32 indexed farmHash, bytes32 indexed key, bytes value)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event RewardsHarvested(address indexed caller, bytes24 indexed rewardTokenDefn, bytes32 indexed farmHash, uint128 value, bytes32 leafHash)',
];

const referralFarmsV1Iface = new Interface(referralFarmsV1Events);

// Index the events name => id
const eventIds: { [eventName: string]: string } = {};
Object.entries(referralFarmsV1Iface.events).forEach(
  ([k, v]) => (eventIds[v.name] = keccak256(k)),
);

interface ITokenFilter {
  rewardTokens?: [ChainAddress];
  referredTokens?: [ChainAddress];
}

/**
 * fetching blockchain logs from indexer
 * @param chainId Network ChainId(Goerli, Ethereum mainnet etc.)
 * @param discoveryData data from discovery service
 * @param filter reward/referred token arrays
 * @param creator creator address
 * @return parsed farmExistEvents
 */
async function fetchFarmExistsEvents(
  chainId: EChainId,
  discoveryChainData: IDiscoveryChainInfo,
  filter?: ITokenFilter,
  creator?: EvmAddress,
): Promise<IFarmExistEventRes | undefined> {
  const referralFarmsV1Addr = resolveReferralFarmsV1Addr(
    discoveryChainData,
    chainId,
  );
  const oracleUrl = resolveOracleUrl(discoveryChainData);

  // Allow filtering by creator
  let topic2;
  if (creator) {
    topic2 = [address.expandEvmAddressToBytes32(creator)];
  }

  // Allow filtering your own tokens
  let topic3, topic4;
  if (filter?.rewardTokens) {
    topic3 = filter.rewardTokens.map((t) => address.expandBytes24ToBytes32(t));
  }
  if (filter?.referredTokens) {
    topic4 = filter.referredTokens.map((t) =>
      address.expandBytes24ToBytes32(t),
    );
  }
  const farmExistsEvents = await indexer.queryIndexer(oracleUrl, {
    addresses: [referralFarmsV1Addr],
    topic1: [eventIds.FarmExists],
    topic2,
    topic3,
    topic4,
    chainId: [chainId],
  });

  if (farmExistsEvents?.items) {
    return parseFarmExistsEvents(farmExistsEvents.items, referralFarmsV1Iface);
  }
}

export const referralFarmsV1 = {
  fetchFarmExistsEvents,
};
