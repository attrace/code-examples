import groupBy from 'lodash/groupBy';

import { discovery, TTokenList } from 'api';
import { Address, ERC20Token } from 'types';
import { EChainId } from '../../config';

/**
 * fetch token list API urls from https://discovery.attrace.com/tokenLists.json
 * @param chainId
 * @return token list urls per chainId
 */
async function fetchTokenListUrls(
  chainId: EChainId,
): Promise<string[] | undefined> {
  try {
    const { data } = await discovery.getDiscovery<TTokenList>(
      'tokenLists.json',
    );

    if (data?.tokenLists) {
      const listUrls = Object.entries(data?.tokenLists)
        .find(([tokenListChainId]) => Number(tokenListChainId) === chainId)?.[1]
        .map((tokenList) => tokenList.url);

      return listUrls;
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Fetch ERC20 tokens from provided urls
 * @param urls Array of urls
 */
async function fetchERC20Tokens(urls: string[]): Promise<ERC20Token[]> {
  try {
    const allRequest = urls.map(async (url) => {
      const res = await (await fetch(url)).json();

      return res?.tokens;
    });

    const allListResponse = await Promise.allSettled(allRequest);
    return allListResponse.map((res) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

export type TokenListMap = Map<Address, ERC20Token>;

/**
 * Fetches tokensList depends on selected chainId(Mainned or Rinkeby) from Mask and discovery(Attrace) services(see tokenList.json).
 * @param chainId Network ID(Rinkeby, Ethereum mainnet etc.)
 * @return Map where key is tokenAddress and value is ERC20Token
 */
export async function fetchTokenList(
  chainId: EChainId,
): Promise<TokenListMap | undefined> {
  try {
    const tokenListUrls = await fetchTokenListUrls(chainId);

    const tokenList = tokenListUrls && (await fetchERC20Tokens(tokenListUrls));
    const tokenListSortedFlatMap = tokenList?.flatMap((list) => list);

    const groupedTokens = groupBy(tokenListSortedFlatMap, (token) =>
      token.address.toLowerCase(),
    );

    // merge tokens from diff API by address to one object
    return new Map<Address, ERC20Token>(
      Object.entries(groupedTokens)
        .flatMap(([, value]) =>
          value.reduce((r, c) => Object.assign(r, c), {} as ERC20Token),
        )
        .sort(
          (tokenA: ERC20Token, tokenB: ERC20Token) =>
            tokenA?.symbol?.localeCompare(tokenB?.symbol || '') || 0,
        )
        .map((token) => [token.address.toLowerCase(), token]),
    );
  } catch (e) {
    return Promise.reject(e);
  }
}
