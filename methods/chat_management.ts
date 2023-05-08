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

  const leaveChat: Handler<C, "leaveChat"> = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    if (chat.type === "private") return api.error("private_chat_member_status");

    const member = chat.getChatMember(env.getBot().botInfo.id);
    if (member.status === "not-found") return api.error("chat_not_found"); // not reached
    if (
      member.status === "left" || member.status === "kicked" ||
      (member.status === "restricted" && !member.is_member)
    ) return api.error("not_a_member", "So cannot leave");

    chat.isBotAMember = false;

    if (member.status === "restricted") {
      chat.members.set(member.user.id, { ...member, is_member: false });
    } else {
      chat.members.set(member.user.id, { status: "left", user: member.user });
    }
    return api.result(true);
  };

  const getChat: Handler<C, "getChat"> = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    return api.result(chat.getChat());
  };

  const getChatAdministrators: Handler<
    C,
    "getChatAdministrators"
  > = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    if (chat.type === "private") return api.error("its_private_chat");
    if (chat.type === "group") return api.error("its_group_chat");

    const administrators:
      (Types.ChatMemberOwner | Types.ChatMemberAdministrator)[] = [];
    for (const member of chat.members.values()) {
      if (
        member.status === "administrator" ||
        member.status === "creator"
      ) administrators.push(member);
    }
    return api.result(administrators);
  };

  const getChatMemberCount: Handler<
    C,
    "getChatMemberCount"
  > = (env, payload) => {
    const chat = typeof payload.chat_id === "string"
      ? env.resolveUsername(payload.chat_id)
      : env.chats.get(payload.chat_id);
    if (chat === undefined) return api.error("chat_not_found");
    if (chat.type === "private") return api.error("its_private_chat");
    let memberCount = 0;
    for (const member of chat.members.values()) {
      if (
        member.status === "creator" ||
        member.status === "member" ||
        member.status === "administrator" ||
        (member.status === "restricted" && member.is_member)
      ) memberCount++;
    }
    return api.result(memberCount);
  };

  // deprecated
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
    const member = chat.getChatMember(payload.user_id);
    if (member.status === "not-found") return api.error("user_not_found");
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
