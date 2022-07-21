export type TNodeUrl = string;

export type TNode = {
  url: TNodeUrl;
  location: TGeolocation;
};

export type TGeolocation = {
  lat: number;
  lon: number;
};
export type TDao = {
  chainId: number;
  address: string;
  startBlockNumber: number;
};
export type TAirport = {
  iata: string;
  lat: number;
  lon: number;
};

type TContract = {
  chainId: number;
  address: string;
};

export interface IOracle extends TNode {
  chainId: number;
}

export interface IFarmOracles {
  oracles: IOracle[];
  referralFarmsV1: TContract[];
  confirmationsV1: TContract[];
}

export interface IDiscovery {
  daos: TDao[];
  indexers: TNode[];
  womOracles: TNode[];
  airports: TAirport[];
  farmOracles: IFarmOracles;
}

export interface IDiscoveryRes {
  data: IDiscovery;
  pop: string;
}
