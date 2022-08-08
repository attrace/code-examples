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

  /*

  Pair APR:
  -  Query all farms from indexer for a certain referred token
  -  Query farmTokenSizes for each of those farms for that referred token, summing these provides total positions size.
  -  Query lastConfirmedPeriodReward for all those farms (filter by reward token - APRs can only be shown by same reward token, or exchange rates come into play), summing these provides the total rewards per period.
  -  APR = totalRewardPeriod / totalPositionsSize * 365

   */

  async getReferredTokenAPRByRewardToken(referredToken: string) : Promise<Record<string, any>> {
    // Get all the farms
    const farms = await this.getFarms(referredToken) as FarmInfoEnriched[];

    // Collect for each of the farms the farmTokenSize and the lastRewardValue
    const p1 = Promise.all(farms.map(async f => {
      f.farmTokenSize = await this.getFarmTokenSize(f.farmHash, f.referredToken);
    }));
    const p2 = Promise.all(farms.map(async f => {
      f.lastConfirmationReward = await this.getLastConfirmationReward(f.farmHash);
    }));
    const p3 = Promise.all(farms.map(async f => {
      f.remainingRewardValue = await this.getFarmRemainingTrackedRewardValue(f.farmHash);
      console.log(`${f.remainingRewardValue} for ${f.farmHash}`);
    }))
    await Promise.all([p1, p2, p3]);

    // Aggregate values by reward token
    const rewardTokens = {};
    for(const farm of farms) {
      const { rewardToken, farmTokenSize, lastConfirmationReward, remainingRewardValue } = farm;

      // Skip drained farms
      if(remainingRewardValue.lte(0)) continue;

      // Initialize structure
      if(rewardTokens[rewardToken] == null) {
        rewardTokens[rewardToken] = {
          totalReferredValue: BigNumber.from(0),
          totalRewardValue: BigNumber.from(0),
          totalRemainingRewardValue: BigNumber.from(0),
          farms: [],
        }
      }

      // Sum values
      rewardTokens[rewardToken].totalReferredValue = rewardTokens[rewardToken].totalReferredValue.add(farmTokenSize);

      rewardTokens[rewardToken].totalRemainingRewardValue = rewardTokens[rewardToken].totalRemainingRewardValue.add(remainingRewardValue);

      rewardTokens[rewardToken].totalRewardValue = rewardTokens[rewardToken].totalRewardValue.add(
        remainingRewardValue.lt(lastConfirmationReward) 
        ? remainingRewardValue 
        : lastConfirmationReward
      );

      rewardTokens[rewardToken].farms.push(farm);
    }

    // For each of the reward tokens, fetch conversion rates
    const tokensToFetch = [referredToken];
    for(const [rewardToken, props] of Object.entries(rewardTokens)) {
      if(tokensToFetch.indexOf(rewardToken) < 0) tokensToFetch.push(rewardToken);
    }
    let rates = {};
    if(tokensToFetch.length > 1) {
      rates = await fetchConversionRateToEth(tokensToFetch);
    }

    // Get decimals for all tokens
    const decimalValues = await Promise.all(tokensToFetch.map(t => this.getErc20Decimals(t)));
    const decimals = {};
    for(let i = 0; i < tokensToFetch.length; i++) {
      decimals[tokensToFetch[i]] = decimalValues[i];
    }

    // Here we have all data, grouped by reward token
    // Now we calculate APR by reward token, normalized by conversion rate to ETH
    // APR is the current _annualised_ rate of return earned in reward token on the referred token based on it's value.
    const result = {};
    for(const [rewardToken, props] of Object.entries(rewardTokens)) {
      const { totalReferredValue, totalRewardValue, farms } = props;

      // Calculate conversion rate
      let rate = 1.0;
      if(rewardToken !== referredToken) {
        if(rates[rewardToken] == null) throw new Error('token-ETH rate missing for '+rewardToken);
        if(rates[referredToken] == null == null) throw new Error('token-ETH rate missing for '+referredToken);

        rate = rates[rewardToken] / rates[referredToken];
      }

      // Using conversion rate, calculate the APR
      props.apr =  -1.0;
      const totalReferredValueNum = tokenValueToNumber(totalReferredValue, decimals[referredToken]);
      const totalRewardValueNum = tokenValueToNumber(totalRewardValue, decimals[rewardToken]);
      if(totalReferredValueNum > 0) {
        props.apr = ((totalRewardValueNum * 365.0) / (totalReferredValueNum * 2.0)) * 100.0;
      }
    }

    return {
      rewardTokens,
      decimals,
      rates,
    };
  }

  async getFarmTokenSize(farmHash: string, referredToken: string) : Promise<BigNumber> {
    const res = await this.oracleCall(
      '0xd02d27c595ea215f9c55eb8ee0c70b78c367935e', // ftSizeReactor
      `0xd86308e8${farmHash.substring(2)}${this.chainAddressPrefix}${referredToken.substring(2)}0000000000000000`,
    );

    return BigNumber.from(res);
  }

  async getFarmRemainingTrackedRewardValue(farmHash: string) : Promise<BigNumber> {
    const res = await this.oracleCall(
      '0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965', // rfReactor
      `0x72a1880e${farmHash.substring(2)}`,
    );

    return BigNumber.from(res);
  }

  async getLastConfirmationReward(farmHash: string) : Promise<BigNumber> {
    const res = await this.oracleCall(
      '0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965', // rfReactor
      `0x776581ed${farmHash.substring(2)}`,
    );
    
    return BigNumber.from(res);
  }

  async getFarms(referredTokenHex: string) : Promise<FarmInfo[]> {
    if(referredTokenHex == null || referredTokenHex.substring(0, 2) !== '0x') throw new Error('invalid input: '+referredTokenHex);
    const erc20chop = referredTokenHex.substring(2).toLowerCase();
    const tokenb32 = `0x${this.chainAddressPrefix}${erc20chop}0000000000000000`;
    const farmExistsId = '0x46401a1ea83c45ef34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f';
    const req = await fetch(`${this.oracleUrl}/v1/logsearch?chainId=${this.chainId}&topic1=${farmExistsId}&topic4=${tokenb32}`);
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
        sponsor: '0x'+item.topic2.substr(26),
        rewardToken: '0x'+item.topic3.substr(10, 40),
        referredToken: '0x'+item.topic4.substr(10, 40),
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
      const res = await this.oracleCall(
        '0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965', // rfReactor 
        `0x72a1880e${f.farmHash.substring(2)}` // hash get tracked val(farm)
      );

      return BigNumber.from(res);
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
      const res = await this.oracleCall(
        '0x3e5d7f8ec7f45204e8b0ecc852e29b1b51cf3965', // rfReactor 
        `0x776581ed${f.farmHash.substring(2)}` // hash get daily rewards val(farm)
      );

      return BigNumber.from(res);
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

  private async oracleCall(reactorAddr: string, encodedData: string) : Promise<any> {
    const req = await fetch(`${this.oracleUrl}/v1/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": (++this.uid).toString(),
        "method": "oracle_call",
        "params": [
          {
            to: reactorAddr,
            data: encodedData,
          }
        ]
      })
    })
    if(req.status !== 200) throw new Error(req.statusText);
    const res = await req.json();
    if(res.error != null) throw new Error(JSON.stringify(res.error));

    return res.result;
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

interface FarmInfoEnriched extends FarmInfo {
  farmTokenSize: BigNumber;
  lastConfirmationReward: BigNumber;
  remainingRewardValue: BigNumber;
}

export async function fetchConversionRateToEth(tokens: string[] ): Promise<Record<string, number>> {
  const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokens.join(',')}&vs_currencies=eth`;
  const req = await fetch(url);
  if(req.status !== 200) throw new Error(req.statusText);
  const res = await req.json();
  const result = {};
  for(let [token, rates] of Object.entries(res)) {
    result[token] = rates.eth;
  }
  return result;
}

export function tokenValueToNumber(value: BigNumber, decimals: number) : number {
  if(decimals == null) throw new Error('decimals missing for token');
  return Number(formatFixed(value, decimals));
}

export function formatAPR(apr: number, referredValue: BigNumber) : string {
  if(referredValue.eq(0)) return '∞';
  if(apr < 0) return '-';
  return Math.round(apr).toString() + '%';
}