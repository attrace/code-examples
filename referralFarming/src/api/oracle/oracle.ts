import { Interface } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber';

import { rpc, RpcOracleMethod, RpcRoute } from 'services';
import { ChainAddress, FarmHash } from 'types';
import { TNodeUrl } from '../discovery';

import { buffer, address } from 'utils';
import { jsonErrorToError } from 'utils/rpc';

const ifaceReferralFarmsV1Reactor = new Interface([
  'function getLastConfirmationReward(bytes32 farmHash) view returns (uint128)',
  'function getFarmTrackedRewardValue(bytes32 farmHash) view returns (uint128)',
]);

/**
 * get last confirmation reward value from the oracle per farmHash
 * @param farmHash
 * @param oracleUrl
 */
export async function fetchLastConfirmationReward(
  farmHash: FarmHash,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const data = ifaceReferralFarmsV1Reactor.encodeFunctionData(
    'getLastConfirmationReward',
    [farmHash],
  );

  const res = await rpc.call<{ to: string; data: string }[], string>(
    oracleUrl + RpcRoute.rpc,
    RpcOracleMethod.oracle_call,
    [
      {
        to: buffer.toHex(address.toReactorAddress('referralFarmsV1Reactor')),
        data,
      },
    ],
  );

  if (res?.result) {
    const [decoded] = ifaceReferralFarmsV1Reactor.decodeFunctionResult('getLastConfirmationReward', res.result);
    return (decoded as BigNumber).toBigInt(); 
  }
  
  throw jsonErrorToError(res?.error);
}

/**
 * get the remaining reward value from the oracle per farmHash
 * @param farmHash
 * @param oracleUrl
 */
export async function fetchFarmsTrackedRewardsValue(
  farmHash: FarmHash,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const data = ifaceReferralFarmsV1Reactor.encodeFunctionData(
    'getFarmTrackedRewardValue',
    [farmHash],
  );
  const res = await rpc.call<{ to: string; data: string }[], string>(
    oracleUrl + RpcRoute.rpc,
    RpcOracleMethod.oracle_call,
    [
      {
        to: buffer.toHex(address.toReactorAddress('referralFarmsV1Reactor')),
        data,
      },
    ],
  );

  if (res?.result) {
    const [decoded] = ifaceReferralFarmsV1Reactor.decodeFunctionResult('getFarmTrackedRewardValue', res.result);
    return (decoded as BigNumber).toBigInt(); 
  }

  throw jsonErrorToError(res?.error);
}

const ifaceFarmTokenSizeV1Reactor = new Interface([
  'function getFarmTokenSize(bytes32 farmHash, bytes24 referredToken) view returns (uint128)',
]);

/**
 * get the farm token size  value from the oracle for referred token per farmHash
 * @param farmHash
 * @param referredToken
 * @param oracleUrl
 */
export async function fetchFarmTokenSize(
  farmHash: FarmHash,
  referredToken: ChainAddress,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const data = ifaceFarmTokenSizeV1Reactor.encodeFunctionData(
    'getFarmTokenSize',
    [farmHash, referredToken],
  );

  const res = await rpc.call<{ to: string; data: string }[], string>(
    oracleUrl + RpcRoute.rpc,
    RpcOracleMethod.oracle_call,
    [
      {
        to: buffer.toHex(address.toReactorAddress('farmTokenSizeV1Reactor')),
        data,
      },
    ],
  );

  if (res?.result) {
    const [decoded] = ifaceFarmTokenSizeV1Reactor.decodeFunctionResult('getFarmTokenSize', res.result);
    return (decoded as BigNumber).toBigInt(); 
  }

  throw jsonErrorToError(res?.error);
}
