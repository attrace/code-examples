import { LogDescription } from '@ethersproject/abi';

import { Bytes32, ChainAddress, EvmAddress, FarmHash } from 'types';

export interface LogParams {
  // Logs from these addresses only
  addresses?: EvmAddress[];
  // Search across all topics
  topics?: Bytes32[];
  // Topic1 is commonly the event id
  topic1?: Bytes32[];
  // Topics 2-4 are the 1-3 indexed event params
  topic2?: Bytes32[];
  topic3?: Bytes32[];
  topic4?: Bytes32[];
  // Logs from these chains only
  chainId?: number[];
  // Logs from these transactions only
  transactionHash?: Bytes32[];
  // Default AND search is done by the indexers
  strategy?: 'AND' | 'OR';
}

export interface IFarmExistsEvent {
  referredTokenDefn: string;
  rewardTokenDefn: string;
  sponsor: string;
}

export type IFarmExistEventRes = Map<string, IFarmExistsEvent>;

export interface IFarmMetastateEventParsed {
  farmHash: string;
  confirmationReward: bigint;
  // time in seconds
  rewardsLockTime: number;
  event: LogDescription;
}

export type IFarmMetastateEventRes = Map<string, IFarmMetastateEventParsed>;

export interface IFarmDepositIncreasedEventRes {
  event: LogDescription;
  farmHash: string;
  delta: bigint;
}

export type IRewardsHarvestedEventRes = Map<
  string,
  {
    farmHash: FarmHash;
    caller: EvmAddress;
    rewardTokenDefn: ChainAddress;
    value: number;
    leafHash: string;
  }
>;
