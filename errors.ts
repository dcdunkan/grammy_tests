/** List of API errors in the format: [HTTP status code, Error Message] */
export const ERRORS = {
  not_implemented: [501, "Not Implemented"],
  excluded_method: [
    501,
    "This method is not implemented and is excluded from \
implementing, most likely because its not worth it or does not \
make sense implementing it because it is related to setting up \
the bot and has no use in testing.",
  ],
  chat_not_found: [404, "Chat not found"],
  its_private_chat: [400, "Chat is a private chat"],
  its_not_private_chat: [400, "Chat is not a private chat"],
  its_group_chat: [400, "Chat is a group chat"],
  its_channel_chat: [400, "Chat is a channel chat"],
  chat_member_not_found: [404, "Chat member not found"],
  reply_to_message_not_found: [404, "Reply to message not found"],
} as const;
