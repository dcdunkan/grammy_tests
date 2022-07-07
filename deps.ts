import { RawApi } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";

export type Methods<R extends RawApi> = string & keyof R;
export type Payload<M extends Methods<R>, R extends RawApi> = M extends unknown
  ? R[M] extends (signal?: AbortSignal) => unknown // deno-lint-ignore ban-types
    ? {} // deno-lint-ignore no-explicit-any
  : R[M] extends (args: any, signal?: AbortSignal) => unknown
    ? Parameters<R[M]>[0]
  : never
  : never;

export { type RawApi };
export * as GrammyTypes from "https://esm.sh/@grammyjs/types@2.8.0";
export { Bot, Context } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
