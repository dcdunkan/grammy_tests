import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function inlineModeMethods<C extends Context>(): Handlers<
  C,
  Methods<"inline_mode">
> {
  const answerInlineQuery: Handler<C, "answerInlineQuery"> = () =>
    api.error("not_implemented");
  const answerWebAppQuery: Handler<C, "answerWebAppQuery"> = () =>
    api.error("not_implemented");

  return { answerInlineQuery, answerWebAppQuery };
}
