import { BigNumber, formatFixed } from "@ethersproject/bignumber";

export class AttraceQuery {
  public chainId: number;

  oracleUrl: string;
  chainAddressPrefix: string;
  rpcProvider: string;
  tryWallet: boolean = false;
  uid: number = 0;

  private readonly defaultChainId: number;

  // Create a new instance
  // Eg: new AttraceQuery(1, 'https://mainnet.infura.io/v3/<key>')
  constructor(chainId: number, rpcProviderUrl: string) {
    this.defaultChainId = chainId;
    this.setConfig(chainId, rpcProviderUrl);
  }

  // Use setConfig to change chainId after an instance was created
  setConfig(chainId: number, rpcProviderUrl: string) {
    const netConfigs = {
      '1': {
        oracleUrl: 'https://oracle-147-dub.attrace.com',
        chainAddressPrefix: '00000001',
      },
      '5': {
        oracleUrl: 'https://oracle-5470-dub.attrace.com',
        chainAddressPrefix: '00000005',
      },
    }
    this.chainId = chainId;
    this.rpcProvider = rpcProviderUrl;
    if(netConfigs[chainId.toString()] == null) throw new Error('invalid network');
    this.oracleUrl = netConfigs[chainId.toString()].oracleUrl;
    this.chainAddressPrefix = netConfigs[chainId.toString()].chainAddressPrefix;
  }

  // It's possible to use the connected wallet instead of default network
  async setTryWalletConnection(shouldTry: boolean) : Promise<boolean> {
    if(!shouldTry) {
      this.chainId = this.defaultChainId;
      this.tryWallet = false;

      return false;
    }

    // Loads the chain id of the wallet, if wanted behavior
    if(typeof window.ethereum !== 'undefined' && window.ethereum.isConnected != null && window.ethereum.isConnected() == true) {
      const chainId = BigNumber.from(await window.ethereum.request({ method: 'eth_chainId' })).toNumber();
      this.setConfig(chainId, this.rpcProvider);
      this.tryWallet = true;

      return true;
    }

    return false;
  }

  async getReferredTokenConvertedAPR(erc20Hex: string) : Promise<Record<string, number>> {
    console.log('TODO: return converted APR here by reward token with conversion rates applied');
    return {};
  }

  async getFarms(referredTokenHex: string) : Promise<FarmInfo[]> {
    if(referredTokenHex == null || referredTokenHex.substring(0, 2) !== '0x') throw new Error('invalid input: '+referredTokenHex);
    const erc20chop = referredTokenHex.substring(2).toLowerCase();
    const tokenb32 = `0x${this.chainAddressPrefix}${erc20chop}0000000000000000`;
    const farmExistsId = '0x46401a1ea83c45ef34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f';
    const req = await fetch(`${this.oracleUrl}/v1/logsearch?chainId=${this.chainId}&topic1=${farmExistsId}&topic3=${tokenb32}`);
    if(req.status !== 200) throw new Error(req.statusText);
    const res = await req.json();
    if(res.error != null) throw new Error(JSON.stringify(res.error));

    const seen = {};
    const farms: FarmInfo[] = [];
    for(let item of res.items) {
      if(seen[item.data]) continue;
      seen[item.data] = true;
      farms.push({
        farmHash: item.data,
        sponsor: item.topic2.substr(26),
        rewardToken: item.topic3.substr(10, 40),
        referredToken: item.topic4.substr(10, 40),
        blockTime: item.blockTime || Math.round(item.synced / 1000),
      });
    }

    return farms;
  }

  // Returns positive timestamp IN SECONDS when the first farm was created, if farms exist.
  // Returns null if not found, throws on request failure.
  async getReferredTokenFirstFarmTime(erc20Hex: string) : number {
    const farms = await this.getFarms(erc20Hex);
    if(farms.length > 0) {
      return farms[0].blockTime;
    }
    return null;
  }

  async getReferredTokenRemainingValue(erc20Hex: string) : Promise<Record<string, BigNumber>> {
    const farms = await this.getFarms(erc20Hex);
    const rows: Record<string, BigNumber> = {};

    // Hit RPC call for all and sum by reward token
    const results = await Promise.all(farms.map(async f => {
      const req = await fetch(`${this.oracleUrl}/v1/rpc`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "id": (++this.uid).toString(),
          "method": "oracle_call",
          "params": [
            {
              "to": "0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965", // rfReactor
              "data": `0x72a1880e${f.farmHash.substring(2)}` // hash get tracked val(farm)
            }
          ]
        })
      })
      if(req.status !== 200) throw new Error(req.statusText);
      const res = await req.json();
      if(res.error != null) throw new Error(JSON.stringify(res.error));

      return BigNumber.from(res.result);
    }));

    // Process results
    for(let i = 0; i < farms.length; i++) {
      const farm = farms[i];
      const value = results[i];
      if(rows[farm.rewardToken] == null) rows[farm.rewardToken] = BigNumber.from(0);
      rows[farm.rewardToken] = rows[farm.rewardToken].add(value);
    }

    return rows;
  }

  async getReferredTokenDailyRewards(erc20Hex: string) : Promise<Record<string, BigNumber>> {
    const farms = await this.getFarms(erc20Hex);
    const rows: Record<string, BigNumber> = {};

    // Hit RPC call for all and sum by reward token
    const results = await Promise.all(farms.map(async f => {
      const req = await fetch(`${this.oracleUrl}/v1/rpc`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "id": (++this.uid).toString(),
          "method": "oracle_call",
          "params": [
            {
              "to": "0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965", // rfReactor
              "data": `0x776581ed${f.farmHash.substring(2)}` // hash get daily rewards val(farm)
            }
          ]
        })
      })
      if(req.status !== 200) throw new Error(req.statusText);
      const res = await req.json();
      if(res.error != null) throw new Error(JSON.stringify(res.error));

      return BigNumber.from(res.result);
    }));

    // Process results
    for(let i = 0; i < farms.length; i++) {
      const farm = farms[i];
      const value = results[i];
      if(rows[farm.rewardToken] == null) rows[farm.rewardToken] = BigNumber.from(0);
      rows[farm.rewardToken] = rows[farm.rewardToken].add(value);
    }

    return rows;
  }

  async getErc20Decimals(erc20Hex: string) : Promise<number> {
    const method = 'eth_call';
    const params = [
      {
        to: erc20Hex, // Contract address
        data: "0x313ce567" // decimal() function id
      },
      "latest"
    ];

    // Try wallet
    if(this.tryWallet) {
      const res = await window.ethereum.request({ method, params });
      return BigNumber.from(res).toNumber();
    }

    // Else use infura
    const req = await fetch(this.rpcProvider, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: (++this.uid).toString(),
        method,
        params,
      }),
    });
    if(req.status !== 200) throw new Error(req.statusText);
    const res = await req.json();
    if(res.error != null) throw new Error(JSON.stringify(res.error));

    return BigNumber.from(res.result).toNumber();
  }
}

interface FarmInfo {
  farmHash: string;
  referredToken: string;
  rewardToken: string;
  sponsor: string;
  blockTime: number;
}

interface ExchangeRate {
  [key: string]: { eth: number };
}

export async function fetchConversionRateToEth(tokens: string[] ): Promise<ExchangeRate> {
  const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokens.join(',')}&vs_currencies=eth`;
  const req = await fetch(url);
  if(req.status !== 200) throw new Error(req.statusText);

  return await req.json() as ExchangeRate;
}

export async function tokenValueToNumber(value: BigNumber, decimals: number) : number {
  return Number(formatFixed(value, decimals));
}