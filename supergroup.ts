import { Bot, Context, Methods, Payload, RawApi, Types } from "./deps.ts";
import { Private } from "./private.ts";
import { Chats } from "./chats.ts";

type Member<C extends Context> =
  | Types.User
  | Types.ChatMember
  | Private<C>
  | Bot<C>;
type Admin<C extends Context> = Member<C> | Types.ChatMemberAdministrator;

function getMemberUser<C extends Context>(member: Member<C>) {
  return "botInfo" in member
    ? member.botInfo
    : "id" in member
    ? member
    : member.user;
}

function canBeAddedToGroup<C extends Context>(
  member: Member<C> | { admin: Admin<C>; appointedToBot: boolean },
) {
  member = "admin" in member ? member.admin : member;
  if ("botInfo" in member && !member.botInfo.can_join_groups) {
    throw new Error("Bot cannot be added to the group");
  }
  return true;
}

type SuperGroupMetaData = Omit<
  Types.Chat.SupergroupGetChat,
  "id" | "type" | "title" | "username" | "pinned_message"
>;

export interface SuperGroupDetails<C extends Context>
  extends Omit<Types.Chat.SupergroupChat, "type"> {
  creator: Private<C> | Types.ChatMemberOwner | Types.User;
  anonymousOwner?: boolean;
  admins?: (Admin<C> | { admin: Admin<C>; appointedToBot: boolean })[];
  members?: Member<C>[];
  permissions?: Types.ChatPermissions;
  // Permissions that are given to an administrator (except chat owner) when
  // creating the instance. Defaults to Official Telegram Desktop client add
  // administrator privileges.
  adminPermissions?: Omit<
    Types.ChatMemberAdministrator,
    "status" | "user" | "custom_title"
  >;
  pinnedMessages?: Types.Message[];
  metadata?: Partial<SuperGroupMetaData>;
}

export class Supergroup<C extends Context> {
  public readonly type = "supergroup";
  private bot: Bot<C>;
  public readonly creator: Types.ChatMemberOwner;
  public readonly members: Map<number, Types.ChatMember>;
  public readonly messages: Map<number, Types.Message>;

  // Group properties
  public _chat: Types.Chat.SupergroupChat;
  public readonly metadata: Partial<SuperGroupMetaData> = {};
  public permissions: Required<Types.ChatPermissions>;
  public readonly adminPermissions: Omit<
    Types.ChatMemberAdministrator,
    "status" | "user" | "custom_title"
  >;
  public readonly appointedAdmins: Set<number> = new Set();
  public pinned: Types.Message[];
  public readonly bannedSenderChats: Set<number> = new Set();
  public readonly inviteLinks: Map<string, Types.ChatInviteLink> = new Map();
  public readonly chatJoinRequests: Map<number, Types.ChatJoinRequest> =
    new Map();
  public message_id = 3;

  // Responses from the bot
  public responses: {
    method: Methods<RawApi>;
    payload: Payload<Methods<RawApi>, RawApi>;
  }[] = [];

  // Updates from the group
  public updates: Types.Update[] = [];

  constructor(environment: Chats<C>, details: SuperGroupDetails<C>) {
    if (details.creator === undefined) {
      throw new Error("Cannot create a supergroup without a creator.");
    }

    this.bot = environment.getBot();

    this._chat = {
      id: details.id,
      type: "supergroup",
      title: details.title,
      username: details.username,
    };

    this.metadata = details.metadata ?? {};
    this.pinned = details.pinnedMessages ?? [];
    this.messages = new Map(
      details.pinnedMessages?.map((m) => [m.message_id, m]),
    );

    this.permissions = {
      can_add_web_page_previews: true,
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
      can_send_media_messages: true,
      can_send_messages: true,
      can_send_other_messages: true,
      can_send_polls: true,
      ...details.permissions,
    };

    this.adminPermissions = {
      can_be_edited: false,
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_manage_chat: true,
      can_manage_video_chats: true,
      can_promote_members: false,
      can_restrict_members: true,
      is_anonymous: false,
      can_pin_messages: true,
      ...details.adminPermissions,
    };

    this.creator = "id" in details.creator
      ? {
        is_anonymous: !!details.anonymousOwner,
        status: "creator",
        user: details.creator,
      }
      : "status" in details.creator
      ? details.creator
      : {
        is_anonymous: !!details.anonymousOwner,
        status: "creator",
        user: details.creator.user,
      };

    this.members = new Map([[this.creator.user.id, this.creator]]);

    details.members?.filter(canBeAddedToGroup).map((m) => {
      const user = getMemberUser(m);
      if (this.members.has(user.id)) {
        return console.log("Duplicate user:", user.id, "(Skipped)");
      }
      return [user.id, { status: "member", user }];
    });

    details.admins?.filter((m) => {
      m = "admin" in m ? m.admin : m;
      const user = getMemberUser(m);
      if (this.members.has(user.id)) {
        console.log("Duplicate user:", user.id, "(Skipped)");
        return false;
      }
      return user.id === this.creator.user.id ? false : true;
    }).filter(canBeAddedToGroup).map((_m) => {
      const m = "admin" in _m ? _m.admin : _m;
      const user = getMemberUser(m);
      if ("admin" in _m && _m.appointedToBot) {
        this.appointedAdmins.add(user.id);
      }
      this.members.set(user.id, {
        user,
        status: "administrator",
        ...this.adminPermissions,
      });
    });

    this.bot.api.config.use(async (prev, method, payload, signal) => {
      return await prev(method, payload, signal);
    });
  }

  get chat(): Types.Chat.SupergroupChat {
    return this._chat;
  }

  getChat(): Types.Chat.SupergroupGetChat {
    return {
      id: this._chat.id,
      type: "supergroup",
      title: this._chat.title,
      pinned_message: this.pinned[this.pinned.length - 1],
      ...this.metadata,
    };
  }

  get count(): number {
    return this.members.size;
  }

  // actions that are executed by a user, but as for groups.
  addMembers(...members: Member<C>[]) {
    for (const m of members.filter(canBeAddedToGroup)) {
      const user = getMemberUser(m);
      if (!this.members.has(user.id)) {
        this.members.set(user.id, { status: "member", user });
      } else {
        console.warn("Skipping: Member already exists.", user);
      }
    }
  }

  removeMembers(...members: Member<C>[]) {
    for (const m of members) {
      const user = getMemberUser(m);
      if (this.members.has(user.id)) {
        this.members.delete(user.id);
      } else {
        console.error("Skipping: Member does not exists.", user);
      }
    }
  }
}

// restrictMembers(...members: (Member<C> | number)[]) {}
// banMembers(...members: (Member<C> | number)[]) {}
// unbanMembers(...members: (Member<C> | number)[]) {}

// check if the user is appointed by the bot, so the
// admins can be edited by the bot.
// promote() {}
// addAdmins(...admins: Member<C>[]) {}
// demote() {}

// Do things as anonymous admin
// sendMessage
