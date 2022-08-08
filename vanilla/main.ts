import { BigNumber } from "@ethersproject/bignumber";
import { AttraceQuery, fetchConversionRateToEth, getErc20Decimals } from "./attrace";

// Referred token = the token being promoted
// Reward token = the token being rewarded for promotion

// Example fetching all values for 1 referred token
async function main() {
  const chainId = 1; // mainnet eth: 1, goerli: 5
  
  // Create an instance by chainId
  // RPC provider URL is used for sessions which don't have a local web3 wallet yet.
  const infuraKey = '646979134f4d414da7da14a26b32f395'; // Set your infura key here.
  const q = new AttraceQuery(chainId, `https://mainnet.infura.io/v3/${infuraKey}`);

  // // Optional: use the wallet chain id and wallet rpc connection if available.
  // if(await q.setTryWalletConnection(true)) {
  //   console.log('using session wallet instead of default network')
  // }

  console.log('using chain id: ', q.chainId);

  // Referred token we query for
  const token = '0x44e2dec86b9f0e0266e9aa66e10323a2bd69cf9a'.toLowerCase();

  // Get the decimals of the token from the ERC20 contract, required for correct conversion of the token.
  const decimals = await q.getErc20Decimals(token);
  console.log('decimals: ', decimals);

  // Get the exchange rate to ETH of the token, if any.
  const rates = await fetchConversionRateToEth([token]);

  // Get the time when the first farm was created for a referred token
  const firstFarmTime = await q.getReferredTokenFirstFarmTime(token);
  console.log('first farm time: ', new Date(firstFarmTime*1000));

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


// First off the console.log example
main();