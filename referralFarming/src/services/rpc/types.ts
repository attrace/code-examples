export type JsonRpcRequestId = number | string;
export type JsonRpcResponseId = JsonRpcRequestId | null;

export interface JsonRPCError extends Error {
  code: number; // Json Rpc compatible code
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: unknown;
}

export interface JsonRpcResponse<T = never> {
  jsonrpc: '2.0';
  id: JsonRpcResponseId;
  result?: T;
  error?: JsonRPCError;
}

/* eslint-disable camelcase */
export enum RpcOracleMethod {
  oracle_call = 'oracle_call',
}

export enum RpcRoute {
  rpc = '/v1/rpc',
}
