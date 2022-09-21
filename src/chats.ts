/*
                                     TODO
- Register transformer middlewares in groups to check for until_date in banned
  people, expiry of invite links, etc.
- Payload (type) validation, and proper error strings. (are dates in future?)
- Only listen for allowed_updates. (needs duplication probably)
- Send responses of events occurred to users such as, chat_member updates.
- Sync chat invite links through out the environment and allow users to join
  via the link.
- Refine User type, because it sucks.
*/

import {
  ApiCallResult,
  Bot,
  Context,
  Methods,
  Payload,
  RawApi,
  Types,
} from "./deps.ts";
import { TestUser } from "./chat_types/user.ts";
import { Supergroup } from "./chat_types/supergroup.ts";
import { apiError } from "./errors.ts";

// Set of helper functions to generate random and fake values for
// properties related to Telegram Bot API.
export const rand = {
  str: (length: number) =>
    [...Array(length)].map(() =>
      Math.random().toString(36)[2]
        [Math.random() > 0.5 ? "toUpperCase" : "toLowerCase"]()
    ).join(""), // 2L6W4LLpM74ed5kURcdzv26B18yYfayAlokuI5tXw2d8U908B2QE8IPkfvN27mo7
  str2: (length: number) => {
    const pos = [ // where to inject special characters
      Math.floor(length / 2),
      Math.floor(length / 4),
      Math.floor(length * 3 / 4),
    ];
    const index = Math.floor(Math.random() * pos.length);
    const consecutive = () => length > 5 && Math.random() > 0.5; // f-1__3 -> 5
    const mixed = length > 5 && Math.random() > 0.5;
    const first = ["_", "-"][Math.floor(Math.random() * 2)];
    const second = first === "_" ? "-" : "_";
    return `${rand.str(pos[index])}${consecutive() ? first + first : first}${
      mixed
        ? `${rand.str(Math.ceil((length - pos[index] - 2) / 2))}${
          consecutive() ? second + second : second
        }${rand.str(Math.ceil(((length - pos[index] - 2) / 2) - 2))}`
        : rand.str(Math.ceil(length - pos[index] - 2))
    }`;
  }, // 9EPKVvfasdVi0515xRcGpq2K93Ig1pP_0n6iheT1L2YaZPl--jFXck2ili6tTE
  botId: () => Math.floor(1000000000 + Math.random() * 9000000000), // 1057194841
  inviteHash: () => `${rand.str(5)}_${rand.str(10)}`, // X56WG_2KjQ3V7B96
  inviteLink: (origin = "https://t.me/+") => `${origin}${rand.inviteHash()}`, // https://t.me/+X56WG_2KjQ3V7B96
  // fileId: () => `${rand.str(32)}____${rand.str(14)}`, // AQADAgADsrMxG5tawUsACAIAA_KZU9IW____IaoMt1MFRGMpBA
  fileId: () => {
    const lengths = [50, 64, 72];
    const length = lengths[Math.floor(Math.random() * lengths.length)];
    const str = `${rand.str2(length)}`;
    return str.slice(0, 4).toUpperCase() + str.substring(5);
  }, // AQADAgADsrMxG5tawUsACAIAA_KZU9IW____IaoMt1MFRGMpBA
  fileUniqueId: () => rand.str(16), // AQADsrMxG5tawUsAAQ
};

// Regexps used for validation of field values.
const regex = {
  containsEmoji: /\p{Extended_Pictographic}/u, // TODO: Improve regex into covering all emojis.
};

const adminPermissions = {
  supergroup: [
    "can_change_info",
    "can_delete_messages",
    "can_invite_users",
    "can_manage_chat",
    "can_manage_video_chats",
    "can_pin_messages",
    "can_promote_members",
    "can_restrict_members",
    "is_anonymous",
  ],
} as const;

// Uniqueness and randomness matter!
const randomsUsed: Set<unknown> = new Set();
function unique<T>(generateFn: () => T) {
  let random = generateFn();
  while (randomsUsed.has(random)) random = generateFn();
  return random;
}

type ApiPayload<M extends Methods<RawApi>> = Payload<M, RawApi>;
type ApiResult<M extends Methods<RawApi>> = Types.ApiSuccess<
  ApiCallResult<M, RawApi>
>;
function apiResult<M extends Methods<RawApi>>(result: unknown) {
  return Promise.resolve({ ok: true, result }) as Promise<ApiResult<M>>;
}

type ChatType<C extends Context> =
  | TestUser<C>
  | Supergroup<C>;

function resolveUsername<C extends Context>(
  chats: Map<number, ChatType<C>>,
  username: string,
) {
  for (const [id, chat] of chats) {
    if (chat.chat.username === username) {
      return id;
    }
  }
}

export class Chats<C extends Context = Context> {
  // Chats registered in the environment
  private chats: Map<number, ChatType<C>> = new Map();

  constructor(private bot: Bot<C>, botInfo?: Types.UserFromGetMe) {
    this.bot.botInfo = botInfo ?? {
      id: rand.botId(),
      first_name: "Test Bot",
      is_bot: true,
      username: "test_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };

    this.bot.api.config.use(async (prev, method, payload, signal) => {
      // Methods that is related to a specific chat.
      if ("chat_id" in payload && payload.chat_id !== undefined) {
        const chatId = typeof payload.chat_id === "string" &&
            payload.chat_id.startsWith("@")
          ? resolveUsername(this.chats, payload.chat_id.substring(1))
          : typeof payload.chat_id === "number"
          ? payload.chat_id
          : undefined;

        if (chatId === undefined) {
          return apiError("CHAT_NOT_FOUND");
        }
        const chat = this.chats.get(chatId);
        if (chat === undefined) {
          return apiError("CHAT_NOT_FOUND");
        }

        const bot = chat.type === "supergroup"
          ? chat.members.get(this.bot.botInfo.id)
          : chat.type === "private"
          ? undefined // TODO
          : undefined;

        if (bot === undefined) return apiError("CHAT_NOT_FOUND");

        switch (method) {
          // Methods that a bot can call without being an admin
          case "sendMessage": {
            const p = payload as ApiPayload<"sendMessage">;
            if (chat.type === "supergroup") {
              if (bot.status === "kicked" || bot.status === "left") {
                return apiError("CHAT_NOT_FOUND");
              }
              if (bot.status === "restricted") {
                if (!bot.is_member) {
                  return apiError("CHAT_NOT_FOUND");
                }
                if (!bot.can_send_messages) {
                  return apiError("BAD_REQUEST", "not enough permissions");
                }
              }
            }

            chat.message_id++;
            chat.messages.set(chat.message_id, {
              chat: chat.chat,
              from: this.bot.botInfo,
              date: date(),
              message_id: chat.message_id,
              text: p.text,
              entities: p.entities,
              // reply_markup: p.reply_markup,
            });
            return apiResult(true);
          }
          case "forwardMessage":
          case "sendPhoto":
          case "sendAudio":
          case "sendDocument":
          case "sendVideo":
          case "sendAnimation":
          case "sendVoice":
          case "sendVideoNote":
          case "sendMediaGroup":
          case "sendLocation":
          case "editMessageLiveLocation":
          case "stopMessageLiveLocation":
          case "sendVenue":
          case "sendContact":
          case "sendPoll":
          case "sendDice":
          case "sendChatAction":
          case "getUserProfilePhotos":
          case "getFile":
            break;

            // Administrator

          case "banChatMember": {
            // INCOMPLETE
            // + permissions checked
            // - implement revoke_messages
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"banChatMember">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to ban a member",
              );
            }
            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            if (p.user_id === chat.creator.user.id) {
              return apiError("BAD_REQUEST", "Cannot ban chat creator");
            }
            const member = chat.members.get(p.user_id);
            if (member === undefined) {
              return apiError(
                "BAD_REQUEST",
                "User is not a member of the chat",
              );
            }
            if (member.status === "kicked") {
              return apiError("BAD_REQUEST", "User is already banned");
            }
            chat.members.set(p.user_id, {
              status: "kicked",
              user: member.user,
              until_date: p.until_date ?? 0,
            });
            return apiResult(true);
          }

          case "unbanChatMember": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"unbanChatMember">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to ban a member",
              );
            }

            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            if (p.user_id === chat.creator.user.id) {
              return apiError("BAD_REQUEST", "Cannot ban chat creator");
            }

            if (p.user_id === chat.creator.user.id) {
              return apiError(
                "BAD_REQUEST",
                "Cannot ban or unban chat creator",
              );
            }

            const member = chat.members.get(p.user_id);
            if (member === undefined) {
              return apiError(
                "BAD_REQUEST",
                "User is not a member of the chat",
              );
            }

            // Unban the user if they are banned.
            if (member.status === "kicked") {
              // #TEST: Check whether if the status changes like this or not in Telegram
              chat.members.set(p.user_id, {
                status: "left",
                user: member.user,
              });
              return apiResult(true);
            }

            if (p.only_if_banned) return apiResult(true);

            // So if the user is a member of the chat they will also be removed from the chat.
            // https://core.telegram.org/bots/api#unbanchatmember
            chat.members.delete(p.user_id);
            return apiResult(true);
          }

          case "restrictChatMember": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"restrictChatMember">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to ban a member",
              );
            }
            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            if (p.user_id === chat.creator.user.id) {
              return apiError("BAD_REQUEST", "Cannot restrict chat creator");
            }

            const member = chat.members.get(p.user_id);
            if (member === undefined) {
              return apiError(
                "BAD_REQUEST",
                "User is not a member of the chat",
              );
            }

            if (member.status === "restricted") {
              const nonRestrictedUser = { ...member, ...chat.permissions };
              const updatedRestrictedUser = { ...member, ...p.permissions };
              chat.members.set(
                p.user_id,
                // Lifting all restrictions from user. Or, switch back to the
                // same restrictions that is applied all in the supergroup.
                objectEquals(nonRestrictedUser, updatedRestrictedUser)
                  ? { status: "member", user: member.user }
                  : updatedRestrictedUser,
              );
              return apiResult(true);
            }

            chat.members.set(p.user_id, {
              status: "restricted",
              user: member.user,
              until_date: p.until_date ?? 0,
              is_member: true,
              ...chat.permissions,
              ...p.permissions,
            });
            return apiResult(true);
          }

          // TODO: Make sure the abstraction works.

          case "promoteChatMember": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"promoteChatMember">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_promote_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions promote a chat member",
              );
            }
            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            if (p.user_id === chat.creator.user.id) {
              return apiError(
                "BAD_REQUEST",
                "Cannot promote/demote chat creator",
              );
            }
            const member = chat.members.get(p.user_id);
            if (member === undefined) {
              return apiError(
                "BAD_REQUEST",
                "User is not a member of the chat",
              );
            }
            const memberIsAdmin = member.status === "administrator";

            // Administrator can add new administrators with a subset of their own
            // privileges or demote administrators that he has promoted, directly
            // or indirectly (promoted by administrators that were appointed by him)
            // https://core.telegram.org/bots/api#promotechatmember
            if (memberIsAdmin && !chat.appointedAdmins.has(p.user_id)) {
              return apiError(
                "BAD_REQUEST",
                "Administrator is not appointed to the bot",
              );
            }

            // CASE 1: USER IS ALREADY AN ADMINISTRATOR
            // If the user is already an admin, get current true permissions for the admin.
            // If every permission of that is set to false in the payload, completely
            // demote and make him a normal "member".
            // If the permissions are not set to false, get the updated list of permissions
            // and cross-check whether the bot can apply them to the admin. If it does,
            // promote the user with the updated permissions list. And if not, throw error.

            // CASE 2: USER IS NOT AN ADMINISTRATOR
            // If the user is not an admin, make sure that bot can give them the list of
            // permissions specified in the payload. If not, throw. If yes, apply.

            // Make updated and full list of admin privileges for that user.
            const adminPermissionsInChat = adminPermissions[chat.type];
            const updatedPermissions = Object.fromEntries(
              adminPermissionsInChat.map((permission) => {
                const value = p[permission] ?? // Permission in payload
                  // If that permission wasn't provided, then check
                  // current permissions, if that user is already an admin.
                  (memberIsAdmin
                    ? member[permission] ?? false // Could be empty somehow. So, falsify.
                    // If nothings anywhere, they have no permission to do that.
                    : false); // #CHECK is it really false, it has to be.
                return [permission, value];
              }),
            ) as { [k in typeof adminPermissionsInChat[number]]: boolean };

            for (const permission of adminPermissionsInChat) {
              if (
                updatedPermissions[permission] === true &&
                bot[permission] !== true
              ) {
                return apiError(
                  "BAD_REQUEST",
                  `Bot cannot give/change ${permission} permission of the user.`,
                );
              }
            }

            if (
              adminPermissionsInChat.every((p) =>
                updatedPermissions[p] === false
              )
            ) {
              if (memberIsAdmin) {
                chat.members.set(p.user_id, {
                  status: "member",
                  user: member.user,
                });
                chat.appointedAdmins.delete(p.user_id);
                return apiResult(true);
              }
              // #CHECK error or just do nothing?
              return apiError(
                "BAD_REQUEST",
                "Passed false for every permissions but user wasn't an admin before",
              );
            }
            chat.members.set(p.user_id, {
              status: "administrator",
              user: member.user,
              can_be_edited: true, // true, because its the bot who promotes the user.
              ...(memberIsAdmin && member.custom_title !== undefined
                ? { custom_title: member.custom_title }
                : {}),
              ...updatedPermissions,
            });
            chat.appointedAdmins.add(p.user_id);
            return apiResult(true);
          }

          case "setChatAdministratorCustomTitle": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<
              "setChatAdministratorCustomTitle"
            >;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            if (!chat.appointedAdmins.has(p.user_id)) {
              return apiError(
                "BAD_REQUEST",
                "Administrator is not appointed to the bot",
              );
            }
            const admin = chat.members.get(p.user_id);
            if (admin === undefined) {
              return apiError("BAD_REQUEST", "User not found in chat");
            }
            if (admin.status !== "administrator") {
              return apiError("BAD_REQUEST", "User is not an admin");
            }
            if (!admin.can_be_edited) {
              return apiError("BAD_REQUEST", "bot cannot edit admin");
            }
            if (p.custom_title.length < 1 || p.custom_title.length > 16) {
              return apiError("BAD_REQUEST", "Invalid custom title length");
            }
            if (regex.containsEmoji.test(p.custom_title)) {
              return apiError(
                "BAD_REQUEST",
                "Custom title cannot contain emojis.",
              );
            }
            chat.members.set(p.user_id, {
              ...admin,
              custom_title: p.custom_title,
            });
            return apiResult(true);
          }

          case "banChatSenderChat": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"banChatSenderChat">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to ban a sender chat",
              );
            }
            if (p.sender_chat_id === undefined || isNaN(p.sender_chat_id)) {
              return apiError(
                "BAD_REQUEST",
                "invalid sender chat identifier",
              );
            }
            // #CHECK throw or do nothing?
            if (chat.bannedSenderChats.has(p.sender_chat_id)) {
              return apiError("BAD_REQUEST", "Sender chat is already banned");
            }
            chat.bannedSenderChats.add(p.sender_chat_id);
            return apiResult(true);
          }

          case "unbanChatSenderChat": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"unbanChatSenderChat">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to unban a sender chat",
              );
            }
            if (p.sender_chat_id === undefined || isNaN(p.sender_chat_id)) {
              return apiError(
                "BAD_REQUEST",
                "invalid sender chat identifier",
              );
            }
            // #CHECK throw or do nothing?
            if (!chat.bannedSenderChats.has(p.sender_chat_id)) {
              return apiError("BAD_REQUEST", "Sender chat is not banned");
            }
            chat.bannedSenderChats.delete(p.sender_chat_id);
            return apiResult(true);
          }

          case "setChatPermissions": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"setChatPermissions">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_restrict_members) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to change member permissions",
              );
            }
            if (p.permissions === undefined) {
              return apiError("BAD_REQUEST", "Required params: permissions");
            }
            chat.permissions = { ...chat.permissions, ...p.permissions };
            return apiResult(true);
          }

          case "exportChatInviteLink": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to export/revoke chat primary invite link",
              );
            }
            const primaryInviteLink = unique(rand.inviteLink);
            chat.metadata.invite_link = primaryInviteLink;
            return apiResult(primaryInviteLink);
          }

          case "createChatInviteLink": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"createChatInviteLink">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to create chat invite link",
              );
            }
            if (
              p.name !== undefined && p.name.length < 0 && p.name.length > 32
            ) {
              return apiError("BAD_REQUEST", "Invalid length for name");
            }
            if (
              p.member_limit !== undefined && p.member_limit < 1 &&
              p.member_limit > 99999
            ) {
              return apiError(
                "BAD_REQUEST",
                "invalid range for member_limit",
              );
            }
            if (
              p.creates_join_request === true && p.member_limit !== undefined
            ) {
              return apiError(
                "BAD_REQUEST",
                "creates_join_request and member_limit cannot be applied simultaneously",
              );
            }
            const inviteLink = unique(rand.inviteLink);
            chat.inviteLinks.set(inviteLink, {
              invite_link: inviteLink,
              creator: this.bot.botInfo,
              creates_join_request: p.creates_join_request ?? false,
              is_primary: false,
              is_revoked: false,
              name: p.name,
              expire_date: p.expire_date,
              member_limit: p.member_limit,
              pending_join_request_count: p.member_limit,
            });
            return apiResult(true);
          }

          case "editChatInviteLink": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"editChatInviteLink">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to edit chat invite link",
              );
            }
            const inviteLink = chat.inviteLinks.get(p.invite_link);
            if (inviteLink === undefined) {
              return apiError("BAD_REQUEST", "invite link to edit not found");
            }
            // #CHECK is this error thrown actually in the tg bot api server?
            if (inviteLink.is_revoked) {
              return apiError(
                "BAD_REQUEST",
                "cannot edit a revoked invite link",
              );
            }
            if (inviteLink.is_primary) {
              return apiError(
                "BAD_REQUEST",
                "cannot edit a primary invite link",
              );
            }
            if (
              p.name !== undefined && p.name.length < 0 && p.name.length > 32
            ) {
              return apiError("BAD_REQUEST", "Invalid length for name");
            }
            if (
              p.member_limit !== undefined && p.member_limit < 1 &&
              p.member_limit > 99999
            ) {
              return apiError(
                "BAD_REQUEST",
                "invalid range for member_limit",
              );
            }
            if (
              p.creates_join_request === true && p.member_limit !== undefined
            ) {
              return apiError(
                "BAD_REQUEST",
                "creates_join_request and member_limit cannot be applied simultaneously",
              );
            }
            chat.inviteLinks.set(inviteLink.invite_link, {
              ...inviteLink,
              name: p.name ?? inviteLink.name,
              creates_join_request: p.creates_join_request ??
                inviteLink.creates_join_request,
              expire_date: p.expire_date ?? inviteLink.expire_date,
              member_limit: p.member_limit ?? inviteLink.member_limit,
            });
            return apiResult(true);
          }

          case "revokeChatInviteLink": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"revokeChatInviteLink">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to revoke chat invite link",
              );
            }
            const inviteLink = chat.inviteLinks.get(p.invite_link);
            if (inviteLink === undefined) {
              return apiError(
                "BAD_REQUEST",
                "invite link to revoke not found",
              );
            }
            // #CHECK is this error thrown actually in the tg bot api server?
            if (inviteLink.is_revoked) {
              return apiError(
                "BAD_REQUEST",
                "cannot revoke a revoked invite link",
              );
            }
            if (inviteLink.is_primary) {
              return apiError(
                "BAD_REQUEST",
                "cannot revoke a primary invite link",
              );
            }
            chat.inviteLinks.delete(inviteLink.invite_link);
            return apiResult(true);
          }

          // TODO assign join requests to group instance when a user requests it.
          case "approveChatJoinRequest": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"approveChatJoinRequest">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to approve chat join requests",
              );
            }
            // TODO: Make sure users can request and join
            const joinRequest = chat.chatJoinRequests.get(p.user_id);
            if (joinRequest === undefined) {
              return apiError("NOT_FOUND", "join request not found");
            }
            // CHECK can only a bot approve it if the invite link was bot's?
            chat.members.set(p.user_id, {
              status: "member",
              user: joinRequest.from,
            });
            chat.chatJoinRequests.delete(p.user_id);
            return apiResult(true);
          }

          case "declineChatJoinRequest": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"declineChatJoinRequest">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_invite_users) {
              return apiError(
                "BAD_REQUEST",
                "not enough rights to decline chat join requests",
              );
            }
            if (!chat.chatJoinRequests.has(p.user_id)) {
              return apiError(
                "NOT_FOUND",
                "join request to decline not found",
              );
            }

            chat.chatJoinRequests.delete(p.user_id);
            return apiResult(true);
          }

          case "setChatPhoto": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to change group info",
              );
            }
            chat.metadata.photo = {
              small_file_id: unique(rand.fileId),
              small_file_unique_id: unique(rand.fileUniqueId),
              big_file_id: unique(rand.fileId),
              big_file_unique_id: unique(rand.fileUniqueId),
            };
            return apiResult(true);
          }

          case "deleteChatPhoto": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to change group info",
              );
            }
            delete chat.metadata.photo;
            return apiResult(true);
          }

          case "setChatTitle": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"setChatTitle">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to change group info",
              );
            }
            if (p.title.length < 1 || p.title.length > 255) {
              return apiError(
                "BAD_REQUEST",
                "Invalid title length provided: " + p.title.length,
              );
            }
            chat._chat.title = p.title;
            return apiResult(true);
          }

          case "setChatDescription": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"setChatDescription">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to change group info",
              );
            }
            // #TEST according to docs, description can be passed undefined.
            // undocumented, but it should remove the description i think.
            if (p.description === undefined || p.description.length === 0) {
              delete chat.metadata.description;
              return apiResult(true);
            }
            if (p.description.length < 0 || p.description.length > 255) {
              return apiError(
                "BAD_REQUEST",
                "Invalid description length provided: " +
                  p.description.length,
              );
            }
            chat.metadata.description = p.description;
            return apiResult(true);
          }

          case "pinChatMessage": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"pinChatMessage">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_pin_messages) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to pin messages",
              );
            }
            const messageToPin = chat.messages.get(p.message_id);
            if (messageToPin === undefined) {
              return apiError("NOT_FOUND", "Message to pin not found");
            }
            if (
              chat.pinned.find((m) => m.message_id === p.message_id)
            ) {
              return apiError(
                "BAD_REQUEST",
                "Specified message is already pinned",
              );
            }
            chat.pinned.push(messageToPin);
            if (!p.disable_notification) {
              // TODO: notify everyone!
            }
            return apiResult(true);
          }

          case "unpinChatMessage": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"unpinChatMessage">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_pin_messages) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to unpin messages",
              );
            }
            const indexToUnpin = p.message_id
              ? chat.pinned.findIndex((m) => m.message_id === p.message_id)
              : chat.pinned.length - 1;
            if (indexToUnpin === -1) {
              return apiError("NOT_FOUND", "Message to unpin not found");
            }
            chat.pinned.splice(indexToUnpin, 1);
            return apiResult(true);
          }

          case "unpinAllChatMessages": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_pin_messages) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to unpin messages",
              );
            }
            chat.pinned = [];
            return apiResult(true);
          }

          // Non admin

          case "leaveChat": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            // TODO: Send update about bot leaving the chat
            chat.members.delete(this.bot.botInfo.id);
            return apiResult(true);
          }

          case "getChat": {
            return apiResult(chat.getChat());
          }

          case "getChatAdministrators": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const administrators = Array.from(chat.members.values())
              .filter((m): m is
                | Types.ChatMemberAdministrator
                | Types.ChatMemberOwner => {
                return m.status === "administrator" || m.status === "creator";
              });
            return apiResult(administrators);
          }

          case "getChatMemberCount": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            return apiResult(chat.count);
          }

          case "getChatMember": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"getChatMember">;
            if (p.user_id === undefined || isNaN(p.user_id)) {
              return apiError("BAD_REQUEST", "invalid user identifier");
            }
            const member = chat.members.get(p.user_id);
            return member !== undefined
              ? apiResult(member)
              : apiError("BAD_REQUEST", "User is not a member of the chat");
          }

          // admin

          case "setChatStickerSet": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            const p = payload as ApiPayload<"setChatStickerSet">;
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to to change the sticker set",
              );
            }
            if (chat.metadata.can_set_sticker_set) {
              chat.metadata.sticker_set_name = p.sticker_set_name;
              return apiResult(true);
            }
            return apiError(
              "BAD_REQUEST",
              "Bot is not allowed to change the sticker set of the supergroup",
            );
          }

          case "deleteChatStickerSet": {
            if (chat.type !== "supergroup") {
              return apiError(
                "INVALID_METHOD",
                "Method cannot be called in this chat",
              );
            }
            if (bot.status !== "administrator") {
              return apiError("BOT_IS_NOT_AN_ADMINISTRATOR");
            }
            if (!bot.can_change_info) {
              return apiError(
                "BAD_REQUEST",
                "Bot has not enough permissions to to change the sticker set",
              );
            }
            if (chat.metadata.can_set_sticker_set) {
              delete chat.metadata.sticker_set_name;
              return apiResult(true);
            }
            return apiError(
              "BAD_REQUEST",
              "Bot is not allowed to change the sticker set of the supergroup",
            );
          }

          case "answerCallbackQuery": // non admin, global
          case "setMyCommands": // global
          case "deleteMyCommands":
          case "getMyCommands":
          case "setChatMenuButton":
          case "getChatMenuButton":
          case "setMyDefaultAdministratorRights":
          case "getMyDefaultAdministratorRights":
          case "editMessageText": // non admin
          case "editMessageCaption":
          case "editMessageMedia":
          case "editMessageReplyMarkup":
          case "stopPoll":
          case "deleteMessage": {
            const p = payload as ApiPayload<"deleteMessage">;
            if (!chat.messages.has(p.message_id)) {
              return apiError("BAD_REQUEST", "message to delete not found");
            }
            chat.messages.delete(p.message_id);
            return apiResult(true);
          }

          case "sendSticker":
          case "getStickerSet":
          case "getCustomEmojiStickers":
          case "uploadStickerFile":
          case "createNewStickerSet":
          case "addStickerToSet":
          case "setStickerPositionInSet":
          case "deleteStickerFromSet":
          case "setStickerSetThumb":
          case "answerInlineQuery":
          case "answerWebAppQuery":
          case "createInvoiceLink":
          case "answerShippingQuery":
          case "answerPreCheckoutQuery":
          case "setPassportDataErrors":
          case "sendGame":
          case "setGameScore":
          case "getGameHighScores":
            break;

          default:
            return apiError("INVALID_METHOD", method);
        }
      }
      // ==== TODO (HERE)
      // - There are methods that has arguments like from->to and specifies
      // one or more specific chats; e.g.: (copy|forward)Message.
      // - Methods that are global. Some may related to chats, but commonly
      // considered as global such as setMyCommands, answerCallbackQuery, etc.
      return await prev(method, payload, signal);
    });
  }

  getBot() {
    return this.bot;
  }

  newUser(user: Omit<Types.User, "is_bot">) {
    return new TestUser<C>(this.bot, user);
  }

  // supergroup, group, channel
}

// `equals` modified from std/testing
function objectEquals(c: unknown, d: unknown): boolean {
  const seen = new Map();
  return (function compare(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
        return false;
      }
      seen.set(a, b);
      const merged = { ...a, ...b };
      for (
        const key of [
          ...Object.getOwnPropertyNames(merged),
          ...Object.getOwnPropertySymbols(merged),
        ]
      ) {
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
        if (((key in a) && (!(key in b))) || ((key in b) && (!(key in a)))) {
          return false;
        }
      }
      return true;
    }
    return false;
  })(c, d);
}

// Date format in Telegram API results
function date() {
  // Thanks @KnorpelSenf (https://t.me/grammyjs/76466)
  return Math.trunc(Date.now() / 1000); 
}
