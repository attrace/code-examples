import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { farms } from 'services';

import {
  discovery,
  referralFarmsV1,
  fetchTokenList,
  getOracleUrl,
  IDiscoveryRes,
  TokenListMap,
} from 'api';
import { address } from 'utils';
import { ChainId, getOracleChainId } from 'config';
import { Address, ERC20Token } from 'types';

import Rewards from './rewards';

import styles from './styles.module.css';

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

const App: FC = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(ChainId.Rinkeby);
  const [tokensList, setTokensList] = useState<TokenListMap>(new Map());
  const [tokenDetails, setTokenDetails] = useState<ERC20Token>();
  const [discoveryData, setDiscoveryData] = useState<IDiscoveryRes>();
  const [farmCreatedTimestamp, setFarmCreatedTimestamp] = useState<number>();
  const [dailyRewards, setDailyRewards] = useState<Array<any>>([]);
  const [remainingRewards, setRemainingRewards] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      const discoveryRes = await discovery.getDiscovery();
      setDiscoveryData(discoveryRes);
    };

    fetchDiscovery();
  }, []);

  useEffect(() => {
    if (chainId || referredToken) {
      resetState();
    }
  }, [chainId, referredToken]);

  const resetState = useCallback(async () => {
    setTokensList(new Map());
    setTokenDetails(undefined);
    setFarmCreatedTimestamp(undefined);
    setDailyRewards([]);
    setRemainingRewards([]);
  }, []);

  const fetchFarmCreatedTimestamp = useCallback(async () => {
    if (!discoveryData || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );

    const data = await referralFarmsV1.getFarmExistsEvents(
      chainId,
      discoveryData,
      { referredTokens: [referredTokenChainAddress] },
    );
    const farmTimeCreated = data && (await farms.getFarmCreatedTimestamp(data));

    farmTimeCreated && setFarmCreatedTimestamp(Number(farmTimeCreated));
  }, [referredToken, chainId, discoveryData]);

  const fetchTokensList = useCallback(async (chainId: ChainId) => {
    const tokenList = await fetchTokenList(chainId);
    if (tokenList?.size) {
      setTokensList(tokenList);
      return tokenList;
    }
  }, []);

  const fetchDailyRewards = useCallback(async () => {
    if (!discoveryData || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );

    const farmExistsEvents = await referralFarmsV1.getFarmExistsEvents(
      chainId,
      discoveryData,
      { referredTokens: [referredTokenChainAddress] },
    );

    if (farmExistsEvents?.length) {
      const oracleChainId = getOracleChainId(chainId);
      const oracleUrl = getOracleUrl(discoveryData.data, oracleChainId);

      const dailyRewardsMap = await farms.getDailyRewardsByReferredToken(
        farmExistsEvents,
        oracleUrl,
      );

      if (dailyRewardsMap.size) {
        const newDailyRewards = [];

        for (const [rewardToken, reward] of dailyRewardsMap.entries()) {
          const { address: rewardTokenAddress } =
            address.parseChainAddress(rewardToken);

          const rewardTokenDetails = await fetchTokenDetails(
            rewardTokenAddress,
          );

          newDailyRewards.push({
            rewardTokenDetails,
            reward,
          });
        }

        setDailyRewards(newDailyRewards);
      }
    }
  }, [referredToken, chainId, discoveryData]);

  const fetchRemainingRewards = useCallback(async () => {
    if (!discoveryData || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );
    const farmExistsEvents = await referralFarmsV1.getFarmExistsEvents(
      chainId,
      discoveryData,
      { referredTokens: [referredTokenChainAddress] },
    );

    if (farmExistsEvents?.length) {
      const oracleChainId = getOracleChainId(chainId);
      const oracleUrl = getOracleUrl(discoveryData.data, oracleChainId);

      const dailyRewardsMap = await farms.getRemainingRewardsByReferredToken(
        farmExistsEvents,
        oracleUrl,
      );

      if (dailyRewardsMap.size) {
        const newDailyRewards = [];

        for (const [rewardToken, reward] of dailyRewardsMap.entries()) {
          const { address: rewardTokenAddress } =
            address.parseChainAddress(rewardToken);

          const rewardTokenDetails = await fetchTokenDetails(
            rewardTokenAddress,
          );

          newDailyRewards.push({
            rewardTokenDetails,
            reward,
          });
        }

        setRemainingRewards(newDailyRewards);
      }
    }
  }, [referredToken, chainId, discoveryData]);

  const fetchTokenDetails = useCallback(
    async (token: Address) => {
      if (!token) {
        console.log('invalid input data');
        return;
      }

      let tokenDetails: ERC20Token | undefined;
      if (tokensList.size) {
        tokenDetails = tokensList.get(token);
      } else if (!tokensList.size) {
        const list = await fetchTokensList(chainId);
        if (list?.size) {
          tokenDetails = list.get(token);
        }
      }

      return tokenDetails;
    },
    [tokensList, chainId],
  );

  const fetchReferredTokenDetails = useCallback(async () => {
    const referredTokenDetails = await fetchTokenDetails(referredToken);
    if (referredTokenDetails) {
      setTokenDetails(referredTokenDetails);
    }
  }, [referredToken, fetchTokenDetails]);

  const details = useMemo(() => {
    if (!tokenDetails) return [];

    const details = [];

    for (const [k, v] of Object.entries(tokenDetails)) {
      details.push({ k, v });
    }

    return details;
  }, [tokenDetails]);

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
      </div>

      <div>
        <h2>Results:</h2>
        <div>
          <h4>Farm Created Timestamp:</h4>
          <div className={styles.resultContent}>{farmCreatedTimestamp}</div>
        </div>

        <h4>Referred Token Details:</h4>
        <div className={styles.resultContent}>
          {details.map(({ k, v }) => (
            <div key={k}>
              {k} - {v}
            </div>
          ))}
        </div>

        <h4>DailyRewards:</h4>
        <div className={styles.resultContent}>
          <Rewards rewards={dailyRewards} />
        </div>

        <h4>Remaining Rewards:</h4>
        <div className={styles.resultContent}>
          <Rewards rewards={remainingRewards} />
        </div>
      </div>
    </div>
  );
};

export default App;
