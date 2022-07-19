import { IFarmExistEventRes } from 'api/indexer/farms/types';
import { web3 } from 'services';

export const aggregateFarmCreatedTimestamp = async (
  farmExistsEvents: IFarmExistEventRes,
) => {
  const blockNumber = farmExistsEvents[0]?.blockNumber;

  return (await web3.provider.eth.getBlock(blockNumber)).timestamp;
};
