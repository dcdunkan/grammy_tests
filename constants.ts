import { Types } from "./deps.ts";

export const defaultBotAdministratorRights = {
  groups: {
    "can_manage_chat": false,
    "can_change_info": false,
    "can_delete_messages": false,
    "can_invite_users": false,
    "can_restrict_members": false,
    "can_pin_messages": false,
    "can_manage_topics": false,
    "can_promote_members": false,
    "can_manage_video_chats": false,
    "is_anonymous": false,
  },
  channels: {
    "can_manage_chat": false,
    "can_change_info": false,
    "can_post_messages": false,
    "can_edit_messages": false,
    "can_delete_messages": false,
    "can_invite_users": false,
    "can_restrict_members": false,
    "can_promote_members": false,
    "can_manage_video_chats": false,
    "is_anonymous": false,
  },
};

export const MenuButtonDefault: Types.MenuButton = { type: "default" };

export const BotCommandsDefault = {
  default: { "": [] },
  all_private_chats: { "": [] },
  all_group_chats: { "": [] },
  all_chat_administrators: { "": [] },
  chat: {},
  chat_member: {},
  chat_administrators: {},
};
