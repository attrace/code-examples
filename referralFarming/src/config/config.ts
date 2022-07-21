export enum EChainId {
  'Mainnet' = 1,
  'Rinkeby' = 4,
}
export enum EOracleChainId {
  'mainnet' = 147,
  'testnet' = 4470,
}

const OracleChainId = {
  [EChainId.Mainnet]: EOracleChainId.mainnet,
  [EChainId.Rinkeby]: EOracleChainId.testnet,
};
export const resolveOracleChainIdByNetwork = (
  chainId: EChainId,
): EOracleChainId => OracleChainId[chainId];
