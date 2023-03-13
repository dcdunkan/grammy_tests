import type { Bot, Context, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";

type DetailsExceptObvious = Omit<Types.Chat.GroupChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.GroupGetChat,
  keyof Types.Chat.GroupChat | "pinned_message"
>;

export interface GroupChatDetails extends DetailsExceptObvious {
  creator: Types.ChatMemberOwner;
  members?: (Types.ChatMemberMember | Types.ChatMemberRestricted)[];
  banned?: Types.ChatMemberBanned[];
  pinnedMessages?: Types.Message[];
  additional?: DetailsFromGetChat;
  chatMenuButton?: Types.MenuButton;
}

export class GroupChat<C extends Context> {
  readonly type = "group";
  chat_id: number;
  chat: Types.Chat.GroupChat;

  private bot: Bot<C>;

  chatMenuButton: Types.MenuButton;

  // Group related
  creator: Types.ChatMemberOwner;
  members: Map<
    Types.User["id"],
    (Types.ChatMemberMember | Types.ChatMemberRestricted)
  > = new Map();
  banned: Map<Types.User["id"], Types.ChatMemberBanned> = new Map();
  pinnedMessages: Types.Message[];

  constructor(private env: Chats<C>, public details: GroupChatDetails) {
    this.bot = env.getBot();

    this.creator = details.creator;
    details.members?.map((m) => this.members.set(m.user.id, m));
    details.banned?.map((m) => this.banned.set(m.user.id, m));
    this.pinnedMessages = details.pinnedMessages ?? [];

    this.chat_id = details.id;
    this.chat = {
      type: "group",
      id: details.id,
      title: details.title,
    };

    this.chatMenuButton = details.chatMenuButton ?? env.defaultChatMenuButton;
  }

  getChat(): Types.Chat.GroupGetChat {
    return {
      ...this.chat,
      ...this.details.additional,
      pinned_message: this.pinnedMessages.at(-1),
    };
  }
}
