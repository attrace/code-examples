import BigNumber from 'bignumber.js';
import { keccak256, bytesToHex, asciiToHex, padRight } from 'web3-utils';
import { defaultAbiCoder } from '@ethersproject/abi';

import { buffer } from '../buffer';
import { Bytes32, ChainAddress, EvmAddress, Bytes24 } from 'types';

export function toReactorAddress(reactorId: string): Uint8Array {
  return buffer
    .buf(
      keccak256(
        defaultAbiCoder.encode(
          ['bytes32'],
          [padRight(asciiToHex(reactorId), 64)],
        ),
      ),
    )
    .slice(0, 20);
}

function toChainAddress(
  chainId: BigNumber | bigint,
  address: Uint8Array,
): Uint8Array {
  if (address.byteLength !== 20) throw new Error('invalid address');
  const b = new Uint8Array(24);

  // Only numeric network id's are supported in the chain address, with max of uint32.
  buffer.writeUInt32BE(b, Number(buffer.toBigInt(chainId)), 0);

  b.set(address, 4);

  return b;
}

export function toChainAddressEthers(chainId: number, address: string): string {
  return bytesToHex([
    ...toChainAddress(
      new BigNumber(chainId),
      buffer.hexToArrayBuffer(address.slice(2)),
    ),
  ]);
}

export function toEvmAddress(addr: ChainAddress): EvmAddress {
  return `0x${addr.slice(Math.max(0, 2 + 4 * 2))}`;
}

export function toChainId(addr: ChainAddress): number {
  return Number.parseInt(addr.slice(2, 2 + 4 * 2), 16);
}

export interface ChainAddressProps {
  chainId: number;
  address: EvmAddress;
  isNative: boolean;
}

export function parseChainAddress(
  ChainAddress: ChainAddress,
): ChainAddressProps {
  const chainId = toChainId(ChainAddress);
  const address = toEvmAddress(ChainAddress);
  const isNative =
    chainId === Number.parseInt(address.slice(Math.max(0, 2 + 16 * 2)), 16);
  return {
    chainId,
    address,
    isNative,
  };
}

export function expandEvmAddressToBytes32(addr: EvmAddress): Bytes32 {
  return `0x000000000000000000000000${addr.slice(2)}`.toLowerCase();
}

export function expandBytes24ToBytes32(b24: Bytes24): Bytes32 {
  return `0x${b24.substring(2)}0000000000000000`.toLowerCase();
}
