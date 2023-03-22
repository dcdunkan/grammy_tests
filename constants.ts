import { Types } from "./deps.ts";
import { BotCommands, BotDescriptions } from "./types.ts";

export const defaultBotAdministratorRights: Record<
  "groups" | "channels",
  Types.ChatAdministratorRights
> = {
  groups: {
    can_manage_chat: false,
    can_change_info: false,
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_promote_members: false,
    can_manage_video_chats: false,
    is_anonymous: false,
    can_pin_messages: false,
    can_manage_topics: false,
  },
  channels: {
    can_manage_chat: false,
    can_change_info: false,
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_promote_members: false,
    can_manage_video_chats: false,
    is_anonymous: false,
    can_pin_messages: false,
    can_manage_topics: false,
  },
};

export const defaultChatAdministratorRights: Types.ChatAdministratorRights = {
  is_anonymous: false,
  can_manage_video_chats: true,
  can_promote_members: true,
  can_invite_users: true,
  can_change_info: true,
  can_manage_chat: true,
  can_pin_messages: true,
  can_edit_messages: true,
  can_manage_topics: true,
  can_post_messages: true,
  can_delete_messages: true,
  can_restrict_members: true,
};

export const defaultChatPermissions: Types.ChatPermissions = {
  can_send_messages: true,
  can_send_polls: true,
  can_invite_users: true,
  can_change_info: true,
  can_send_audios: true,
  can_send_photos: true,
  can_send_videos: true,
  can_pin_messages: true,
  can_manage_topics: false,
  can_send_documents: true,
  can_send_video_notes: true,
  can_send_voice_notes: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
};

export const MenuButtonDefault: Types.MenuButton = { type: "default" };

export const BotCommandsDefault: BotCommands = {
  default: { "": [] },
  all_private_chats: { "": [] },
  all_group_chats: { "": [] },
  all_chat_administrators: { "": [] },
  chat: {},
  chat_member: {},
  chat_administrators: {},
};

export const BotDescriptionsDefault: BotDescriptions = {
  "": { description: "", short_description: "" },
};
