import { Address } from 'types';

interface IExchangeRate {
  [key: string]: {
    eth: number;
  };
}

const coingeckoApi =
  'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=';

export async function getConversationRate(
  token: Address[],
): Promise<IExchangeRate> {
  try {
    const url = `${coingeckoApi}${token.toString()}&vs_currencies=eth`;
    return await (await fetch(url)).json();
  } catch (e) {
    const error = e as Error;
    console.log(error);
    return Promise.resolve({});
  }
}
