import type { Context, Types } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function messagesMethods<C extends Context>(): Handlers<
  C,
  Methods<"messages">
> {
  const sendMessage: Handler<C, "sendMessage"> = async (env, payload) => {
    const chat = typeof payload.chat_id === "number"
      ? env.chats.get(payload.chat_id)
      : env.resolveUsername(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    // TODO: Parse the text with parse mode to entities.
    if (chat.type === "private") {
      if (
        typeof payload.reply_to_message_id === "number" &&
        chat.messages.get(payload.reply_to_message_id) === undefined &&
        payload.allow_sending_without_reply === undefined
      ) {
        return api.error("reply_to_message_not_found");
      }

      const message: Types.Message.TextMessage = {
        message_id: chat.messageId,
        chat: chat.chat,
        from: chat.user,
        text: payload.text,
        date: env.date,
        // entities: textToEntities(payload.text, payload.parse_mode),
        reply_to_message: payload.reply_to_message_id
          ? chat.messages.get(
            payload.reply_to_message_id,
          ) as Types.Message["reply_to_message"]
          : undefined,
        has_protected_content: payload.protect_content === true
          ? payload.protect_content
          : undefined,
        message_thread_id: payload.message_thread_id,
      };

      chat.messages.set(chat.messageId, message);
      if (!payload.disable_notification) {
        await chat.eventHandlers["message"]?.(message);
      }
      return api.result(message);
    }
    return api.error("not_implemented");
  };

  const forwardMessage: Handler<C, "forwardMessage"> = () =>
    api.error("not_implemented");
  const copyMessage: Handler<C, "copyMessage"> = () =>
    api.error("not_implemented");
  const sendPhoto: Handler<C, "sendPhoto"> = () => api.error("not_implemented");
  const sendAudio: Handler<C, "sendAudio"> = () => api.error("not_implemented");
  const sendDocument: Handler<C, "sendDocument"> = () =>
    api.error("not_implemented");
  const sendVideo: Handler<C, "sendVideo"> = () => api.error("not_implemented");
  const sendAnimation: Handler<C, "sendAnimation"> = () =>
    api.error("not_implemented");
  const sendVoice: Handler<C, "sendVoice"> = () => api.error("not_implemented");
  const sendVideoNote: Handler<C, "sendVideoNote"> = () =>
    api.error("not_implemented");
  const sendMediaGroup: Handler<C, "sendMediaGroup"> = () =>
    api.error("not_implemented");
  const sendLocation: Handler<C, "sendLocation"> = () =>
    api.error("not_implemented");
  const editMessageLiveLocation: Handler<C, "editMessageLiveLocation"> = () =>
    api.error("not_implemented");
  const stopMessageLiveLocation: Handler<C, "stopMessageLiveLocation"> = () =>
    api.error("not_implemented");
  const sendVenue: Handler<C, "sendVenue"> = () => api.error("not_implemented");
  const sendContact: Handler<C, "sendContact"> = () =>
    api.error("not_implemented");
  const sendPoll: Handler<C, "sendPoll"> = () => api.error("not_implemented");
  const sendDice: Handler<C, "sendDice"> = () => api.error("not_implemented");
  const sendChatAction: Handler<C, "sendChatAction"> = () =>
    api.error("not_implemented");
  const getUserProfilePhotos: Handler<C, "getUserProfilePhotos"> = () =>
    api.error("not_implemented");
  const getFile: Handler<C, "getFile"> = () => api.error("not_implemented");
  const answerCallbackQuery: Handler<C, "answerCallbackQuery"> = () =>
    api.error("not_implemented");

  return {
    sendMessage,
    forwardMessage,
    copyMessage,
    sendPhoto,
    sendAudio,
    sendDocument,
    sendVideo,
    sendAnimation,
    sendVoice,
    sendVideoNote,
    sendMediaGroup,
    sendLocation,
    editMessageLiveLocation,
    stopMessageLiveLocation,
    sendVenue,
    sendContact,
    sendPoll,
    sendDice,
    sendChatAction,
    getUserProfilePhotos,
    getFile,
    answerCallbackQuery,
  };
}
