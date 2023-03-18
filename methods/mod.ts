export * from "./list.ts";

// TODO: VALIDATION of payloads
import type { Context, RawApi } from "../deps.ts";
import type { Handlers } from "../types.ts";

// Handlers categorized and implemented in several files.
import { gettingUpdatesMethods } from "./getting_updates.ts";
import { setupMethods } from "./setup.ts";
import { messagesMethods } from "./messages.ts";
import { chatMethods } from "./chat_management.ts";
import { forumManagementMethods } from "./forum_management.ts";
import { botSettingsMethods } from "./bot_settings.ts";
import { updatingMessagesMethods } from "./updating_messages.ts";
import { stickersMethods } from "./stickers.ts";
import { inlineModeMethods } from "./inline_mode.ts";
import { paymentsMethods } from "./payments.ts";
import { telegramPassportMethods } from "./telegram_passport.ts";
import { gamesMethods } from "./games.ts";

// TODO: change the `any` to `AllMethods` when everything's done.
export function bakeHandlers<C extends Context>(): Handlers<C, keyof RawApi> {
  return {
    ...gettingUpdatesMethods(),
    ...setupMethods(),
    ...messagesMethods(),
    ...chatMethods(),
    ...forumManagementMethods(),
    ...botSettingsMethods(),
    ...updatingMessagesMethods(),
    ...stickersMethods(),
    ...inlineModeMethods(),
    ...paymentsMethods(),
    ...telegramPassportMethods(),
    ...gamesMethods(),
  };
}
