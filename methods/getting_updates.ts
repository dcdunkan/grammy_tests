import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function gettingUpdatesMethods<C extends Context>(): Handlers<
  C,
  Methods<"getting_updates">
> {
  const getUpdates: Handler<C, "getUpdates"> = () =>
    api.error("not_implemented");
  const setWebhook: Handler<C, "setWebhook"> = () =>
    api.error("not_implemented");
  const deleteWebhook: Handler<C, "deleteWebhook"> = () =>
    api.error("not_implemented");
  const getWebhookInfo: Handler<C, "getWebhookInfo"> = () =>
    api.error("not_implemented");

  return {
    getUpdates,
    setWebhook,
    deleteWebhook,
    getWebhookInfo,
  };
}
