import type { Context, RawApi, Types } from "./deps.ts";
import type { PrivateChat } from "./private.ts";
import type { GroupChat } from "./group.ts";
import type { SupergroupChat } from "./supergroup.ts";
import type { ChannelChat } from "./channel.ts";
import { METHODS } from "./methods/list.ts";
import { Chats } from "./chats.ts";

export type MaybePromise<T> = T | Promise<T>;

export type NotificationHandler = (
  message: Types.Message,
) => MaybePromise<unknown>;

export type InteractableChats =
  | Types.Chat.GroupChat
  | Types.Chat.SupergroupChat
  | Types.Chat.ChannelChat;

export type InteractableChatTypes<C extends Context> =
  | GroupChat<C>
  | SupergroupChat<C>
  | ChannelChat<C>;

export type ApiResponse = {
  method: keyof RawApi;
  payload?: unknown;
};

export type ChatType<C extends Context> =
  | PrivateChat<C>
  | GroupChat<C>
  | SupergroupChat<C>
  | ChannelChat<C>;

export type MyDefaultAdministratorRights = Record<
  "groups" | "channels",
  Types.ChatAdministratorRights
>;

type Category = keyof typeof METHODS;
export type Methods<T extends Category> = typeof METHODS[T][number];
export type AllMethods = Methods<Category>;

// TODO: Is there no other method for satisfying everyone.
export type Handler<C extends Context, M extends keyof Types.ApiMethods> = (
  environment: Chats<C>,
  payload: Parameters<Types.ApiMethods[M]>[0],
) => Promise<Types.ApiResponse<ReturnType<Types.ApiMethods[M]>>>;

export type Handlers<
  C extends Context,
  M extends keyof RawApi,
> = Record<M, Handler<C, M>>;

// TODO: Re-think the design
type LanguageCode = string;
export type LocalizedCommands = Record<
  LanguageCode,
  Types.BotCommand[]
>;
type NotChatScopedBotCommands = Record<
  Exclude<
    Types.BotCommandScope["type"],
    "chat" | "chat_member" | "chat_administrators"
  >,
  LocalizedCommands
>;
interface ChatScopedBotCommands {
  chat: {
    [chat_id: number]: LocalizedCommands;
  };
  chat_administrators: {
    [chat_id: number]: LocalizedCommands;
  };
  chat_member: {
    [chat_id: number]: {
      [user_id: number]: LocalizedCommands;
    };
  };
}
export type BotCommands = NotChatScopedBotCommands & ChatScopedBotCommands;

export interface BotDescriptions {
  [lang: string]: Types.BotDescription & Types.BotShortDescription;
}

export interface EnvironmentOptions {
  botInfo?: Types.UserFromGetMe;
  myDefaultAdministratorRights?: MyDefaultAdministratorRights;
  defaultChatMenuButton?: Types.MenuButton;
  defaultCommands?: Types.BotCommand[];
}

export type InlineQueryResultCached =
  | Types.InlineQueryResultCachedGif
  | Types.InlineQueryResultCachedAudio
  | Types.InlineQueryResultCachedPhoto
  | Types.InlineQueryResultCachedVideo
  | Types.InlineQueryResultCachedVoice
  | Types.InlineQueryResultCachedSticker
  | Types.InlineQueryResultCachedDocument
  | Types.InlineQueryResultCachedMpeg4Gif;

export type UserStatus =
  | "member"
  | "owner"
  | "admin"
  | "left"
  | "restricted"
  | "banned";
