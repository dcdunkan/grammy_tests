import { Bot, Context, debug, RawApi, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";
import { date } from "./helpers.ts";
import { GroupChat } from "./group.ts";
import { SupergroupChat } from "./supergroup.ts";
import { ChannelChat } from "./channel.ts";

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

type InteractableChats =
  | Types.Chat.GroupChat
  | Types.Chat.SupergroupChat
  | Types.Chat.ChannelChat;

type InteractableChatTypes<C extends Context> =
  | GroupChat<C>
  | SupergroupChat<C>
  | ChannelChat<C>;

type ApiResponse = {
  method: keyof RawApi;
  payload?: unknown;
};

export class PrivateChat<C extends Context> {
  readonly type = "private";
  chat_id: Types.Chat["id"];
  userChat: Types.Chat.PrivateChat;
  chat: Types.Chat.PrivateChat | InteractableChats;
  user: Types.User;
  ownerOf: Set<Types.Chat["id"]> = new Set();

  private bot: Bot<C>;

  chatMenuButton: Types.MenuButton;

  // Private chat related
  pinnedMessages: Types.Message[];

  private d: ReturnType<typeof debug>;

  /** Updates sent by the user to the bot */
  private updates: Types.Update[] = [];
  private responses: ApiResponse[] = [];

  message_id = 1;

  get messageId() {
    return this.message_id++;
  }

  constructor(private env: Chats<C>, public details: PrivateChatDetails) {
    this.bot = env.getBot();

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

    this.bot.api.config.use((prev, method, payload, signal) => {
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

  join(chatId: number) {
    const chat = this.env.chats.get(chatId);
    if (chat === undefined) {
      throw new Error(`Chat ${chatId} not found for ${this.user.id} to join.`);
    }
    if (chat.type === "private") {
      throw new Error(
        `\
Chat ${chatId} is a private chat. Send a direct message to that chat. \
It does not make sense for a private chat to "join" another private chat.`,
      );
    }

    if (chat.creator.user.id === this.user.id) {
      this.d(`user is the creator lol`);
      return true;
    }

    if (chat.members.has(this.user.id)) {
      this.d(`Already a member of the chat ${chatId}`);
      return true;
    }

    if (chat.banned.has(this.user.id)) {
      const { until_date } = chat.banned.get(this.user.id)!;
      this.d(
        `user is banned at ${chatId}${
          until_date === 0
            ? " FOREVER!"
            : ` until ${until_date} (${new Date(until_date)})`
        }`,
      );
      return false;
    }

    chat.members.set(this.user.id, { user: this.user, status: "member" });
    this.d(`Joined the ${chat.type} "${chat.chat.title}" (${chatId})`);
    return true;
  }

  leave(chatId: number) {
    const chat = this.env.chats.get(chatId);
    if (chat === undefined) {
      throw new Error(`Chat ${chatId} not found for ${this.user.id} to leave.`);
    }

    if (chat.type === "private") {
      throw new Error(
        `\
${chatId} is a private chat. It doesn't make sense to leave a private chat.
Either block the user or the delete the chat history with the user.`,
      );
    }

    if (chat.creator.user.id === this.user.id) {
      this.d(`user is the creator. beware of the action!`);
      return true;
    }

    if (!chat.members.has(this.user.id)) {
      this.d(`Wasn't a member of the chat ${chatId} anyway.`);
      return true;
    }

    if (chat.banned.has(this.user.id)) {
      const { until_date: u } = chat.banned.get(this.user.id)!;
      this.d(
        `can't join. user is banned${u === 0 ? " forever" : ` until ${u}`}`,
      );
      return true; // well, it is technically "leaving".
    }

    chat.members.delete(this.user.id);
    this.d(`Left the chat ${chat.chat.title} (${chatId})`);
    return true;
  }

  sendMessage(text: string) {
    // TODO: check if the user is banned/restricted in groups
    if (this.chat.type === "channel") {
      const chat = this.env.chats.get(this.chat.id);
      if (!chat) throw new Error("Channel not found");
      if (chat.type !== "channel") {
        throw new Error("Weird case, its not a channel");
      }
      const isCreator = chat.creator.user.id === this.user.id;
      const isAdmin = chat.administrators.has(this.user.id);
      if (!isCreator && !isAdmin) {
        throw new Error(
          "Can't post in channel because the user is neither the creator or an admin.",
        );
      }
    } else if (this.chat.type === "supergroup") {
      const chat = this.env.chats.get(this.chat.id);
      if (!chat) throw new Error("Chat not found");
      if (chat.type !== "supergroup") {
        throw new Error("Weird, its not a supergroup");
      }
      const isCreator = chat.creator.user.id === this.user.id;
      const member = chat.members.get(this.user.id);
      const admin = chat.administrators.has(this.user.id);
      if (!isCreator && !admin) {
        if (!member) throw new Error("Not even a member");
        if (member.status === "restricted") {
          if (!member.can_send_messages) {
            if (member.until_date === 0) {
              throw new Error("user is restricted to send messages forever");
            } else {
              if (member.until_date > Date.now()) {
                throw new Error(
                  `user is restricted to send messages until ${member.until_date}`,
                );
              } else {
                chat.members.delete(this.user.id); // remove "restricted"
                chat.members.set(this.user.id, {
                  status: "member",
                  user: this.user,
                });
              }
            }
          }
        }
      }
    }
    const common = { message_id: this.messageId, date: date(), text };
    const update: Omit<Types.Update, "update_id"> = this.chat.type === "channel"
      ? { channel_post: { ...common, chat: this.chat } }
      : { message: { ...common, chat: this.chat, from: this.user } };
    const validated = this.env.validateUpdate(update);
    this.updates.push(validated);
    return this.env.sendUpdate(validated);
  }

  in(chat: InteractableChatTypes<C>) {
    return new PrivateChat(this.env, {
      ...this.details,
      chat: chat.chat,
      chatMenuButton: undefined,
      pinnedMessages: undefined,
      additional: undefined,
    });
  }
}
