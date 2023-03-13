import type { Context } from "../deps.ts";
import type { Chats } from "../chats.ts";
import type { MethodHandlers, Methods, Payload } from "../types.ts";
import { api } from "../helpers.ts";
// import * as CONSTANTS from "../constants.ts";

// TODO: Find a proper way to dedupe the logic used in *MyCommands.
export function messageMethods<C extends Context>(
  env: Chats<C>,
): MethodHandlers<Methods<"message">> {
  return {
    "sendMessage": (p: Payload<"sendMessage">) => {
    },
    "forwardMessage": () => api.error("not_implemented"),
    "copyMessage": () => api.error("not_implemented"),
    "deleteMessage": () => api.error("not_implemented"),
    "sendPhoto": () => api.error("not_implemented"),
    "sendAudio": () => api.error("not_implemented"),
    "sendDocument": () => api.error("not_implemented"),
    "sendVideo": () => api.error("not_implemented"),
    "sendAnimation": () => api.error("not_implemented"),
    "sendVoice": () => api.error("not_implemented"),
    "sendVideoNote": () => api.error("not_implemented"),
    "sendMediaGroup": () => api.error("not_implemented"),
    "sendLocation": () => api.error("not_implemented"),
    "editMessageLiveLocation": () => api.error("not_implemented"),
    "stopMessageLiveLocation": () => api.error("not_implemented"),
    "sendVenue": () => api.error("not_implemented"),
    "sendContact": () => api.error("not_implemented"),
    "sendPoll": () => api.error("not_implemented"),
    "stopPoll": () => api.error("not_implemented"),
    "sendDice": () => api.error("not_implemented"),
    "sendChatAction": () => api.error("not_implemented"),
    "sendSticker": () => api.error("not_implemented"),
    "editMessageText": () => api.error("not_implemented"),
    "editMessageCaption": () => api.error("not_implemented"),
    "editMessageMedia": () => api.error("not_implemented"),
    "editMessageReplyMarkup": () => api.error("not_implemented"),
  };
}
