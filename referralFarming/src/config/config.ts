export enum EChainId {
  'Mainnet' = 1,
  'Rinkeby' = 4,
}
export enum EOracleChainId {
  'mainnet' = 147,
  'testnet' = 4,
}

type TChainId = EChainId.Rinkeby | EChainId.Mainnet;

export const getChainName = (chainId: TChainId): string =>
  EChainId[chainId] as keyof typeof EChainId;

const OracleChainId = {
  [EChainId.Mainnet]: EOracleChainId.mainnet,
  [EChainId.Rinkeby]: EOracleChainId.testnet,
};
export const getOracleChainId = (chainId: TChainId): number =>
  OracleChainId[chainId];
