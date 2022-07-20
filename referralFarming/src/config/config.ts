export enum ChainId {
  'Mainnet' = 1,
  'Rinkeby' = 4,
}

type TChainId = ChainId.Rinkeby | ChainId.Mainnet;

export const OracleChainId = {
  [ChainId.Rinkeby]: 4470,
  [ChainId.Mainnet]: 147,
};

export const getChainName = (chainId: TChainId): string =>
  ChainId[chainId] as keyof typeof ChainId;

export const getOracleChainId = (chainId: TChainId): number =>
  OracleChainId[chainId];
