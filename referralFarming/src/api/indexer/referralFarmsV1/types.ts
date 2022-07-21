import { FarmHash } from 'types';

export interface IFarmExistsEvent {
  farmHash: FarmHash;
  referredTokenDefn: string;
  rewardTokenDefn: string;
  sponsor: string;
  blockNumber: number;
}

export type IFarmExistEventRes = IFarmExistsEvent[];
