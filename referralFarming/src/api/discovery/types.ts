import { EOracleChainId } from 'config';

export type TNodeUrl = string;

type TGeolocation = {
  lat: number;
  lon: number;
};

type TContract = {
  chainId: string;
  address: string;
};

type TOracle = {
  url: TNodeUrl;
  location: TGeolocation;
  chainId: number;
};

export interface IDiscoveryRes<T> {
  data: T;
  pop: string;
}

export interface IDiscoveryTokenList {
  tokenLists: {
    [chainId: string]: {
      origin: string;
      url: string;
    }[];
  };
}

export interface IDiscoveryChainInfo {
  chainInfo: {
    chainId: EOracleChainId;
    authority: TContract;
    pacemaker: string; // network chainId ("1" for mainnet, "4" for rinkeby)
    referralFarmsV1: TContract[];
    confirmationsV1: TContract[];
    oracles: TOracle[];
  };
}
