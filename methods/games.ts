import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function gamesMethods<C extends Context>(): Handlers<
  C,
  Methods<"games">
> {
  const sendGame: Handler<C, "sendGame"> = () => api.error("not_implemented");
  const setGameScore: Handler<C, "setGameScore"> = () =>
    api.error("not_implemented");
  const getGameHighScores: Handler<C, "getGameHighScores"> = () =>
    api.error("not_implemented");

  return {
    sendGame,
    setGameScore,
    getGameHighScores,
  };
}
