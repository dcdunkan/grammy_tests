import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function gettingUpdatesMethods<C extends Context>(): Handlers<
  C,
  Methods<"getting_updates">
> {
  const getUpdates: Handler<C, "getUpdates"> = () =>
    api.error("not_implemented", "Do not call getUpdates or bot.start()");
  const setWebhook: Handler<C, "setWebhook"> = () =>
    api.error("excluded_method");
  const deleteWebhook: Handler<C, "deleteWebhook"> = () =>
    api.error("excluded_method");
  const getWebhookInfo: Handler<C, "getWebhookInfo"> = () =>
    api.error("excluded_method");

  return {
    getUpdates,
    setWebhook,
    deleteWebhook,
    getWebhookInfo,
  };
}
