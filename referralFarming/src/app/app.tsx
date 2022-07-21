import { FC } from 'react';

import { useData } from './useData';

import Rewards from './rewards';

import styles from './styles.module.css';

const App: FC = () => {
  const {
    chainId,
    setChainId,
    referredToken,
    setReferredToken,
    farmCreatedTimestamp,
    dailyRewards,
    remainingRewards,
    aprPerRewardToken,
    fetchReferredTokenDetails,
    fetchFarmCreatedTimestamp,
    fetchDailyRewards,
    fetchRemainingRewards,
    fetchAPRForReferredToken,
    referTokenDetails,
  } = useData();

  return (
    <div className={styles.app}>
      <label>Referred Token:</label>
      <input
        value={referredToken}
        onChange={(e) => setReferredToken(e.target.value)}
        placeholder="referred token address"
        className={styles.input}
      />
      <label>Chain ID:</label>
      <input
        value={chainId}
        onChange={(e) => setChainId(Number(e.target.value))}
        placeholder="chain id"
        className={styles.input}
      />
      <div className={styles.controlBtns}>
        <button onClick={fetchReferredTokenDetails}>
          Get Referred Token Info
        </button>
        <button onClick={fetchFarmCreatedTimestamp}>
          Get created at(timestamp)
        </button>
        <button onClick={fetchDailyRewards}>Get Daily Rewards</button>
        <button onClick={fetchRemainingRewards}>Get Remaining Rewards</button>
        <button onClick={fetchAPRForReferredToken}>Get APR</button>
      </div>

      <div>
        <h2>Results:</h2>

        {!!referTokenDetails.length && (
          <>
            <h4>Referred Token Details:</h4>
            <div className={styles.resultContent}>
              {referTokenDetails.map(({ k, v }) => (
                <div key={k}>
                  {k} - {v}
                </div>
              ))}
            </div>
          </>
        )}

        {farmCreatedTimestamp && (
          <>
            <h4>Farm Created Timestamp:</h4>
            <div className={styles.resultContent}>{farmCreatedTimestamp}</div>
          </>
        )}

        {!!dailyRewards.length && (
          <>
            <h4>DailyRewards:</h4>
            <div className={styles.resultContent}>
              <Rewards rewards={dailyRewards} />
            </div>
          </>
        )}

        {!!remainingRewards.length && (
          <>
            <h4>Remaining Rewards:</h4>
            <div className={styles.resultContent}>
              <Rewards rewards={remainingRewards} />
            </div>
          </>
        )}

        {!!aprPerRewardToken.length && (
          <>
            <h4>APR:</h4>
            <div className={styles.resultContent}>
              {aprPerRewardToken.map(({ apr, rewardTokenSymbol }) => (
                <div
                  key={
                    apr + rewardTokenSymbol
                  }>{`${rewardTokenSymbol} ${apr} `}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
