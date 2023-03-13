export * from "./list.ts";

// TODO: VALIDATION of payloads
import type { Context } from "../deps.ts";
import type { Chats } from "../chats.ts";
import type { MethodHandlers } from "../types.ts";
// Categorized handlers
import { botMethods } from "./bot.ts";
import { messageMethods } from "./message.ts";

// TODO: change the `any` to `AllMethods` when everything's done.
export function bakeHandlers<C extends Context>(
  env: Chats<C>,
  // deno-lint-ignore no-explicit-any
): MethodHandlers<any> {
  return {
    ...botMethods(env),
    ...messageMethods(env),
  };
}
