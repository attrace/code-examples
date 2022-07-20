import { Interface } from '@ethersproject/abi';

import { rpc, RpcOracleMethod, RpcRoute } from 'services';
import { FarmHash } from 'types';
import { TNodeUrl } from '../discovery';

import { buffer, address } from 'utils';

const iface = new Interface([
  'function getLastConfirmationReward(bytes32 farmHash) view returns (uint128)',
]);

export async function getLastConfirmationReward(
  farmHash: FarmHash,
  host: TNodeUrl,
): Promise<bigint> {
  const reactorAddress = address.toReactorAddress('referralFarmsV1Reactor');

  const data = iface.encodeFunctionData('getLastConfirmationReward', [
    farmHash,
  ]);

  return rpc
    .call<{ to: string; data: string }[], string>(
      host + RpcRoute.rpc,
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