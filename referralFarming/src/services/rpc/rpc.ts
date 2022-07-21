import { monotonicFactory } from 'ulid';

import { JsonRpcResponse } from './types';

const ulid = monotonicFactory();

async function rpcReq<U = never>(
  url: string,
  opts: RequestInit,
): Promise<JsonRpcResponse<U>> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...opts?.headers,
      'content-type': 'application/json',
    },
  });

  if (res.status !== 200) {
    console.log(Error(res.statusText));
    throw new Error(res.statusText);
  }

  const json: JsonRpcResponse<U> = await res.json();
  if (json.error) {
    console.log(json.error);
  }

  return json;
}

export async function call<T, U = never>(
  url: string,
  method: string,
  params: T,
): Promise<JsonRpcResponse<U>> {
  return rpcReq<U>(url, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ulid(),
      method,
      params: params || [],
    }),
  });
}
