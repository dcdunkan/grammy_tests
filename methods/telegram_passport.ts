import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function telegramPassportMethods<C extends Context>(): Handlers<
  C,
  Methods<"telegram_passport">
> {
  const setPassportDataErrors: Handler<C, "setPassportDataErrors"> = () =>
    api.error("not_implemented");
  return { setPassportDataErrors };
}
