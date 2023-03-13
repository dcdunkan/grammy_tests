import type { Context } from "../deps.ts";
import type { Chats } from "../chats.ts";
import type { MethodHandlers, Methods, Payload } from "../types.ts";
import { api } from "../helpers.ts";
import * as CONSTANTS from "../constants.ts";

// TODO: Find a proper way to dedupe the logic used in *MyCommands.
export function botMethods<C extends Context>(
  env: Chats<C>,
): MethodHandlers<Methods<"bot">> {
  return {
    "getMe": () => {
      return api.result(env.getBot().botInfo);
    },
    "getMyCommands": (payload: Payload<"getMyCommands">) => {
      const language = payload.language_code ?? "";
      switch (payload.scope?.type) {
        case "chat":
        case "chat_administrators":
        case "chat_member": {
          const scope = payload.scope;
          let chatId = scope.chat_id;
          if (typeof chatId === "string") {
            const resolvedChat = env.resolveUsername(chatId);
            if (resolvedChat === undefined) {
              return api.error("chat_not_found");
            }
            chatId = resolvedChat.chat_id;
          }
          const commands = scope.type !== "chat_member"
            ? env.commands[scope.type][chatId]
            : env.commands[scope.type][chatId]?.[scope.user_id];
          return api.result(commands?.[language] ?? []);
        }
        case "all_chat_administrators":
        case "all_group_chats":
        case "all_private_chats":
        case "default":
        default: {
          const commands = env.commands[payload.scope?.type ?? "default"];
          return api.result(commands?.[language] ?? []);
        }
      }
    },
    "setMyCommands": (payload: Payload<"setMyCommands">) => {
      const language = payload.language_code ?? "";
      switch (payload.scope?.type) {
        case "chat":
        case "chat_administrators":
        case "chat_member": {
          const scope = payload.scope;
          let chatId = scope.chat_id;
          if (typeof chatId === "string") {
            const resolvedChat = env.resolveUsername(chatId);
            if (resolvedChat === undefined) {
              return api.error("chat_not_found");
            }
            chatId = resolvedChat.chat_id;
          }

          if (env.commands[scope.type][chatId] === undefined) {
            env.commands[scope.type][chatId] = {};
          }

          if (scope.type !== "chat_member") {
            env.commands[scope.type][chatId][language] = payload.commands;
            return api.result(true);
          }

          // chat_member scope
          if (env.commands[scope.type][chatId][scope.user_id] === undefined) {
            env.commands[scope.type][chatId][scope.user_id] = {};
          }
          env.commands[scope.type][chatId][scope.user_id][language] =
            payload.commands;

          return api.result(true);
        }
        case "all_chat_administrators":
        case "all_group_chats":
        case "all_private_chats":
        case "default":
        default: {
          const type = payload.scope?.type ?? "default";
          env.commands[type][language] = payload.commands;
          return api.result(true);
        }
      }
    },
    "deleteMyCommands": (payload: Payload<"deleteMyCommands">) => {
      const language = payload.language_code ?? "";
      switch (payload.scope?.type) {
        case "chat":
        case "chat_administrators":
        case "chat_member": {
          const scope = payload.scope;
          let chatId = scope.chat_id;
          if (typeof chatId === "string") {
            const resolvedChat = env.resolveUsername(chatId);
            if (resolvedChat === undefined) {
              return api.error("chat_not_found");
            }
            chatId = resolvedChat.chat_id;
          }

          if (scope.type !== "chat_member") {
            if (env.commands[scope.type][chatId]?.[language]) {
              env.commands[scope.type][chatId][language] = [];
            }
            return api.result(true);
          }

          if (env.commands[scope.type][chatId]?.[scope.user_id]?.[language]) {
            env.commands[scope.type][chatId][scope.user_id][language] = [];
          }
          return api.result(true);
        }
        case "all_chat_administrators":
        case "all_group_chats":
        case "all_private_chats":
        case "default":
        default: {
          const type = payload.scope?.type ?? "default";
          if (env.commands[type][language]) {
            env.commands[type][language] = []; // just reset.
          }
          return api.result(true);
        }
      }
    },
    "getChatMenuButton": (payload: Payload<"getChatMenuButton">) => {
      if (payload.chat_id === undefined) {
        return api.result(env.defaultChatMenuButton);
      }
      const chat = env.chats.get(payload.chat_id);
      if (chat === undefined) return api.error("chat_not_found");
      if (chat.type === "channel") return api.error("its_a_channel");
      return api.result(chat.chatMenuButton);
    },
    "setChatMenuButton": (payload: Payload<"setChatMenuButton">) => {
      const menuButton = payload.menu_button ?? CONSTANTS.MenuButtonDefault;
      if (payload.chat_id === undefined) {
        env.defaultChatMenuButton = menuButton;
      } else {
        const chat = env.chats.get(payload.chat_id);
        if (chat === undefined) return api.error("chat_not_found");
        if (chat.type === "channel") return api.error("its_a_channel");
        chat.chatMenuButton = menuButton;
      }
      return api.result(true);
    },
    "getMyDefaultAdministratorRights": (
      payload: Payload<"getMyDefaultAdministratorRights">,
    ) => {
      const scope = payload.for_channels ? "channels" : "groups";
      return api.result(env.myDefaultAdministratorRights[scope]);
    },
    "setMyDefaultAdministratorRights": (
      payload: Payload<"setMyDefaultAdministratorRights">,
    ) => {
      const scope = payload.for_channels ? "channels" : "groups";
      if (payload.rights !== undefined) {
        env.myDefaultAdministratorRights[scope] = payload.rights;
      }
      return api.result(true);
    },
    "getFile": () => api.error("not_implemented"),
  };
}
