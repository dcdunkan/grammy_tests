import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function forumManagementMethods<C extends Context>(): Handlers<
  C,
  Methods<"forum_management">
> {
  const getForumTopicIconStickers: Handler<C, "getForumTopicIconStickers"> =
    () => api.error("not_implemented");
  const createForumTopic: Handler<C, "createForumTopic"> = () =>
    api.error("not_implemented");
  const editForumTopic: Handler<C, "editForumTopic"> = () =>
    api.error("not_implemented");
  const closeForumTopic: Handler<C, "closeForumTopic"> = () =>
    api.error("not_implemented");
  const reopenForumTopic: Handler<C, "reopenForumTopic"> = () =>
    api.error("not_implemented");
  const deleteForumTopic: Handler<C, "deleteForumTopic"> = () =>
    api.error("not_implemented");
  const unpinAllForumTopicMessages: Handler<C, "unpinAllForumTopicMessages"> =
    () => api.error("not_implemented");
  const editGeneralForumTopic: Handler<C, "editGeneralForumTopic"> = () =>
    api.error("not_implemented");
  const closeGeneralForumTopic: Handler<C, "closeGeneralForumTopic"> = () =>
    api.error("not_implemented");
  const reopenGeneralForumTopic: Handler<C, "reopenGeneralForumTopic"> = () =>
    api.error("not_implemented");
  const hideGeneralForumTopic: Handler<C, "hideGeneralForumTopic"> = () =>
    api.error("not_implemented");
  const unhideGeneralForumTopic: Handler<C, "unhideGeneralForumTopic"> = () =>
    api.error("not_implemented");

  return {
    getForumTopicIconStickers,
    createForumTopic,
    editForumTopic,
    closeForumTopic,
    reopenForumTopic,
    deleteForumTopic,
    unpinAllForumTopicMessages,
    editGeneralForumTopic,
    closeGeneralForumTopic,
    reopenGeneralForumTopic,
    hideGeneralForumTopic,
    unhideGeneralForumTopic,
  };
}
