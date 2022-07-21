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
import { EChainId, getOracleChainId } from 'config';
import { Address, ERC20Token } from 'types';

const { calcApr, bigIntToNumber } = numbers;
const { toChainAddressEthers, parseChainAddress } = address;

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

export const useData = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(EChainId.Rinkeby);
  const [tokensList, setTokensList] = useState<TokenListMap>(new Map());
  const [referTokenDetails, setReferTokenDetails] = useState<ERC20Token>();
  const [discoveryData, setDiscoveryData] = useState<IDiscoveryRes>();
  const [farmCreatedTimestamp, setFarmCreatedTimestamp] = useState<number>();
  const [dailyRewards, setDailyRewards] = useState<Array<any>>([]);
  const [remainingRewards, setRemainingRewards] = useState<Array<any>>([]);
  const [aprPerRewardToken, setAprPerRewardToken] = useState<
    { rewardTokenSymbol: string; apr: string }[]
  >([]);

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

  const resetState = useCallback(() => {
    setTokensList(new Map());
    setReferTokenDetails(undefined);
    setFarmCreatedTimestamp(undefined);
    setDailyRewards([]);
    setRemainingRewards([]);
    setAprPerRewardToken([]);
  }, []);

  const fetchFarmCreatedTimestamp = useCallback(async () => {
    if (!discoveryData || !referredToken) return;

    const referredTokenChainAddress = toChainAddressEthers(
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

  const fetchTokensList = useCallback(async (chainId: EChainId) => {
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

    if (!farmExistsEvents?.length) return;

    const oracleChainId = getOracleChainId(chainId);
    const oracleUrl = getOracleUrl(discoveryData.data, oracleChainId);

    const dailyRewardsMap = await farms.getDailyRewardsByReferredToken(
      farmExistsEvents,
      oracleUrl,
    );

    if (dailyRewardsMap.size) {
      const dailyRewardsWithTokenDetails = [];

      for (const [rewardToken, reward] of dailyRewardsMap.entries()) {
        const { address: rewardTokenAddress } =
          address.parseChainAddress(rewardToken);

        const rewardTokenDetails = await fetchTokenDetails(rewardTokenAddress);

        dailyRewardsWithTokenDetails.push({
          rewardTokenDetails,
          reward,
        });
      }

      setDailyRewards(dailyRewardsWithTokenDetails);
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

    if (!farmExistsEvents?.length) return;

    const oracleChainId = getOracleChainId(chainId);
    const oracleUrl = getOracleUrl(discoveryData.data, oracleChainId);

    const remainingRewardsMap = await farms.getRemainingRewardsByReferredToken(
      farmExistsEvents,
      oracleUrl,
    );

    if (remainingRewardsMap.size) {
      const remainingRewardsWithTokenDetails = [];

      for (const [rewardToken, reward] of remainingRewardsMap.entries()) {
        const { address: rewardTokenAddress } =
          address.parseChainAddress(rewardToken);

        const rewardTokenDetails = await fetchTokenDetails(rewardTokenAddress);

        remainingRewardsWithTokenDetails.push({
          rewardTokenDetails,
          reward,
        });
      }

      setRemainingRewards(remainingRewardsWithTokenDetails);
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
      setReferTokenDetails(referredTokenDetails);
    }
  }, [referredToken, fetchTokenDetails]);

  const fetchAPRForReferredToken = useCallback(async () => {
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

        const { aprData, farmTokenSize } = await farms.getAPRForReferredToken(
          farmExistsEvents,
          oracleUrl,
        );

        const newApr: { rewardTokenSymbol: string; apr: string }[] = [];

        if (aprData.size) {
          for (const [
            rewardToken,
            { lastConfirmedReward, conversionRate },
          ] of aprData.entries()) {
            const { address } = parseChainAddress(rewardToken);
            const rewardTokenDetails = await fetchTokenDetails(address);

            const dailyRewardsNumber = bigIntToNumber(
              lastConfirmedReward.toString(),
              referTokenDetails?.decimals,
            );
            const farmTokenSizeNumber = bigIntToNumber(
              farmTokenSize.toString(),
              rewardTokenDetails?.decimals,
            );

            const apr = calcApr(
              farmTokenSizeNumber,
              dailyRewardsNumber * conversionRate,
            );

            newApr.push({
              rewardTokenSymbol: rewardTokenDetails?.symbol || '',
              apr,
            });

            setAprPerRewardToken(newApr);
          }
        }
      }
    }
  }, [referredToken, chainId, discoveryData]);

  const details = useMemo(() => {
    if (!referTokenDetails) return [];

    const details = [];

    for (const [k, v] of Object.entries(referTokenDetails)) {
      details.push({ k, v });
    }

    return details;
  }, [referTokenDetails]);

  return {
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
    referTokenDetails: details,
  };
};
