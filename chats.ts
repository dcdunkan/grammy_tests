import { Bot, Context, debug, Types } from "./deps.ts";
import type {
  BotCommands,
  BotDescriptions,
  ChatType,
  EnvironmentOptions,
  InlineQueryResultCached,
  MyDefaultAdministratorRights,
} from "./types.ts";
import { PrivateChat, PrivateChatDetails } from "./private.ts";
import { GroupChat, GroupChatDetails } from "./group.ts";
import { SupergroupChat, SupergroupChatDetails } from "./supergroup.ts";
import { ChannelChat, ChannelChatDetails } from "./channel.ts";
import { bakeHandlers } from "./methods/mod.ts";
import * as CONSTANTS from "./constants.ts";
import { isChatAdministratorRight, isChatPermission, rand } from "./helpers.ts";

/** Emulates a Telegram environment, and everything's in it. */
export class Chats<C extends Context> {
  /** Generated random values that are currently in use. */
  randomsInUse: Record<string, Set<unknown>> = {};
  /** Responsible for generating unique IDs and strings. */
  unique<T>(generatorFn: () => T) {
    const type = generatorFn.name;
    let random = generatorFn();
    if (this.randomsInUse[type] === undefined) {
      this.randomsInUse[type] = new Set<T>();
    }
    while (this.randomsInUse[type].has(random)) random = generatorFn();
    this.randomsInUse[type].add(random);
    return random;
  }

  private d: ReturnType<typeof debug>;

  // Properties existing without other chats.
  commands: BotCommands = CONSTANTS.BotCommandsDefault;
  descriptions: BotDescriptions = CONSTANTS.BotDescriptionsDefault;
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

  get date() {
    return Math.trunc(Date.now() / 1000);
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

    const handlers = bakeHandlers<C>();
    this.bot.api.config.use((prev, method, payload, signal) => {
      const handler = handlers[method];
      return handler
        // deno-lint-ignore no-explicit-any
        ? handler(this, payload) as any // TODO: Fix the type issue.
        : prev(method, payload, signal);
    });

    this.d = debug("chats");
  }

  /** Get the bot installed on the environment. */
  getBot() {
    return this.bot;
  }

  /** Resolve an username registered in the environment */
  resolveUsername(username: string): ChatType<C> | undefined {
    for (const chat of this.chats.values()) {
      if (chat.chat.type === "group") continue;
      if (chat.chat.username === username) return chat;
    }
  }

  getChatMember(
    userId: number,
    chatId: number,
  ): Types.ChatMember | { status: "not-found" | "chat-not-found" } {
    const chat = this.chats.get(chatId);
    if (chat === undefined) return { status: "chat-not-found" };
    if (chat.type === "private") {
      this.d("No need for checking if user is a member of private chat");
      return { status: "chat-not-found" }; // Yes, thats how Bot API works.
    }
    return chat.getChatMember(userId);
  }

  /** Does the user have the permission to do something in the chat. */
  userCan(
    userId: number,
    chatId: number,
    permission:
      | keyof Types.ChatPermissions
      | keyof Types.ChatAdministratorRights,
  ): boolean {
    const member = this.getChatMember(userId, chatId);

    if (
      member.status === "chat-not-found" ||
      member.status === "not-found" ||
      member.status === "kicked" ||
      member.status === "left"
    ) return false;
    if (member.status === "creator") return true;
    if (member.status === "administrator") {
      if (isChatAdministratorRight(permission)) {
        return !!member[permission];
      }
    }

    if (!isChatPermission(permission)) {
      throw new Error(`Invalid permission '${permission}'`);
    }

    if (member.status === "restricted") return !!member[permission];

    const chat = this.chats.get(chatId)!;
    if (chat.type === "channel") return false;
    if (chat.type === "private") return true; // never reached
    if (chat.type === "group") return true;

    return !!chat.permissions[permission];
  }

  /** Create and register a new Telegram user in the environment. */
  newUser(details: PrivateChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const privateChat = new PrivateChat(this, details);
    this.chats.set(privateChat.chat_id, privateChat);
    return privateChat;
  }

  /** Create and register a new group in the environment. */
  newGroup(details: GroupChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const groupChat = new GroupChat(this, details);
    this.chats.set(groupChat.chat_id, groupChat);
    return groupChat;
  }

  /** Create and register a new supergroup in the environment. */
  newSuperGroup(details: SupergroupChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const supergroupChat = new SupergroupChat(this, details);
    this.chats.set(supergroupChat.chat_id, supergroupChat);
    return supergroupChat;
  }

  /** Create and register a new channel in the environment. */
  newChannel(details: ChannelChatDetails) {
    if (this.chats.has(details.id)) {
      throw new Error("Chat with the same ID already exists.");
    }
    const channelChat = new ChannelChat(this, details);
    this.chats.set(channelChat.chat_id, channelChat);
    return channelChat;
  }

  /** Validate the update before sending it. */
  validateUpdate(update: Omit<Types.Update, "update_id">): Types.Update {
    // TODO: the actual validation.
    return { ...update, update_id: this.updateId };
  }

  /** Send update to the bot. */
  sendUpdate(update: Types.Update) {
    return this.bot.handleUpdate(update);
  }
}
