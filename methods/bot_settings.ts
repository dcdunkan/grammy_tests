import type { Context, Types } from "../deps.ts";
import type {
  Handler,
  Handlers,
  LocalizedCommands,
  Methods,
} from "../types.ts";
import { api } from "../helpers.ts";
import * as CONSTANTS from "../constants.ts";

// TODO: Find a proper way to dedupe the logic used in *MyCommands.
export function botSettingsMethods<C extends Context>(): Handlers<
  C,
  Methods<"bot_settings">
> {
  const setMyCommands: Handler<C, "setMyCommands"> = (env, payload) => {
    const language = payload.language_code ?? "";
    const scope = payload.scope;
    const commands = payload.commands as Types.BotCommand[];
    if (!scope?.type || scope.type === "default") {
      env.commands["default"][language] = commands;
    } else if (
      scope.type === "chat" || scope.type === "chat_administrators" ||
      scope.type === "chat_member"
    ) {
      let chatId = scope.chat_id;
      if (typeof chatId === "string") {
        const resolvedChat = env.resolveUsername(chatId);
        if (!resolvedChat) return api.error("chat_not_found");
        chatId = resolvedChat.chat_id;
      }
      if (env.commands[scope.type][chatId] === undefined) {
        env.commands[scope.type][chatId] = {};
      }
      if (scope.type !== "chat_member") {
        env.commands[scope.type][chatId][language] = commands;
        return api.result(true);
      }
      // chat_member scope
      if (env.commands[scope.type][chatId][scope.user_id] === undefined) {
        env.commands[scope.type][chatId][scope.user_id] = {};
      }
      env.commands[scope.type][chatId][scope.user_id][language] = commands;
    } else {
      env.commands[scope.type][language] = commands;
    }
    return api.result(true);
  };

  const deleteMyCommands: Handler<C, "deleteMyCommands"> = (env, payload) => {
    const language = payload.language_code ?? "";
    const scope = payload.scope;
    if (!scope?.type || scope.type === "default") {
      env.commands["default"][language] = []; // just reset.
    } else if (
      scope.type === "chat" || scope.type === "chat_administrators" ||
      scope.type === "chat_member"
    ) {
      let chatId = scope.chat_id;
      if (typeof chatId === "string") {
        const resolvedChat = env.resolveUsername(chatId);
        if (!resolvedChat) return api.error("chat_not_found");
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
    } else {
      env.commands[scope.type][language] = []; // just reset.
    }
    return api.result(true);
  };

  const getMyCommands: Handler<C, "getMyCommands"> = (env, payload) => {
    const language = payload.language_code ?? "";
    const scope = payload.scope;
    let commands: LocalizedCommands | undefined;
    if (!scope?.type || scope.type === "default") {
      commands = env.commands["default"];
    } else if (
      scope.type === "chat" || scope.type === "chat_administrators" ||
      scope.type === "chat_member"
    ) {
      let chatId = scope.chat_id;
      if (typeof chatId === "string") {
        const resolvedChat = env.resolveUsername(chatId);
        if (!resolvedChat) return api.error("chat_not_found");
        chatId = resolvedChat.chat_id;
      }
      commands = scope.type !== "chat_member"
        ? env.commands[scope.type][chatId]
        : env.commands[scope.type][chatId]?.[scope.user_id];
    } else {
      commands = env.commands[scope.type];
    }
    return api.result(commands?.[language] ?? []);
  };

  const setChatMenuButton: Handler<C, "setChatMenuButton"> = (env, payload) => {
    const menuButton = payload.menu_button ?? CONSTANTS.MenuButtonDefault;
    if (payload.chat_id === undefined) {
      env.defaultChatMenuButton = menuButton;
    } else {
      const chat = env.chats.get(payload.chat_id);
      if (chat === undefined) return api.error("chat_not_found");
      if (chat.type === "channel") return api.error("its_channel_chat");
      chat.chatMenuButton = menuButton;
    }
    return api.result(true);
  };

  const getChatMenuButton: Handler<C, "getChatMenuButton"> = (env, payload) => {
    if (payload.chat_id === undefined) {
      return api.result(env.defaultChatMenuButton);
    }
    const chat = env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    if (chat.type === "channel") return api.error("its_channel_chat");
    return api.result(chat.chatMenuButton);
  };

  const setMyDescription: Handler<C, "setMyDescription"> = (env, payload) => {
    const language = payload.language_code ?? "";
    env.descriptions[language] = {
      ...(env.descriptions[language] ?? {}),
      description: payload.description ?? "",
    };
    return api.result(true);
  };

  const getMyDescription: Handler<C, "getMyDescription"> = (env, payload) => {
    const language = payload.language_code ?? "";
    return api.result({
      description: (
        env.descriptions[language] ?? env.descriptions[""]
      )?.description ?? "",
    });
  };

  const setMyShortDescription: Handler<
    C,
    "setMyShortDescription"
  > = (env, payload) => {
    const language = payload.language_code ?? "";
    env.descriptions[language] = {
      ...(env.descriptions[language] ?? {}),
      short_description: payload.short_description ?? "",
    };
    return api.result(true);
  };

  const getMyShortDescription: Handler<
    C,
    "getMyShortDescription"
  > = (env, payload) => {
    const language = payload.language_code ?? "";
    return api.result({
      short_description: (
        env.descriptions[language] ?? env.descriptions[""]
      )?.short_description ?? "",
    });
  };

  const setMyDefaultAdministratorRights: Handler<
    C,
    "setMyDefaultAdministratorRights"
  > = (env, payload) => {
    const scope = payload.for_channels ? "channels" : "groups";
    if (payload.rights !== undefined) {
      env.myDefaultAdministratorRights[scope] = payload.rights;
    }
    return api.result(true);
  };

  const getMyDefaultAdministratorRights: Handler<
    C,
    "getMyDefaultAdministratorRights"
  > = (env, payload) => {
    const scope = payload.for_channels ? "channels" : "groups";
    return api.result(env.myDefaultAdministratorRights[scope]);
  };

  return {
    setMyCommands,
    deleteMyCommands,
    getMyCommands,
    setChatMenuButton,
    getChatMenuButton,
    setMyDescription,
    getMyDescription,
    setMyShortDescription,
    getMyShortDescription,
    setMyDefaultAdministratorRights,
    getMyDefaultAdministratorRights,
  };
}
