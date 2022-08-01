export enum EChainId {
  'Mainnet' = 1,
  'Goerli' = 5,
}
export enum EOracleChainId {
  'mainnet' = 147,
  'testnet' = 5470,
}

const OracleChainId = {
  [EChainId.Mainnet]: EOracleChainId.mainnet,
  [EChainId.Goerli]: EOracleChainId.testnet,
};
export const resolveOracleChainIdByNetwork = (
  chainId: EChainId,
): EOracleChainId => OracleChainId[chainId];
