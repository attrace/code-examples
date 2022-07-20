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
import { address, numbers } from 'utils';
import { ChainId, getOracleChainId } from 'config';
import { Address, ERC20Token } from 'types';

import styles from './styles.module.css';

const { bigIntToNumber } = numbers;

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

const App: FC = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(ChainId.Rinkeby);
  const [tokensList, setTokensList] = useState<TokenListMap>(new Map());
  const [tokenDetails, setTokenDetails] = useState<ERC20Token | undefined>(
    undefined,
  );
  const [discoveryData, setDiscoveryData] = useState<IDiscoveryRes>();
  const [farmCreatedTimestamp, setFarmCreatedTimestamp] = useState<
    string | number
  >('');
  const [dailyRewards, setDailyRewards] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      const discoveryRes = await discovery.getDiscovery();
      setDiscoveryData(discoveryRes);
    };

    fetchDiscovery();
  }, []);

  const fetchFarmExistsEvents = useCallback(async () => {
    if (!discoveryData) return;

    const data = await referralFarmsV1.getFarmExistsEvents(
      chainId,
      discoveryData,
      {
        referredTokens: [address.toChainAddressEthers(chainId, referredToken)],
      },
    );
    const farmTimeCreated = data && (await farms.getFarmCreatedTimestamp(data));

    farmTimeCreated && setFarmCreatedTimestamp(farmTimeCreated);
  }, [referredToken, chainId, discoveryData]);

  const fetchTokensList = useCallback(async () => {
    if (chainId) {
      const tokenList = await fetchTokenList(chainId);
      if (tokenList?.size) {
        setTokensList(tokenList);
        return tokenList;
      }
    }
  }, [chainId]);

  const getDailyRewards = useCallback(async () => {
    if (!discoveryData) return;

    if (referredToken) {
      const farmExistsEvents = await referralFarmsV1.getFarmExistsEvents(
        chainId,
        discoveryData,
        {
          referredTokens: [
            address.toChainAddressEthers(chainId, referredToken),
          ],
        },
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

            const rewardTokenDetails = await getTokenDetails(
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
    }
  }, [referredToken, chainId, discoveryData]);

  const getTokenDetails = useCallback(
    async (token: Address) => {
      if (!token) {
        console.log('invalid input data');
        return;
      }

      let tokenDetails: ERC20Token | undefined;
      if (tokensList.size) {
        tokenDetails = tokensList.get(token);
      } else if (!tokensList.size) {
        const list = await fetchTokensList();
        if (list?.size) {
          tokenDetails = list.get(token);
        }
      }

      return tokenDetails;
    },
    [tokensList],
  );

  const getReferredTokenDetails = useCallback(async () => {
    const referredTokenDetails = await getTokenDetails(referredToken);
    if (referredTokenDetails) {
      setTokenDetails(referredTokenDetails);
    }
  }, [referredToken, getTokenDetails]);

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
        <button onClick={getReferredTokenDetails}>
          Get Referred Token Info
        </button>
        <button onClick={fetchFarmExistsEvents}>
          Get created at(timestamp)
        </button>
        <button onClick={getDailyRewards}>Get Daily Rewards</button>
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
          {dailyRewards.map(({ rewardTokenDetails, reward }: any) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
