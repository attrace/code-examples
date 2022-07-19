import { IEventLog } from 'types';

export interface IResultValue {
  items: IEventLog[];
}
export interface IResult {
  status: string;
  value: IResultValue;
}
