import {
  oracle,
  coingecko,
  TNodeUrl,
  IFarmExistEventRes,
  IFarmExistsEvent,
} from 'api';
import { web3 } from 'services';
import { address } from 'utils';

import { ChainAddress, FarmHash, IDataForAPRMap } from '../types';

const { parseChainAddress } = address;

/*
  FarmExistEvents array to Map, deletes duplicates
*/
const farmExistsEventsToMap = (farmExistsEvents: IFarmExistEventRes) => {
  const uniqueFarmExistMap = new Map<FarmHash, IFarmExistsEvent>();
  farmExistsEvents.forEach((farmExists) => {
    uniqueFarmExistMap.set(farmExists.farmHash, farmExists);
  });

  return uniqueFarmExistMap;
};

export const getFarmCreatedTimestamp = async (
  farmExistsEvents: IFarmExistEventRes,
) => {
  const blockNumber = farmExistsEvents[0]?.blockNumber; //[0] - because first farmExists event emits when farm is created and all events sorted in desc order

  return (await web3.provider.eth.getBlock(blockNumber)).timestamp;
};

export async function getDailyRewardsByReferredToken(
  farmExistsEvents: IFarmExistEventRes,
  oracleUrl: TNodeUrl,
): Promise<Map<ChainAddress, bigint>> {
  const rewardsPerRewardTokenMap = new Map<ChainAddress, bigint>();

  const uniqueFarmExistMap = farmExistsEventsToMap(farmExistsEvents);

  return new Promise(async (resolve) => {
    for (const v of uniqueFarmExistMap.values()) {
      const { farmHash, rewardTokenDefn } = v;
      const lastConfirmedReward = await oracle.getLastConfirmationReward(
        farmHash,
        oracleUrl,
      );

      rewardsPerRewardTokenMap.set(
        rewardTokenDefn,
        (rewardsPerRewardTokenMap.get(rewardTokenDefn) || 0n) +
          lastConfirmedReward,
      );
    }

    resolve(rewardsPerRewardTokenMap);
  });
}

export async function getAPRForReferredToken(
  farmExistsEvents: IFarmExistEventRes,
  oracleUrl: TNodeUrl,
): Promise<{ aprData: IDataForAPRMap; farmTokenSize: bigint }> {
  const APRMap: IDataForAPRMap = new Map();

  const uniqueTokenDefns = new Set<string>();

  const uniqueFarmExistMap = farmExistsEventsToMap(farmExistsEvents);

  uniqueFarmExistMap.forEach(({ referredTokenDefn, rewardTokenDefn }) => {
    uniqueTokenDefns.add(parseChainAddress(referredTokenDefn).address);
    uniqueTokenDefns.add(parseChainAddress(rewardTokenDefn).address);
  });

  const arr = Array.from(uniqueTokenDefns);

  const exchangeRates = await coingecko.getConversationRate(arr);

  const { size } = uniqueFarmExistMap;
  let idx = 0;

  let totalFarmTokenSize = 0n;

  return new Promise((resolve) => {
    uniqueFarmExistMap.forEach((farmExistEvent, key) => {
      const { rewardTokenDefn, referredTokenDefn } = farmExistEvent;

      Promise.all([
        oracle.getFarmTokenSize(key, referredTokenDefn, oracleUrl),
        oracle.getLastConfirmationReward(key, oracleUrl),
      ])
        .then(([farmTokenSize, lastConfirmedReward]) => {
          const rewardConversionRate =
            exchangeRates[address.parseChainAddress(rewardTokenDefn).address]
              ?.eth;
          const referredConversionRate =
            exchangeRates[address.parseChainAddress(referredTokenDefn).address]
              ?.eth;

          const conversionRate =
            referredTokenDefn === rewardTokenDefn
              ? 1
              : rewardConversionRate / referredConversionRate;

          const prev = APRMap.get(rewardTokenDefn);

          totalFarmTokenSize += farmTokenSize;

          APRMap.set(rewardTokenDefn, {
            conversionRate: conversionRate || 0,
            lastConfirmedReward:
              lastConfirmedReward + (prev?.lastConfirmedReward || 0n),
          });
          idx += 1;

          if (size === idx) {
            resolve({
              aprData: APRMap,
              farmTokenSize: totalFarmTokenSize,
            });
          }
        })
        .catch((error) => {
          console.log(error);
          resolve({
            aprData: new Map(),
            farmTokenSize: 0n,
          });
        });
    });
  });
}

export async function getRemainingRewardsByReferredToken(
  farmExistsEvents: IFarmExistEventRes,
  oracleUrl: TNodeUrl,
): Promise<Map<ChainAddress, bigint>> {
  const rewardsPerRewardTokenMap = new Map<ChainAddress, bigint>();

  const uniqueFarmExistMap = new Map<FarmHash, IFarmExistsEvent>();
  farmExistsEvents.forEach((farmExists) => {
    uniqueFarmExistMap.set(farmExists.farmHash, farmExists);
  });

  return new Promise(async (resolve) => {
    for (const v of uniqueFarmExistMap.values()) {
      const { farmHash, rewardTokenDefn } = v;
      const farmsTrackedRewardsValue = await oracle.getFarmsTrackedRewardsValue(
        farmHash,
        oracleUrl,
      );

      rewardsPerRewardTokenMap.set(
        rewardTokenDefn,
        (rewardsPerRewardTokenMap.get(rewardTokenDefn) || 0n) +
          farmsTrackedRewardsValue,
      );
    }

    resolve(rewardsPerRewardTokenMap);
  });
}
