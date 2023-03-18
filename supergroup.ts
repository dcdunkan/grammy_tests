import { Bot, Context, Types } from "./deps.ts";
import type { Chats } from "./chats.ts";
import { defaultChatPermissions } from "./constants.ts";

type DetailsExceptObvious = Omit<Types.Chat.SupergroupChat, "type">;
type DetailsFromGetChat = Omit<
  Types.Chat.SupergroupGetChat,
  keyof Types.Chat.SupergroupChat | "pinned_message"
>;

export interface SupergroupChatDetails extends DetailsExceptObvious {
  creator: Types.ChatMemberOwner;
  administrators?: Types.ChatMemberAdministrator[];
  members?: (Types.ChatMemberMember | Types.ChatMemberRestricted)[];
  banned?: Types.ChatMemberBanned[];
  pinnedMessages?: Types.Message[];
  additional?: DetailsFromGetChat;
  chatMenuButton?: Types.MenuButton;
}

export class SupergroupChat<C extends Context> {
  readonly type = "supergroup";
  chat_id: number;
  chat: Types.Chat.SupergroupChat;

  #bot: Bot<C>;

  chatMenuButton: Types.MenuButton;

  // Supergroup Related
  creator: Types.ChatMemberOwner;
  administrators: Map<Types.User["id"], Types.ChatMemberAdministrator> =
    new Map();
  members: Map<
    Types.User["id"],
    (Types.ChatMemberMember | Types.ChatMemberRestricted)
  > = new Map();
  banned: Map<Types.User["id"], Types.ChatMemberBanned> = new Map();
  pinnedMessages: Types.Message[];
  permissions: Types.ChatPermissions;

  messages: Map<Types.MessageId["message_id"], Types.Message> = new Map();

  constructor(private env: Chats<C>, public details: SupergroupChatDetails) {
    this.#bot = env.getBot();

    this.creator = details.creator;
    details.administrators?.map((m) => this.administrators.set(m.user.id, m));
    details.members?.map((m) => this.members.set(m.user.id, m));
    details.banned?.map((m) => this.banned.set(m.user.id, m));
    this.pinnedMessages = details.pinnedMessages ?? [];

    this.chat_id = details.id;
    this.chat = {
      id: details.id,
      type: "supergroup",
      title: details.title,
      is_forum: details.is_forum,
      username: details.username,
    };

    this.chatMenuButton = details.chatMenuButton ??
      env.defaultChatMenuButton;

    this.permissions = details.additional?.permissions ??
      defaultChatPermissions;
  }

  getChat(): Types.Chat.SupergroupGetChat {
    return {
      ...this.chat,
      ...this.details.additional,
      pinned_message: this.pinnedMessages.at(-1),
    };
  }
}
