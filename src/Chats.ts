import { Bot, Context, GrammyTypes } from "../deps.ts";
import { TestUser } from "./TestUser.ts";
import type { User } from "./types.ts";

export class Chats<BC extends Context = Context> {
  constructor(private bot: Bot<BC>, botInfo?: GrammyTypes.UserFromGetMe) {
    this.bot.botInfo = botInfo ?? {
      id: 42,
      first_name: "Test Bot",
      is_bot: true,
      username: "test_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
  }

  /**
   * Creates a fake Telegram user account to mock updates related to a private
   * chat.
   * @param user Information about the user.
   * @returns A `TestUser` instance.
   */
  newUser(user: User): TestUser<BC> {
    const chat: GrammyTypes.Chat.PrivateChat = {
      first_name: user.first_name,
      id: user.id,
      type: "private",
      last_name: user.last_name,
      username: user.username,
    };

    return new TestUser<BC>(this.bot, {
      botInfo: this.bot.botInfo,
      chat: chat,
      user: { ...user, is_bot: false },
    });
  }
}
