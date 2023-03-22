import type { Bot, Context, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";
import type { MessageId, UserId } from "./types.ts";

type DetailsExceptObvious = Omit<Types.Chat.GroupChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.GroupGetChat,
  keyof Types.Chat.GroupChat | "pinned_message"
>;

export interface GroupChatDetails extends DetailsExceptObvious {
  owner: UserId | Types.ChatMemberOwner;
  members?: (UserId | Types.ChatMember)[];

  pinnedMessages?: Types.Message[];
  additional?: DetailsFromGetChat;
  chatMenuButton?: Types.MenuButton;
}

// TODO: Validate if members are added as admins.
export class GroupChat<C extends Context> {
  readonly type = "group";
  isBotAMember = false;

  chat_id: number;
  chat: Types.Chat.GroupChat;

  #bot: Bot<C>;
  #env: Chats<C>;

  // Group related
  owner?: UserId;
  members = new Map<UserId, Types.ChatMember>();

  pinnedMessages = new Set<MessageId>();
  recentPinnedMessage?: MessageId;
  messages = new Map<MessageId, Types.Message>();

  chatMenuButton: Types.MenuButton;

  constructor(env: Chats<C>, public details: GroupChatDetails) {
    this.#env = env;
    this.#bot = env.getBot();

    // Chat Info
    this.chat_id = details.id;
    this.chat = {
      type: "group",
      id: details.id,
      title: details.title,
    };

    // Members
    if (typeof details.owner === "number") {
      const chat = env.chats.get(details.owner);
      if (chat === undefined || chat.type !== "private") {
        throw new Error("Cannot create a group without a user owner.");
      }
      this.owner = details.owner;
      this.members.set(this.owner, {
        status: "creator",
        user: chat.user,
        is_anonymous: false,
      });
    } else {
      this.owner = details.owner.user.id;
      this.members.set(this.owner, details.owner);
    }

    if (this.owner === this.#bot.botInfo.id) {
      throw new Error("You cannot add bot as owner of the group");
    }

    details.members?.map((member) => {
      if (typeof member === "number") {
        if (member === this.owner) {
          throw new Error(
            "DO NOT add creator/owner of the group through members. Use `owner` instead.",
          );
        }
        const chat = env.chats.get(member);
        if (chat === undefined || chat.type !== "private") return; // TODO: throw error?
        this.members.set(member, { status: "member", user: chat.user });
      } else {
        if (member.status === "creator") {
          throw new Error(
            "DO NOT add creator/owner of the group through members. Use `owner` instead.",
          );
        }
        this.members.set(member.user.id, member);
      }
    });

    if (this.members.has(this.#bot.botInfo.id)) {
      this.isBotAMember = true;
    }

    // Messages
    details.pinnedMessages?.map((message) => {
      if (this.pinnedMessages.has(message.message_id)) {
        throw new Error("Message was already pinned");
      }
      this.messages.set(message.message_id, message);
      this.pinnedMessages.add(message.message_id);
    });

    this.recentPinnedMessage = details.pinnedMessages?.at(-1)?.message_id;

    // Other
    this.chatMenuButton = details.chatMenuButton ?? env.defaultChatMenuButton;
  }

  getChat(): Types.Chat.GroupGetChat {
    return {
      ...this.chat,
      ...this.details.additional,
      ...(this.recentPinnedMessage &&
          this.messages.has(this.recentPinnedMessage)
        ? { pinned_message: this.messages.get(this.recentPinnedMessage) }
        : {}),
    };
  }

  getChatMember(userId: UserId): Types.ChatMember | { status: "not-found" } {
    const member = this.members.get(userId);
    if (member === undefined) return { status: "not-found" };
    if (member.status === "kicked") {
      return member.until_date < this.#env.date
        ? { status: "left", user: member.user }
        : member;
    }
    if (member.status === "restricted") {
      return member.until_date < this.#env.date
        ? member.is_member
          ? { status: "member", user: member.user }
          : { status: "left", user: member.user }
        : member;
    }
    return member;
  }
}
