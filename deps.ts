export * as Types from "https://lib.deno.dev/x/grammy@1/types.ts";
export {
  Bot,
  Context,
  type Transformer,
} from "https://lib.deno.dev/x/grammy@1/mod.ts";

// These are duplicated because there are a few issues with types
// when transformed to Node using https://github.com/denoland/dnt.
import { InputFile } from "https://lib.deno.dev/x/grammy@1/mod.ts";
import { InputFileProxy } from "https://lib.deno.dev/x/grammy@1/types.ts";

// https://github.com/grammyjs/grammY/blob/v1.11.0/src/types.deno.ts
type Telegram = InputFileProxy<InputFile>["Telegram"];
type Opts<M extends keyof InputFileProxy<InputFile>["Telegram"]> =
  InputFileProxy<InputFile>["Opts"][M];

// https://github.com/grammyjs/grammY/blob/v1.11.0/src/core/client.ts
export type RawApi = {
  [M in keyof Telegram]: Parameters<Telegram[M]>[0] extends undefined
    ? (signal?: AbortSignal) => Promise<ReturnType<Telegram[M]>>
    : (
      args: Opts<M>,
      signal?: AbortSignal,
    ) => Promise<ReturnType<Telegram[M]>>;
};
export type Methods<R extends RawApi> = string & keyof R;
export type Payload<M extends Methods<R>, R extends RawApi> = M extends unknown
  ? R[M] extends (signal?: AbortSignal) => unknown // deno-lint-ignore ban-types
    ? {} // deno-lint-ignore no-explicit-any
  : R[M] extends (args: any, signal?: AbortSignal) => unknown
    ? Parameters<R[M]>[0]
  : never
  : never;
export type ApiCallResult<M extends Methods<R>, R extends RawApi> = R[M] extends
  (...args: unknown[]) => unknown ? Awaited<ReturnType<R[M]>> : never;

// `equals` modified from std/testing
export function objectEquals(c: unknown, d: unknown): boolean {
  const seen = new Map();
  return (function compare(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
        return false;
      }
      seen.set(a, b);
      const merged = { ...a, ...b };
      for (
        const key of [
          ...Object.getOwnPropertyNames(merged),
          ...Object.getOwnPropertySymbols(merged),
        ]
      ) {
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
        if (((key in a) && (!(key in b))) || ((key in b) && (!(key in a)))) {
          return false;
        }
      }
      return true;
    }
    return false;
  })(c, d);
}

// Date format in Telegram API results
export function getDate() {
  // Thanks @KnorpelSenf (https://t.me/grammyjs/76466)
  return Math.trunc(Date.now() / 1000);
}
