import type { Bot, Context, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";
import type { MessageId, UserId } from "./types.ts";
import { defaultChatAdministratorRights } from "./constants.ts";

type DetailsExceptObvious = Omit<Types.Chat.ChannelChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.ChannelGetChat,
  keyof Types.Chat.ChannelChat | "pinned_message"
>;

export interface ChannelChatDetails extends DetailsExceptObvious {
  owner: UserId | Types.ChatMemberOwner;
  administrators?: (UserId | Types.ChatMemberAdministrator)[];
  promotedByBot?: boolean;
  members?: (UserId | Types.ChatMember)[];

  pinnedMessages?: Types.Message[];
  additional?: DetailsFromGetChat;
  administratorRights?: Types.ChatAdministratorRights;
}

export class ChannelChat<C extends Context> {
  readonly type = "channel";
  isBotAMember = false;

  chat_id: number;
  chat: Types.Chat.ChannelChat;

  #bot: Bot<C>;
  #env: Chats<C>;

  // Channel Related
  owner?: UserId;
  members = new Map<UserId, Types.ChatMember>();

  pinnedMessages = new Set<MessageId>();
  recentPinnedMessage?: MessageId;
  messages = new Map<MessageId, Types.Message>();

  administratorRights: Types.ChatAdministratorRights;

  constructor(env: Chats<C>, public details: ChannelChatDetails) {
    this.#env = env;
    this.#bot = env.getBot();

    // Chat Info
    this.chat_id = details.id;
    this.chat = {
      id: details.id,
      type: "channel",
      title: details.title,
      username: details.username,
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

    // TODO: WARN: Overwrites existing members.
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

    this.administratorRights = details.administratorRights ??
      defaultChatAdministratorRights;

    // TODO: WARN: Overwrites existing member.
    details.administrators?.map((member) => {
      if (typeof member === "number") {
        if (member === this.#bot.botInfo.id) {
          this.members.set(member, {
            status: "administrator",
            user: {
              id: this.#bot.botInfo.id,
              is_bot: true,
              username: this.#bot.botInfo.username,
              first_name: this.#bot.botInfo.first_name,
              last_name: this.#bot.botInfo.last_name,
            },
            can_be_edited: false,
            ...env.myDefaultAdministratorRights.groups,
          });
        } else {
          const chat = env.chats.get(member);
          if (chat === undefined || chat.type !== "private") return; // TODO: throw error?
          this.members.set(member, {
            status: "administrator",
            user: chat.user,
            can_be_edited: !!details.promotedByBot,
            ...this.administratorRights,
          });
        }
      } else {
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
  }

  getChat(): Types.Chat.ChannelGetChat {
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
