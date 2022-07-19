export type TNodeUrl = string;

export type Node = {
  url: TNodeUrl;
  location: Geolocation;
};
export type OracleNode = {
  chainId: number;
  url: TNodeUrl;
  location: Geolocation;
};
export type Geolocation = {
  lat: number;
  lon: number;
};
export type Dao = {
  chainId: number;
  address: string;
  startBlockNumber: number;
};
export type Airport = {
  iata: string;
  lat: number;
  lon: number;
};

type Contract = {
  chainId: number;
  address: string;
};

export interface Oracle extends Node {
  chainId: number;
}

export interface IFarmOracles {
  oracles: Oracle[];
  referralFarmsV1: Contract[];
  confirmationsV1: Contract[];
}

export interface IDiscovery {
  daos: Dao[];
  indexers: Node[];
  womOracles: Node[];
  airports: Airport[];
  farmOracles: IFarmOracles;
}

export interface IDiscoveryRes {
  data: IDiscovery;
  pop: string;
}
