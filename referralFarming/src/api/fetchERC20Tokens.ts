import { Address, ERC20Token } from 'types';
import TokenList from '../config/tokenList.json';
import { getChainName } from '../config';
import groupBy from 'lodash/groupBy';

/**
 * Fetch ERC20 tokens from multiple services: Attrace Discovery and Mask
 * @param urls
 */
async function fetchERC20Tokens(
  urls: string[],
): Promise<{ tokens: ERC20Token[]; weight: number }[]> {
  try {
    const allRequest = urls.map(async (url) => {
      const res = await (await fetch(url)).json();

      return {
        tokens: res?.tokens || [],
        weight: 0,
      };
    });

    const allListResponse = await Promise.allSettled(allRequest);
    return allListResponse.map((res) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }

      return {
        tokens: [],
        weight: 0,
      };
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

export type TokenListMap = Map<Address, ERC20Token>;

export async function fetchTokenList(chainId: 1 | 4): Promise<TokenListMap> {
  try {
    const tokenListUrls = TokenList.ERC20[getChainName(chainId)];
    const tokenList = await fetchERC20Tokens(tokenListUrls);
    const tokenListSorted = tokenList.flatMap((list) => list.tokens);

    const groupedTokens = groupBy(tokenListSorted, (token) =>
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