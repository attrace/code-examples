import type { PrefixedHexString } from 'ethereumjs-util';

// Never used class to force ts compiler to hide the underlying alias type.
class TypeStub {
  constructor() {}
}

export type Uint32 = bigint | TypeStub;
// 32-byte hex-encoded string
export type Hex32 = string | TypeStub;
// 24-byte hex-encoded string
export type Hex24 = string | TypeStub;
// 20-byte hex-encoded string
export type Hex20 = string | TypeStub;

export type HexTypes = PrefixedHexString | Hex32 | Hex24 | Hex20;
export type BigIntTypes = bigint | Uint32;

export type Bytes = ArrayLike<number>;
