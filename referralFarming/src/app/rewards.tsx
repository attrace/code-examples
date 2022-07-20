import { FC } from 'react';

import { numbers } from 'utils';

const { bigIntToNumber } = numbers;

interface IRewards {
  rewards: any;
}
const Rewards: FC<IRewards> = ({ rewards }) => {
  return rewards.map(
    ({ rewardTokenDetails, reward }: any) =>
      rewardTokenDetails && (
        <div key={rewardTokenDetails.symbol}>
          <h5>
            {rewardTokenDetails.name}({rewardTokenDetails.address})
          </h5>
          BigInt - {reward.toString() + 'n'}
          <br />
          {`Number - ${
            bigIntToNumber(reward, rewardTokenDetails.decimals) +
            rewardTokenDetails.symbol
          }`}
        </div>
      ),
  );
};

export default Rewards;
