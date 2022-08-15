import { AttraceQuery, createReferLink, formatAPR, tokenValueToNumber } from "./attrace";

// Referred token = the token being promoted
// Reward token = the token being rewarded for promotion

// Example fetching all values for 1 referred token
async function main() {
  // Create an instance
  const q = new AttraceQuery();

  // // Optional: use the wallet chain id and wallet rpc connection if available.
  // if(await q.setTryWalletConnection(true)) {
  //   console.log('using session wallet instead of default network')
  // }
  console.log('using chain id: ', q.chainId);

  // Referred token we query for
  const token = '0x44e2dec86b9f0e0266e9aa66e10323a2bd69cf9a'.toLowerCase();
  console.log('using referred token: '+token);

  // Get the time when the first farm was created for a referred token
  const firstFarmTime = await q.getReferredTokenFirstFarmTime(token);
  console.log('first farm time: ', new Date(firstFarmTime*1000));

  // Collect APR data for a referred token, by different reward token
  const { rewardTokens, decimals, rates } = await q.getReferredTokenAPRByRewardToken(token);
  if(rewardTokens == null || Object.keys(rewardTokens).length == 0) {
    console.log('No more active farms');
  }
  for(let [rewardToken, { apr, totalReferredValue, totalRewardValue, totalRemainingRewardValue, farms }] of Object.entries(rewardTokens)) {
    console.log(`Current APR for ${rewardToken} is ${formatAPR(apr, totalReferredValue)} with ${tokenValueToNumber(totalRemainingRewardValue, decimals[rewardToken])} reward token left`);
  }

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

  // Create refer link
  const promoter = '0x0000000000000000000000000_reward_address';
  console.log(createReferLink(promoter, token, 'uniswapv3', 'attrace'));

  // debugger;
}


// First off the console.log example
main().catch(err => {
  console.trace(err);
  throw err;
});