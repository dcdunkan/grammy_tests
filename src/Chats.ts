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
   * Creates a test user and helps you to send mock updates as if they were sent
   * from a private chat to the bot.
   * @param user Information about the user.
   * @returns A `TestUser` instance.
   */
  newUser(user: User): TestUser<BC> {
    return new TestUser<BC>(this.bot, user);
  }
}
