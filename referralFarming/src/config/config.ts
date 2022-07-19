export enum ChainId {
  'Mainnet' = 1,
  'Rinkeby' = 4,
}

export const getChainName = (chainId: 1 | 4): string =>
  ChainId[chainId] as keyof typeof ChainId;
