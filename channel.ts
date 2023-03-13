import type { Bot, Context, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";

type DetailsExceptObvious = Omit<Types.Chat.ChannelChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.ChannelGetChat,
  keyof Types.Chat.ChannelChat | "pinned_message"
>;

export interface ChannelChatDetails extends DetailsExceptObvious {
  creator: Types.ChatMemberOwner;
  administrators?: Types.ChatMemberAdministrator[];
  members?: (Types.ChatMemberMember | Types.ChatMemberRestricted)[];
  banned?: Types.ChatMemberBanned[];
  pinnedPosts?: Types.Message[];
  additional?: DetailsFromGetChat;
}

export class ChannelChat<C extends Context> {
  readonly type = "channel";
  chat_id: number;
  chat: Types.Chat.ChannelChat;

  private bot: Bot<C>;

  // Channel Related
  creator: Types.ChatMemberOwner;
  administrators: Map<Types.User["id"], Types.ChatMemberAdministrator> =
    new Map();
  members: Map<
    Types.User["id"],
    (Types.ChatMemberMember | Types.ChatMemberRestricted)
  > = new Map();
  banned: Map<Types.User["id"], Types.ChatMemberBanned> = new Map();
  pinnedPosts: Types.Message[];

  constructor(private env: Chats<C>, public details: ChannelChatDetails) {
    this.bot = env.getBot();

    this.creator = details.creator;
    details.administrators?.map((m) => this.administrators.set(m.user.id, m));
    details.members?.map((m) => this.members.set(m.user.id, m));
    details.banned?.map((m) => this.banned.set(m.user.id, m));
    this.pinnedPosts = details.pinnedPosts ?? [];

    this.chat_id = details.id;
    this.chat = {
      id: details.id,
      type: "channel",
      title: details.title,
      username: details.username,
    };
  }

  getChat(): Types.Chat.ChannelGetChat {
    return {
      ...this.chat,
      ...this.details.additional,
      pinned_message: this.pinnedPosts.at(-1),
    };
  }
}
