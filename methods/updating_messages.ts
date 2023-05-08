import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function updatingMessagesMethods<C extends Context>(): Handlers<
  C,
  Methods<"updating_messages">
> {
  const editMessageText: Handler<C, "editMessageText"> = () =>
    api.error("not_implemented");
  const editMessageCaption: Handler<C, "editMessageCaption"> = () =>
    api.error("not_implemented");
  const editMessageMedia: Handler<C, "editMessageMedia"> = () =>
    api.error("not_implemented");
  const editMessageReplyMarkup: Handler<C, "editMessageReplyMarkup"> = () =>
    api.error("not_implemented");
  const stopPoll: Handler<C, "stopPoll"> = () => api.error("not_implemented");
  const deleteMessage: Handler<C, "deleteMessage"> = () =>
    api.error("not_implemented");

  return {
    editMessageText,
    editMessageCaption,
    editMessageMedia,
    editMessageReplyMarkup,
    stopPoll,
    deleteMessage,
  };
}
