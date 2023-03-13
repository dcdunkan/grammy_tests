/**
 * List of methods currently (Bot API 6.5) available in Telegram Bot API
 * categorized into several sections for ease of implementation.
 */
export const METHODS = {
  /**
   * Methods that have no relation with how the bot responds. In other words,
   * methods that are more related to the setup of the bot rather than its
   * functionality. And implementing them is a waste of time cuz it makes no sense.
   */
  excluded: [
    "getUpdates",
    "setWebhook",
    "getWebhookInfo",
    "deleteWebhook",
    "logOut",
    "close",
  ],
  /**
   * Methods that don't necessarily need a chat to work -- More related to bot.
   */
  bot: [
    "getMe",
    "getFile",
    "setMyCommands",
    "deleteMyCommands",
    "getMyCommands",
    "setChatMenuButton",
    "getChatMenuButton",
    "setMyDefaultAdministratorRights",
    "getMyDefaultAdministratorRights",
  ],
  /** Standalone methods related to stickers. */
  sticker: [
    "getStickerSet",
    "getCustomEmojiStickers",
    "uploadStickerFile",
    "createNewStickerSet",
    "addStickerToSet",
    "setStickerPositionInSet",
    "deleteStickerFromSet",
    "setStickerSetThumb",
  ],
  /**
   * Methods related to messaging and managing the messages. Chats are required
   * for calling these methods as they are bound to a specific chat.
   */
  message: [
    "sendMessage",
    "forwardMessage",
    "copyMessage",
    "sendPhoto",
    "sendAudio",
    "sendDocument",
    "sendVideo",
    "sendAnimation",
    "sendVoice",
    "sendVideoNote",
    "sendMediaGroup",
    "sendLocation",
    "editMessageLiveLocation",
    "stopMessageLiveLocation",
    "sendVenue",
    "sendContact",
    "sendPoll",
    "sendDice",
    "sendChatAction",
    "sendSticker",
    "editMessageText",
    "editMessageCaption",
    "editMessageMedia",
    "editMessageReplyMarkup",
    "stopPoll",
    "deleteMessage",
  ],
  /** Methods for managing chats */
  chat: [
    "banChatMember",
    "unbanChatMember",
    "restrictChatMember",
    "promoteChatMember",
    "setChatAdministratorCustomTitle",
    "banChatSenderChat",
    "unbanChatSenderChat",
    "setChatPermissions",
    "exportChatInviteLink",
    "createChatInviteLink",
    "editChatInviteLink",
    "revokeChatInviteLink",
    "approveChatJoinRequest",
    "declineChatJoinRequest",
    "setChatPhoto",
    "deleteChatPhoto",
    "setChatTitle",
    "setChatDescription",
    "pinChatMessage",
    "unpinChatMessage",
    "unpinAllChatMessages",
    "leaveChat",
    "getChat",
    "getChatAdministrators",
    "getChatMemberCount",
    "getChatMember",
    "setChatStickerSet",
    "deleteChatStickerSet",
    "getUserProfilePhotos",
  ],
  /** Methods related to forums */
  forum: [
    "getForumTopicIconStickers",
    "createForumTopic",
    "editForumTopic",
    "closeForumTopic",
    "reopenForumTopic",
    "deleteForumTopic",
    "unpinAllForumTopicMessages",
    "editGeneralForumTopic",
    "closeGeneralForumTopic",
    "reopenGeneralForumTopic",
    "hideGeneralForumTopic",
    "unhideGeneralForumTopic",
  ],
  /** Some unclassified methods (may be classified later) */
  other: [
    "answerCallbackQuery",
    "answerInlineQuery",
    "answerWebAppQuery",
  ],
  /** Methods related to payments */
  payments: [
    "sendInvoice",
    "createInvoiceLink",
    "answerShippingQuery",
    "answerPreCheckoutQuery",
  ],
  /** Methods related to passports */
  passport: [
    "setPassportDataErrors",
  ],
  /** Methods relates to games */
  games: [
    "sendGame",
    "setGameScore",
    "getGameHighScores",
  ],
} as const;
