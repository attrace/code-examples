import BigNumber from 'bignumber.js';
import type { PrefixedHexString } from 'ethereumjs-util';

import type { HexTypes, BigIntTypes, Bytes } from './types';

function toEvenLength(str: string): string {
  if (str.length % 2 !== 0) {
    return `0${str}`;
  }
  return str;
}
function isHexString(value: string): boolean {
  return !!value.match(/^0x[\dA-Fa-f]*$/);
}

export function hexToArrayBuffer(input: string): Uint8Array {
  if (input.length % 2 !== 0) {
    throw new RangeError('Expected string to be an even number of characters');
  }

  const view = new Uint8Array(input.length / 2);

  for (let i = 0; i < input.length; i += 2) {
    view[i / 2] = Number.parseInt(input.slice(i, i + 2), 16);
  }
  return view;
}

export function writeUInt32BE(
  buff: Uint8Array,
  value: number,
  offset?: number,
): Uint8Array {
  if (value < 0 || value >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError(
      `value must be >= 0 and <= ${
        Number.MAX_SAFE_INTEGER - 1
      }. Received ${value}`,
    );
  }
  // eslint-disable-next-line no-bitwise
  buff.set([value >>> 24, value >>> 16, value >>> 8, value & 0xff], offset);

  return buff;
}

// Create lookup table for `toString('hex')`
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef';
  const table = Array.from({
    length: 256,
  });
  for (let i = 0; i < 16; i += 1) {
    const i16 = i * 16;
    for (let j = 0; j < 16; j += 1) {
      table[i16 + j] = alphabet[i] + alphabet[j];
    }
  }
  return table;
})();

function hexSlice(buff: Uint8Array, start?: number, end?: number): string {
  const len = buff.length;

  // eslint-disable-next-line no-param-reassign
  if (!start || start < 0) start = 0;
  // eslint-disable-next-line no-param-reassign
  if (!end || end < 0 || end > len) end = len;

  let out = '';
  for (let i = start; i < end; i += 1) {
    out += hexSliceLookupTable[buff[i]];
  }
  return out;
}

export function bufToHexString(
  buffer: Uint8Array,
  start?: number,
  end?: number,
): string {
  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    // eslint-disable-next-line no-param-reassign
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > buffer.length) {
    return '';
  }

  if (end === undefined || end > buffer.length) {
    // eslint-disable-next-line no-param-reassign
    end = buffer.length;
  }

  if (end <= 0) {
    return '';
  }

  // Force coercion to uint32. This will also coerce false/NaN values to 0.
  // eslint-disable-next-line no-param-reassign,no-bitwise
  end >>>= 0;
  // eslint-disable-next-line no-param-reassign, no-bitwise
  start >>>= 0;

  if (end <= start) {
    return '';
  }

  return hexSlice(buffer, start, end);
}

export function buf(
  b: Bytes | Uint8Array | HexTypes | number | BigIntTypes | BigNumber,
): Uint8Array {
  if (b === null || b instanceof Uint8Array) return b;

  if (typeof b === 'number') {
    return hexToArrayBuffer(new BigNumber(b).toString(16).slice(2));
  }

  if (typeof b === 'bigint')
    return hexToArrayBuffer(toEvenLength(b.toString(16)));

  if (typeof b === 'string') {
    if (!b.startsWith('0x')) throw new Error('unsupported');
    const hex = b.slice(2);
    if (hex.length % 2 !== 0 || !isHexString(b)) {
      throw new Error('invalid hex strings');
    }

    return hexToArrayBuffer(hex);
  }

  // This should return the most compact buffer version without leading zeros, so safe for RLP encodings.
  // eslint-disable-next-line no-underscore-dangle
  if (b instanceof BigNumber || (b as any)?._isBigNumber === true)
    return hexToArrayBuffer((b as any).toHexString().slice(2));

  throw new Error('unsupported: ');
}
export function toBigInt(
  b: BigIntTypes | Uint8Array | HexTypes | number | BigNumber,
): bigint {
  if (typeof b === 'bigint') return b;
  if (typeof b === 'number') return BigInt(b);
  if (b instanceof Uint8Array) return toBigInt(buf(b));
  if (typeof b === 'string' && b.startsWith('0x')) return BigInt(b);
  if (b instanceof BigNumber || (b as any)?._isBigNumber === true)
    return BigInt(b.toString());

  throw new Error('unsupported');
}

// Convert internal types to hex prefixed string, eg: '0x0a'
// Ensure we only convert values if we need them
export function toHex(
  b: HexTypes | Uint8Array | BigIntTypes | number,
): PrefixedHexString {
  if (b instanceof Uint8Array) {
    return `0x${bufToHexString(b)}`;
  }
  if (typeof b === 'string') {
    if (b.substring(0, 2) !== '0x') throw new Error('invalid string');
    return b;
  }
  if (typeof b === 'bigint' || typeof b === 'number') {
    const value = b.toString(16);
    if (value.length % 2) {
      return `0x0${value}`;
    } // E.g: Case b < 16
    return `0x${value}`;
  }

  throw new Error('unsupported');
}
