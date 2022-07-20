import { Interface } from '@ethersproject/abi';

import { rpc, RpcOracleMethod, RpcRoute } from 'services';
import { ChainAddress, FarmHash } from 'types';
import { TNodeUrl } from '../discovery';

import { buffer, address } from 'utils';

const ifaceReferralFarmsV1Reactor = new Interface([
  'function getLastConfirmationReward(bytes32 farmHash) view returns (uint128)',
  'function getFarmTrackedRewardValue(bytes32 farmHash) view returns (uint128)',
]);

export async function getLastConfirmationReward(
  farmHash: FarmHash,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const reactorAddress = address.toReactorAddress('referralFarmsV1Reactor');

  const data = ifaceReferralFarmsV1Reactor.encodeFunctionData(
    'getLastConfirmationReward',
    [farmHash],
  );

  return rpc
    .call<{ to: string; data: string }[], string>(
      oracleUrl + RpcRoute.rpc,
      RpcOracleMethod.oracle_call,
      [
        {
          to: buffer.toHex(reactorAddress),
          data,
        },
      ],
    )
    .then((res) => BigInt(res?.result || '0'))
    .catch(() => BigInt('0'));
}

export async function getFarmsTrackedRewardsValue(
  farmHash: FarmHash,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const reactorAddress = address.toReactorAddress('referralFarmsV1Reactor');

  const data = ifaceReferralFarmsV1Reactor.encodeFunctionData(
    'getFarmTrackedRewardValue',
    [farmHash],
  );

  return rpc
    .call<{ to: string; data: string }[], string>(
      oracleUrl + RpcRoute.rpc,
      RpcOracleMethod.oracle_call,
      [
        {
          to: buffer.toHex(reactorAddress),
          data,
        },
      ],
    )
    .then((res) => BigInt(res?.result || '0'))
    .catch(() => BigInt('0'));
}

const ifaceFarmTokenSizeV1Reactor = new Interface([
  'function getFarmTokenSize(bytes32 farmHash, bytes24 referredToken) view returns (uint128)',
]);
// TODO: add real value
const hardcodedFarmTokenSizeV1Reactor =
  '0xd02d27c595ea215f9c55eb8ee0c70b78c367935e';
export async function getFarmTokenSize(
  farmHash: FarmHash,
  referredToken: ChainAddress,
  oracleUrl: TNodeUrl,
): Promise<bigint> {
  const data = ifaceFarmTokenSizeV1Reactor.encodeFunctionData(
    'getFarmTokenSize',
    [farmHash, referredToken],
  );

  return rpc
    .call<{ to: string; data: string }[], string>(
      oracleUrl + RpcRoute.rpc,
      RpcOracleMethod.oracle_call,
      [
        {
          to: hardcodedFarmTokenSizeV1Reactor,
          // to: buffer.toHex(address.toReactorAddress('farmTokenSizeV1Reactor')),
          data,
        },
      ],
    )
    .then((res) => BigInt(res?.result || '0'))
    .catch(() => BigInt('0'));
}
