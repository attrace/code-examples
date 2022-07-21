import { Bytes32, EvmAddress } from 'types';

export interface ILogParams {
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
