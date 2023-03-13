import type { Bot, Context, Types } from "./deps.ts";
import type {
  BotCommands,
  ChatType,
  EnvironmentOptions,
  InlineQueryResultCached,
  MyDefaultAdministratorRights,
} from "./types.ts";
import { PrivateChat, PrivateChatDetails } from "./private.ts";
import { GroupChat, GroupChatDetails } from "./group.ts";
import { SupergroupChat, SupergroupChatDetails } from "./supergroup.ts";
import { rand } from "./helpers.ts";
import { bakeHandlers } from "./methods/mod.ts";
import * as CONSTANTS from "./constants.ts";

export class Chats<C extends Context> {
  // Generated random values that are currently in use.
  randomsInUse: Record<string, Set<unknown>> = {};
  // Responsible for generating unique IDs and strings.
  unique<T>(generatorFn: () => T) {
    const type = generatorFn.name;
    let random = generatorFn();
    if (this.randomsInUse[type] === undefined) {
      this.randomsInUse[type] = new Set();
    }
    while (this.randomsInUse[type].has(random)) random = generatorFn();
    this.randomsInUse[type].add(random);
    return random;
  }

  // Properties existing without other chats.
  commands: BotCommands = CONSTANTS.BotCommandsDefault;
  myDefaultAdministratorRights: MyDefaultAdministratorRights;
  defaultChatMenuButton: Types.MenuButton;

  // Properties that are related with a chat.
  inlineQueries: Map<Types.InlineQuery["id"], Types.InlineQuery> = new Map();
  cachedInlineQueryResults: Map<
    Types.InlineQueryResultCachedGif["id"],
    InlineQueryResultCached
  > = new Map();

  updates: Map<Types.Update["update_id"], Types.Update> = new Map();
  update_id = 100000000;

  get updateId() {
    return this.update_id++;
  }

  // Properties of the Telegram environment.
  chats: Map<Types.Chat["id"], ChatType<C>> = new Map();

  constructor(private bot: Bot<C>, options?: EnvironmentOptions) {
    this.bot.botInfo = bot.isInited() && bot.botInfo
      ? bot.botInfo
      : options?.botInfo ?? {
        id: this.unique(rand.botId),
        first_name: "Test",
        last_name: "Bot",
        username: "testbot",
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
        is_bot: true,
      };

    this.myDefaultAdministratorRights = options?.myDefaultAdministratorRights ??
      CONSTANTS.defaultBotAdministratorRights;

    this.defaultChatMenuButton = options?.defaultChatMenuButton ??
      CONSTANTS.MenuButtonDefault;

    const handlers = bakeHandlers(this);
    this.bot.api.config.use((prev, method, payload, signal) => {
      const handler = handlers[method];
      return handler ? handler(payload) : prev(method, payload, signal);
    });
  }

  getBot() {
    return this.bot;
  }

  resolveUsername(username: string) {
    for (const chat of this.chats.values()) {
      if (chat.chat.type === "group") continue;
      if (chat.chat.username === username) return chat;
    }
  }

  newUser(details: PrivateChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const privateChat = new PrivateChat(this, details);
    this.chats.set(privateChat.chat_id, privateChat);
    return privateChat;
  }

  newGroup(details: GroupChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const groupChat = new GroupChat(this, details);
    this.chats.set(groupChat.chat_id, groupChat);
    return groupChat;
  }

  newSuperGroup(details: SupergroupChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const supergroupChat = new SupergroupChat(this, details);
    this.chats.set(supergroupChat.chat_id, supergroupChat);
    return supergroupChat;
  }

  validateUpdate(update: Omit<Types.Update, "update_id">): Types.Update {
    // TODO: the actual validation.
    return { ...update, update_id: this.updateId };
  }

  sendUpdate(update: Types.Update) {
    return this.bot.handleUpdate(update);
  }
}
