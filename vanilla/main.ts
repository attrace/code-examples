import { BigNumber } from '@ethersproject/bignumber';

// -- EXAMPLE FETCHING DATA FOR 1 TOKEN

async function main() {
  const chainId = 1; // mainnet eth: 1, goerli: 5
  
  // Create an instance by chainId, or call setConfig on an active instance if network changed in wallet.
  const q = new AttraceQuery(chainId);

  // Referred token we query for
  const token = '0x44e2dec86b9f0e0266e9aa66e10323a2bd69cf9a'.toLowerCase();

  // Get the farm created time
  const firstFarmTime = await q.getReferredTokenFirstFarmTime(token);
  console.log('first farm time: ', new Date(firstFarmTime*1000));

  // Collect exchange rate
  const rates = await fetchConversationRateToEth([token]);

  // Get remaining value, by different reward token
  const remaining = await q.getReferredTokenRemainingValue(token);
  for(let [rewardToken, value] of Object.entries(remaining)) {
    console.log(`remaining reward for reward token: ${rewardToken}: ${value.toString()}`)
  }

  // Get daily rewards, by different reward token
  const dailyRewards = await q.getReferredTokenDailyRewards(token);
  for(let [rewardToken, value] of Object.entries(dailyRewards)) {
    console.log(`daily reward for reward token: ${rewardToken}: ${value.toString()}`)
  }

  // Collect APR data for a referred token
  // TODO
  // debugger;
}

// -- IMPLEMENTATION

class AttraceQuery {
  chainId: number;
  oracleUrl: string;
  chainAddressPrefix: string;
  uid: number;

  constructor(chainId: number) {
    this.chainId = chainId;
    this.setConfig(chainId);
    this.uid = 0;
  }

  setConfig(chainId: number) {
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
    if(netConfigs[chainId.toString()] == null) throw new Error('invalid network');
    this.oracleUrl = netConfigs[chainId.toString()].oracleUrl;
    this.chainAddressPrefix = netConfigs[chainId.toString()].chainAddressPrefix;
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
    if(req.status !== 200) {
      throw new Error(req.statusText);
    }
    const res = await req.json();
    if(res.error != null) {
      throw new Error(JSON.stringify(res.error));
    }
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
      const res = await req.json();
      if(res.error) {
        throw new Error(JSON.stringify(res.error));
      }
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
      const res = await req.json();
      if(res.error) {
        throw new Error(JSON.stringify(res.error));
      }
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
}

async function valueToNumber(erc20Hex: string, value: BigNumber) : Promise<number> {
  // TODO fetch decimals from infura using rpc_call
  // convert to decimal number
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

async function fetchConversationRateToEth(tokens: string[] ): Promise<ExchangeRate> {
  const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokens.join(',')}&vs_currencies=eth`;
  return await (await fetch(url)).json() as ExchangeRate;
}

// First off the console.log example
main();