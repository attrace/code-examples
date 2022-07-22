import { JsonRPCError } from "services";

export function jsonErrorToError(err: JsonRPCError) : Error {
  return new Error(`${err.message} (${err.code})`);
}