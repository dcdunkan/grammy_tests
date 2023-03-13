import type { Context, RawApi, Transformer, Types } from "./deps.ts";
import type { PrivateChat } from "./private.ts";
import type { GroupChat } from "./group.ts";
import type { SupergroupChat } from "./supergroup.ts";
import type { ChannelChat } from "./channel.ts";
import { METHODS } from "./methods/list.ts";

export type ChatType<C extends Context> =
  | PrivateChat<C>
  | GroupChat<C>
  | SupergroupChat<C>
  | ChannelChat<C>;

export type MyDefaultAdministratorRights = Record<
  "groups" | "channels",
  Types.ChatAdministratorRights
>;

// TODO: Re-think the design
type LanguageCode = string;
type LocalizedCommands = Record<
  LanguageCode,
  readonly Types.BotCommand[]
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

type Category = keyof typeof METHODS;
export type Methods<T extends Category> = typeof METHODS[T][number];
export type AllMethods = Methods<Category>;
export type Payload<T extends keyof RawApi & string> = Parameters<RawApi[T]>[0];
export type MethodHandlers<
  T extends AllMethods,
> // deno-lint-ignore no-explicit-any
 = Record<T, (payload: any) => ReturnType<Transformer>>;
