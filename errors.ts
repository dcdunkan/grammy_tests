/** List of API errors in the format: [HTTP status code, Error Message] */
export const ERRORS = {
  chat_not_found: [404, "Chat not found"],
  its_a_channel: [400, "Chat is a channel"],
  not_implemented: [501, "Not Implemented"],
  reply_to_message_not_found: [404, "Reply to message not found"],
} as const;
