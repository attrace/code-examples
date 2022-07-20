import { Interface } from '@ethersproject/abi';
import { keccak256 } from 'web3-utils';

import { address } from 'utils';
import { ChainAddress, ChainId, EvmAddress } from 'types';

import { indexer } from '../indexer';
import { IFarmExistEventRes } from './types';
import { parseFarmExistsEvents } from './parseEvents';
import { IDiscoveryRes, resolveReferralFarmsV1Addr } from '../../discovery';

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

async function getFarmExistsEvents(
  chainId: ChainId,
  discoveryData: IDiscoveryRes,
  filter?: ITokenFilter,
  creator?: EvmAddress,
): Promise<IFarmExistEventRes | undefined> {
  const { data, pop } = discoveryData;
  const referralFarmsV1Addr = resolveReferralFarmsV1Addr(data, chainId);

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

  const farmExistsEvents = await indexer.queryIndexersWithNearestQuorum(
    {
      addresses: [referralFarmsV1Addr],
      topic1: [eventIds.FarmExists],
      topic2,
      topic3,
      topic4,
      chainId: [chainId],
    },
    data.indexers,
    data.airports,
    pop,
  );

  if (farmExistsEvents?.items) {
    return parseFarmExistsEvents(farmExistsEvents.items, referralFarmsV1Iface);
  }
}

export const referralFarmsV1 = {
  getFarmExistsEvents,
};
