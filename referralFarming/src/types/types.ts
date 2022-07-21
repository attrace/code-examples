import { LogDescription } from '@ethersproject/abi';

// 20-byte hex-encoded "normal" Ethereum Virtual Machine public address.
// Eg: 0xaa97fed7413a944118db403ce65116dcc4d381e2
export type Address = string;

// uint32 integer which represents the network the token is on.
// Eg: 1 for eth-mainnet, 4 for eth-rinkeby, 137 for polygon-mainnet, ...
// Find more on https://chainlist.org/
export type ChainId = number;
// 32-byte hex-encoded string
// Eg: 0x46401a1ea83c45ef34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f
export type Bytes32 = string;
// 24-byte hex-encoded string
// Eg: 0x34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f
export type Bytes24 = string;
// 24-byte hex-encoded structure which encodes chainId and EvmAddress
// (or others) into one addressable value while keeping them recognizable and searchable.
// Limited to uint32 chainIds, which includes most of the blockchain networks. [See full list](https://chainlist.org/)
// Eg: 0x00000001aa97fed7413a944118db403ce65116dcc4d381e2
export type ChainAddress = Bytes24;
// 20-byte hex-encoded "normal" Ethereum Virtual Machine public address.
// Eg: 0xaa97fed7413a944118db403ce65116dcc4d381e2
export type EvmAddress = string;

// Timestamp in milliseconds, i.e. result of Date.now();
export type Timestamp = number;

// 32-byte hex-encoded hash of encode(sponsor,rewardToken,referredTokenDefn)
// Eg: 0x7a0bb0f2ee16291cee6e20dfa60968dbb7da4d3b3305bcaeedd5412603ef83b3
export type FarmHash = string;

// array containing four topics in string, i. e. '["0x108f...2e02", "0x108f...2e02", "0x108f...2e02", "0x108f...2e02"]'
type Topics = string;

// APR - annual percentage rate, i.e '69%'
export type APR = string;

export interface IEventLog {
  address: EvmAddress;
  blockHash: Bytes32;
  blockNumber: number;
  chainId: ChainId;
  data: Bytes32;
  isFinal: 1 | 0;
  logIndex: number;
  removed: 1 | 0;
  synced: Timestamp;
  topic1: Bytes32;
  topic2: Bytes32;
  topic3: Bytes32;
  topic4: Bytes32;
  topics: Topics;
  transactionHash: Bytes32;
  transactionIndex: number;
}

export interface ERC20Token {
  address: string;
  chainId: number;
  name?: string;
  symbol?: string;
  decimals: number;
  logoURI?: string;
}

export interface IEventParsed extends LogDescription {
  blockNumber: number;
}

export interface IDataForAPR {
  lastConfirmedReward: bigint;
  conversionRate: number;
}

export type IDataForAPRMap = Map<Address, IDataForAPR>;
