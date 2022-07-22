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

/**
 * Deleted duplicates in FarmExistEvents to keep only one event for one farmHash,
 * It happens because one farmHash can have many FarmExistEvents in blockchain
 * @param farmExistsEvents
 * @returns Map of FarmExistEvents
 */
const farmExistsEventsToMap = (farmExistsEvents: IFarmExistEventRes) => {
  const uniqueFarmExistMap = new Map<FarmHash, IFarmExistsEvent>();
  farmExistsEvents.forEach((farmExists) => {
    uniqueFarmExistMap.set(farmExists.farmHash, farmExists);
  });

  return uniqueFarmExistMap;
};

/**
 * gets timestamp from blockNumber of first farmExistEvent
 * @param farmExistsEvents should be filtered by one referred token
 * @returns timestamp when first farm was created (first farmExists event emitted)
 */
export const getFarmCreatedTimestamp = async (
  farmExistsEvents: IFarmExistEventRes,
) => {
  const blockNumber = farmExistsEvents[0]?.blockNumber; //[0] - because first farmExists event emits when farm is created and all events sorted in desc order

  return (await web3.provider.eth.getBlock(blockNumber)).timestamp;
};

/**
 * fetching lastConfirmedReward per farmHash and aggregating it for APR calculation
 * @param farmExistsEvents should be filtered by one referred token
 * @param oracleUrl
 * @returns Map of rewards tokens for this referred token
 */
export async function getDailyRewardsForFarms(
  farmExistsEvents: IFarmExistEventRes,
  oracleUrl: TNodeUrl,
): Promise<Map<ChainAddress, bigint>> {
  const rewardsPerRewardTokenMap = new Map<ChainAddress, bigint>();

  const uniqueFarmExistMap = farmExistsEventsToMap(farmExistsEvents);

  return new Promise(async (resolve, reject) => {
    try {
      for (const v of uniqueFarmExistMap.values()) {
        const { farmHash, rewardTokenDefn } = v;
        const lastConfirmedReward = await oracle.fetchLastConfirmationReward(
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
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * fetching farmTrackedRewardValue per farmHash
 * @param farmExistsEvents should be filtered by one referred token
 * @param oracleUrl
 * @returns Map where key is rewardToken and value is sum of farmTrackedRewardValue for rewardToken<bigint>
 */
export async function getRemainingRewardsForFarms(
  farmExistsEvents: IFarmExistEventRes,
  oracleUrl: TNodeUrl,
): Promise<Map<ChainAddress, bigint>> {
  const rewardsPerRewardTokenMap = new Map<ChainAddress, bigint>();

  const uniqueFarmExistMap = new Map<FarmHash, IFarmExistsEvent>();
  farmExistsEvents.forEach((farmExists) => {
    uniqueFarmExistMap.set(farmExists.farmHash, farmExists);
  });

  return new Promise(async (resolve, reject) => {
    try {
      for (const v of uniqueFarmExistMap.values()) {
        const { farmHash, rewardTokenDefn } = v;
        const farmsTrackedRewardsValue =
          await oracle.fetchFarmsTrackedRewardsValue(farmHash, oracleUrl);

        rewardsPerRewardTokenMap.set(
          rewardTokenDefn,
          (rewardsPerRewardTokenMap.get(rewardTokenDefn) || 0n) +
            farmsTrackedRewardsValue,
        );
      }

      resolve(rewardsPerRewardTokenMap);
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * fetching farmTokenSize and lastConfirmedReward per farmHash and aggregating it for APR calculation
 * @param farmExistsEvents should be filtered by one referred token
 * @param oracleUrl
 * @returns Map where key is rewardToken and value is conversion rate(if it exists)<number> and sum of lastConfirmedRewards<bigint> for rewardToken
 */
export async function getAPRDataForFarms(
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

  const exchangeRates = await coingecko.fetchConversationRateToEth(arr);

  const { size } = uniqueFarmExistMap;
  let idx = 0;

  let totalFarmTokenSize = 0n;

  return new Promise((resolve, reject) => {
    try {
      uniqueFarmExistMap.forEach((farmExistEvent, key) => {
        const { rewardTokenDefn, referredTokenDefn } = farmExistEvent;

        Promise.all([
          oracle.fetchFarmTokenSize(key, referredTokenDefn, oracleUrl),
          oracle.fetchLastConfirmationReward(key, oracleUrl),
        ]).then(([farmTokenSize, lastConfirmedReward]) => {
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
            conversionRate: conversionRate,
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
        });
      });
    } catch(err) {
      reject(err)
    }
  });
}
