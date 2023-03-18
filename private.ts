import { Bot, Context, debug, Types } from "./deps.ts";
import { Chats } from "./chats.ts";
import { date } from "./helpers.ts";
import {
  ApiResponse,
  InteractableChats,
  InteractableChatTypes,
  MaybePromise,
  NotificationHandler,
} from "./types.ts";

type DetailsExceptObvious = Omit<Types.Chat.PrivateChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.PrivateGetChat,
  keyof Types.Chat.PrivateChat | "pinned_message"
>;
type UserDetails = Omit<Types.User, keyof Types.Chat.PrivateChat | "is_bot">;

export interface PrivateChatDetails extends DetailsExceptObvious, UserDetails {
  /** do not specify unless you know what you're doing */
  chat?: InteractableChats;
  pinnedMessages?: Types.Message[];
  blocked?: boolean; // is the bot blocked by the user
  additional?: DetailsFromGetChat;
  chatMenuButton?: Types.MenuButton;
}

type PrivateChatNotificationHandlers = Partial<{
  "message": (message: Types.Message) => MaybePromise<unknown>;
}>;

export class PrivateChat<C extends Context> {
  readonly type = "private";
  chat_id: Types.Chat["id"];
  userChat: Types.Chat.PrivateChat;
  chat: Types.Chat.PrivateChat | InteractableChats;
  user: Types.User;
  ownerOf: Set<Types.Chat["id"]> = new Set();

  #bot: Bot<C>;

  chatMenuButton: Types.MenuButton;

  // Private chat related
  pinnedMessages: Types.Message[];

  eventHandlers: PrivateChatNotificationHandlers = {};

  d: ReturnType<typeof debug>;

  /** Updates sent by the user to the bot */
  updates: Types.Update[] = [];
  responses: ApiResponse[] = [];

  messages: Map<Types.MessageId["message_id"], Types.Message> = new Map();
  message_id = 1;

  get messageId() {
    return this.message_id++;
  }

  constructor(private env: Chats<C>, public details: PrivateChatDetails) {
    this.#bot = env.getBot();
    this.pinnedMessages = details.pinnedMessages ?? [];

    this.chat_id = details.chat?.id ?? details.id;
    const user = {
      id: details.id,
      username: details.username,
      first_name: details.first_name,
      last_name: details.last_name,
    };
    this.userChat = { ...user, type: "private" };
    this.chat = details.chat ?? this.userChat;
    this.user = {
      ...user,
      is_bot: false,
      is_premium: details.is_premium,
      language_code: details.language_code,
      added_to_attachment_menu: details.added_to_attachment_menu,
    };

    this.chatMenuButton = details.chatMenuButton ?? env.defaultChatMenuButton;

    this.d = debug(`${user.first_name} (P:${user.id})`);

    this.#bot.api.config.use((prev, method, payload, signal) => {
      if ("chat_id" in payload && payload.chat_id === this.chat_id) {
        this.responses.push({ method, payload });
      }
      return prev(method, payload, signal);
    });
  }

  getChat(): Types.Chat.PrivateGetChat {
    return {
      ...this.userChat,
      ...this.details.additional,
      pinned_message: this.pinnedMessages.at(-1),
    };
  }

  /**
   * Use this method for imitating the user as in a chat, i.e.,
   * as in a group or supergroup or channel. It internally only
   * changes the chat object used in the sending updates. The
   * further chained methods will be bound to the chat. Returns
   * a private chat instance with chat related properties are
   * changed to the specified chat properties.
   */
  in(chat: InteractableChatTypes<C>) {
    return new PrivateChat(this.env, {
      ...this.details,
      chat: chat.chat,
      chatMenuButton: undefined,
      pinnedMessages: undefined,
      additional: undefined,
    });
  }

  /**
   * **Remember, that the event handlers are only called when the bot
   * is interacting only with the user.**
   *
   * Set a event handler using this function. For example, when
   * the bot sends a messsage, the user will receive a new message
   * event, and those events can be handled by registering a handler.
   */
  onEvent(
    notification: keyof PrivateChatNotificationHandlers,
    handler: NotificationHandler,
  ) {
    this.eventHandlers[notification] = handler;
  }

  /** Make the user a premium subscriber. */
  subscribePremium() {
    this.user.is_premium = true;
  }

  /** Yes, and suddenly the user hates premium. */
  unsubscribePremium() {
    this.user.is_premium = undefined;
  }

  // TODO: Chat join request thingy.
  /** Join a group or channel. */
  join(chatId: number) {
    const status = this.env.userIs(this.user.id, chatId);
    const chat = this.env.chats.get(chatId)!;
    if (chat.type === "private") {
      throw new Error(`Makes no sense "joining" a private chat ${chatId}`);
    }
    if (status === "banned") throw new Error("User is banned from the chat");
    if (status === "left") {
      chat.members.set(this.user.id, { status: "member", user: this.user });
      this.d(`Joined the ${chat.type} "${chat.chat.title}" (${chatId})`);
      return true;
    }
    this.d(`User is already a member of the chat ${chatId}`);
    return true;
  }

  /** Leave a group or channel. */
  leave(chatId: number) {
    const status = this.env.userIs(this.user.id, chatId);
    const chat = this.env.chats.get(chatId)!;
    if (chat.type === "private") {
      throw new Error(`Makes no sense "leaving" a private chat ${chatId}`);
    }
    if (status === "banned") throw new Error("User is already banned!");
    if (status === "left") {
      this.d("User has already left.");
      return true;
    }

    if (status === "owner") this.d("WARNING: user is the owner of the chat");
    chat.members.delete(this.user.id);
    this.d(`Left the ${chat.type} "${chat.chat.title}" (${chatId})`);
    return true;
  }

  /** Send a message in the chat. */
  sendMessage(text: string, options?: {
    replyTo?:
      | Types.MessageId["message_id"]
      | NonNullable<Types.Message["reply_to_message"]>;
    entities?: Types.MessageEntity[];
  }) {
    if (!this.env.userCan(this.user.id, this.chat.id, "can_send_messages")) {
      throw new Error("User have no permission to send message to the chat.");
    }
    const common = {
      message_id: this.messageId,
      date: date(),
      text,
      entities: options?.entities,
      reply_to_message: typeof options?.replyTo === "number"
        ? this.messages.get(options.replyTo) as NonNullable<
          Types.Message["reply_to_message"]
        >
        : options?.replyTo,
    };
    const update: Omit<Types.Update, "update_id"> = this.chat.type === "channel"
      ? { channel_post: { ...common, chat: this.chat } }
      : { message: { ...common, chat: this.chat, from: this.user } };
    const validated = this.env.validateUpdate(update);
    this.updates.push(validated);
    return this.env.sendUpdate(validated);
  }

  /** Send a command in the chat, optionally with a match. */
  command(cmd: string, match?: string) {
    const text = `/${cmd}${match ? ` ${match}` : ""}`;
    return this.sendMessage(text, {
      entities: [{
        type: "bot_command",
        offset: 0,
        length: cmd.length + 1,
      }],
    });
  }
}
