import type { Context } from "../deps.ts";
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
  const getChat: Handler<C, "getChat"> = () => api.error("not_implemented");
  const getChatAdministrators: Handler<C, "getChatAdministrators"> = () =>
    api.error("not_implemented");
  const getChatMembersCount: Handler<C, "getChatMemberCount"> = () =>
    api.error("not_implemented");
  const getChatMemberCount: Handler<C, "getChatMemberCount"> = () =>
    api.error("not_implemented");
  const getChatMember: Handler<C, "getChatMember"> = () =>
    api.error("not_implemented");
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
