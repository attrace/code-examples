import { useCallback, useEffect, useState } from 'react';

import { farms } from 'services';

import {
  discovery,
  referralFarmsV1,
  fetchTokenList,
  resolveOracleUrl,
  IDiscoveryRes,
  TokenListMap,
  IDiscoveryChainInfo,
} from 'api';
import { address, numbers } from 'utils';
import { EChainId } from 'config';
import { Address, ERC20Token } from 'types';

const { calcApr, bigIntToNumber } = numbers;
const { toChainAddressEthers, parseChainAddress } = address;

const HARDCODED_TOKEN = '0xc778417e063141139fce010982780140aa0cd5ab';

export const useData = () => {
  const [referredToken, setReferredToken] = useState(HARDCODED_TOKEN);
  const [chainId, setChainId] = useState(EChainId.Rinkeby);
  const [tokensList, setTokensList] = useState<TokenListMap>(new Map());
  const [referTokenDetails, setReferTokenDetails] = useState<ERC20Token>();
  const [discoveryChainData, setDiscoveryChainData] =
    useState<IDiscoveryRes<IDiscoveryChainInfo>>();
  const [farmCreatedTimestamp, setFarmCreatedTimestamp] = useState<number>();
  const [dailyRewards, setDailyRewards] = useState<Array<any>>([]);
  const [remainingRewards, setRemainingRewards] = useState<Array<any>>([]);
  const [aprPerRewardToken, setAprPerRewardToken] = useState<
    { rewardTokenSymbol: string; apr: string }[]
  >([]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      const res = await discovery.fetchDiscoveryChain(chainId);
      setDiscoveryChainData(res);
    };

    fetchDiscovery();
  }, [chainId]);

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
    if (!discoveryChainData?.data || !referredToken) return;

    const referredTokenChainAddress = toChainAddressEthers(
      chainId,
      referredToken,
    );

    const data = await referralFarmsV1.fetchFarmExistsEvents(
      chainId,
      discoveryChainData.data,
      { referredTokens: [referredTokenChainAddress] },
    );
    const farmTimeCreated =
      data && (await farms.fetchFarmCreatedTimestamp(data));

    farmTimeCreated && setFarmCreatedTimestamp(Number(farmTimeCreated));
  }, [referredToken, chainId, discoveryChainData]);

  const fetchDailyRewards = useCallback(async () => {
    if (!discoveryChainData?.data || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );
    const farmExistsEvents = await referralFarmsV1.fetchFarmExistsEvents(
      chainId,
      discoveryChainData.data,
      { referredTokens: [referredTokenChainAddress] },
    );

    if (!farmExistsEvents?.length) return;

    const oracleUrl = resolveOracleUrl(discoveryChainData.data);

    const dailyRewardsMap = await farms.fetchDailyRewardsForFarms(
      farmExistsEvents,
      oracleUrl,
    );

    // resolve token details to show on the UI
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
  }, [referredToken, chainId, discoveryChainData]);

  const fetchRemainingRewards = useCallback(async () => {
    if (!discoveryChainData?.data || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );
    const farmExistsEvents = await referralFarmsV1.fetchFarmExistsEvents(
      chainId,
      discoveryChainData.data,
      { referredTokens: [referredTokenChainAddress] },
    );

    if (!farmExistsEvents?.length) return;

    const oracleUrl = resolveOracleUrl(discoveryChainData.data);

    const remainingRewardsMap = await farms.fetchRemainingRewardsForFarms(
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
  }, [referredToken, chainId, discoveryChainData]);

  const fetchAPRForReferredToken = useCallback(async () => {
    if (!discoveryChainData?.data || !referredToken) return;

    const referredTokenChainAddress = address.toChainAddressEthers(
      chainId,
      referredToken,
    );
    const farmExistsEvents = await referralFarmsV1.fetchFarmExistsEvents(
      chainId,
      discoveryChainData.data,
      {
        referredTokens: [referredTokenChainAddress],
      },
    );
    if (!farmExistsEvents?.length) return;

    const oracleUrl = resolveOracleUrl(discoveryChainData.data);
    const { aprData, farmTokenSize } = await farms.fetchAPRDataForFarms(
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
  }, [referredToken, chainId, discoveryChainData]);

  const fetchTokensList = useCallback(async (chainId: EChainId) => {
    const tokenList = await fetchTokenList(chainId);
    if (tokenList?.size) {
      setTokensList(tokenList);
      return tokenList;
    }
  }, []);

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
    referTokenDetails,
  };
};
