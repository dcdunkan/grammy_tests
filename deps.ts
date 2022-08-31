import { InputFile } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import { InputFileProxy } from "https://lib.deno.dev/x/grammy@1.x/types.ts";

// All of these types were imported from grammyjs/grammY source.
type GrammyTypes_ = InputFileProxy<InputFile>;
type Telegram = GrammyTypes_["Telegram"];
type Opts<M extends keyof GrammyTypes_["Telegram"]> = GrammyTypes_["Opts"][M];

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

export * as GrammyTypes from "https://esm.sh/@grammyjs/types@2.8.0";
export { Bot, Context } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
