import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function stickersMethods<C extends Context>(): Handlers<
  C,
  Methods<"stickers">
> {
  const sendSticker: Handler<C, "sendSticker"> = () =>
    api.error("not_implemented");
  const getStickerSet: Handler<C, "getStickerSet"> = () =>
    api.error("not_implemented");
  const getCustomEmojiStickers: Handler<C, "getCustomEmojiStickers"> = () =>
    api.error("not_implemented");
  const uploadStickerFile: Handler<C, "uploadStickerFile"> = () =>
    api.error("not_implemented");
  const createNewStickerSet: Handler<C, "createNewStickerSet"> = () =>
    api.error("not_implemented");
  const addStickerToSet: Handler<C, "addStickerToSet"> = () =>
    api.error("not_implemented");
  const setStickerPositionInSet: Handler<C, "setStickerPositionInSet"> = () =>
    api.error("not_implemented");
  const deleteStickerFromSet: Handler<C, "deleteStickerFromSet"> = () =>
    api.error("not_implemented");
  const setStickerEmojiList: Handler<C, "setStickerEmojiList"> = () =>
    api.error("not_implemented");
  const setStickerKeywords: Handler<C, "setStickerKeywords"> = () =>
    api.error("not_implemented");
  const setStickerMaskPosition: Handler<C, "setStickerMaskPosition"> = () =>
    api.error("not_implemented");
  const setStickerSetTitle: Handler<C, "setStickerSetTitle"> = () =>
    api.error("not_implemented");
  const deleteStickerSet: Handler<C, "deleteStickerSet"> = () =>
    api.error("not_implemented");
  const setStickerSetThumbnail: Handler<C, "setStickerSetThumbnail"> = () =>
    api.error("not_implemented");
  const setCustomEmojiStickerSetThumbnail: Handler<
    C,
    "setCustomEmojiStickerSetThumbnail"
  > = () => api.error("not_implemented");

  return {
    sendSticker,
    getStickerSet,
    getCustomEmojiStickers,
    uploadStickerFile,
    createNewStickerSet,
    addStickerToSet,
    setStickerPositionInSet,
    deleteStickerFromSet,
    setStickerEmojiList,
    setStickerKeywords,
    setStickerMaskPosition,
    setStickerSetTitle,
    deleteStickerSet,
    setStickerSetThumbnail,
    setCustomEmojiStickerSetThumbnail,
  };
}
