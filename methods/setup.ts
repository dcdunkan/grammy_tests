import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function setupMethods<C extends Context>(): Handlers<
  C,
  Methods<"setup">
> {
  const getMe: Handler<C, "getMe"> = (env) => api.result(env.getBot().botInfo);
  const logOut: Handler<C, "logOut"> = () => api.error("not_implemented");
  const close: Handler<C, "close"> = () => api.error("not_implemented");

  return { getMe, logOut, close };
}
