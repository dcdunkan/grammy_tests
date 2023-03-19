import type { Context, Types } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function chatMethods<C extends Context>(): Handlers<
  C,
  Methods<"chat_management">
> {
  const kickChatMember: Handler<C, "restrictChatMember"> = () =>
    api.error("not_implemented");
  const banChatMember: Handler<C, "banChatMember"> = () =>
    api.error("not_implemented");
  const unbanChatMember: Handler<C, "unbanChatMember"> = () =>
    api.error("not_implemented");
  const restrictChatMember: Handler<C, "restrictChatMember"> = () =>
    api.error("not_implemented");
  const promoteChatMember: Handler<C, "promoteChatMember"> = () =>
    api.error("not_implemented");
  const setChatAdministratorCustomTitle: Handler<
    C,
    "setChatAdministratorCustomTitle"
  > = () => api.error("not_implemented");
  const banChatSenderChat: Handler<C, "banChatSenderChat"> = () =>
    api.error("not_implemented");
  const unbanChatSenderChat: Handler<C, "unbanChatSenderChat"> = () =>
    api.error("not_implemented");
  const setChatPermissions: Handler<C, "setChatPermissions"> = () =>
    api.error("not_implemented");
  const exportChatInviteLink: Handler<C, "exportChatInviteLink"> = () =>
    api.error("not_implemented");
  const createChatInviteLink: Handler<C, "createChatInviteLink"> = () =>
    api.error("not_implemented");
  const editChatInviteLink: Handler<C, "editChatInviteLink"> = () =>
    api.error("not_implemented");
  const revokeChatInviteLink: Handler<C, "revokeChatInviteLink"> = () =>
    api.error("not_implemented");
  const approveChatJoinRequest: Handler<C, "approveChatJoinRequest"> = () =>
    api.error("not_implemented");
  const declineChatJoinRequest: Handler<C, "declineChatJoinRequest"> = () =>
    api.error("not_implemented");
  const setChatPhoto: Handler<C, "setChatPhoto"> = () =>
    api.error("not_implemented");
  const deleteChatPhoto: Handler<C, "deleteChatPhoto"> = () =>
    api.error("not_implemented");
  const setChatTitle: Handler<C, "setChatTitle"> = () =>
    api.error("not_implemented");
  const setChatDescription: Handler<C, "setChatDescription"> = () =>
    api.error("not_implemented");
  const pinChatMessage: Handler<C, "pinChatMessage"> = () =>
    api.error("not_implemented");
  const unpinChatMessage: Handler<C, "unpinChatMessage"> = () =>
    api.error("not_implemented");
  const unpinAllChatMessages: Handler<C, "unpinAllChatMessages"> = () =>
    api.error("not_implemented");
  const leaveChat: Handler<C, "leaveChat"> = () => api.error("not_implemented");

  const getChat: Handler<C, "getChat"> = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    return api.result(chat.getChat());
  };

  const getChatAdministrators: Handler<C, "getChatAdministrators"> = () =>
    api.error("not_implemented");

  const getChatMemberCount: Handler<C, "getChatMemberCount"> = (
    env,
    payload,
  ) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    if (chat.type === "private") return api.error("its_private_chat");
    let count = chat.members.size + 1; // 1 for chat owner.
    if (chat.type !== "group") count += chat.administrators.size;
    return api.result(count);
  };

  /** @deprecated */
  const getChatMembersCount: Handler<
    C,
    "getChatMemberCount"
  > = (env, payload) => {
    return getChatMemberCount(env, { chat_id: payload.chat_id });
  };

  const getChatMember: Handler<C, "getChatMember"> = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    // TODO: Does this return the member in private chat?
    if (chat.type === "private") return api.error("its_private_chat");
    let member: Types.ChatMember | undefined =
      chat.creator.user.id === payload.user_id
        ? chat.creator
        : chat.members.get(payload.user_id) ?? chat.banned.get(payload.user_id);
    if (chat.type !== "group") {
      member ??= chat.administrators.get(payload.user_id);
    }
    if (member === undefined) return api.error("chat_member_not_found");
    return api.result(member);
  };

  const setChatStickerSet: Handler<C, "setChatStickerSet"> = () =>
    api.error("not_implemented");
  const deleteChatStickerSet: Handler<C, "deleteChatStickerSet"> = () =>
    api.error("not_implemented");

  return {
    kickChatMember,
    banChatMember,
    unbanChatMember,
    restrictChatMember,
    promoteChatMember,
    setChatAdministratorCustomTitle,
    banChatSenderChat,
    unbanChatSenderChat,
    setChatPermissions,
    exportChatInviteLink,
    createChatInviteLink,
    editChatInviteLink,
    revokeChatInviteLink,
    approveChatJoinRequest,
    declineChatJoinRequest,
    setChatPhoto,
    deleteChatPhoto,
    setChatTitle,
    setChatDescription,
    pinChatMessage,
    unpinChatMessage,
    unpinAllChatMessages,
    leaveChat,
    getChat,
    getChatAdministrators,
    getChatMembersCount,
    getChatMemberCount,
    getChatMember,
    setChatStickerSet,
    deleteChatStickerSet,
  };
}
