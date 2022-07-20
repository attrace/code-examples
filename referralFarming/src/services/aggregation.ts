import { IFarmExistEventRes, IFarmExistsEvent } from 'api/indexer/farms/types';
import { oracle, TNodeUrl } from 'api';
import { web3 } from 'services';
import { ChainAddress, FarmHash } from '../types';

export const aggregateFarmCreatedTimestamp = async (
  farmExistsEvents: IFarmExistEventRes,
) => {
  const blockNumber = farmExistsEvents[0]?.blockNumber;

  return (await web3.provider.eth.getBlock(blockNumber)).timestamp;
};

export async function aggregateDailyRewardsByReferredToken(
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
