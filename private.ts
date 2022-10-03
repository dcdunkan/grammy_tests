import { Bot, Context, Methods, Payload, RawApi, Types } from "./deps.ts";
import { Chats } from "./chats.ts";

type PrivateMetadata = Omit<
  Types.Chat.PrivateGetChat,
  "id" | "type" | "first_name" | "last_name" | "username" | "pinned_message"
>;

export interface PrivateDetails extends Omit<Types.User, "type" | "is_bot"> {
  metadata?: PrivateMetadata;
  pinnedMessages?: Types.Message[];
}

export class Private<C extends Context> {
  public readonly type = "private";
  private bot: Bot<C>;
  public readonly blocked: boolean = false; // TODO
  public readonly messages: Map<number, Types.Message>;

  private _chat: Types.Chat.PrivateChat;
  public readonly user: Types.User;
  public readonly metadata: Partial<PrivateMetadata>;
  public pinned: Types.Message[];
  public message_id = 3;

  // Responses from the bot
  public responses: {
    method: Methods<RawApi>;
    payload: Payload<Methods<RawApi>, RawApi>;
  }[] = [];
  // Updates from the private chat (user)
  public updates: Types.Update[] = [];

  // private environment: for the future `user.as`, `user.in` and
  // callback queries and inline queries.
  constructor(environment: Chats<C>, details: PrivateDetails) {
    if (!details.id && !details.first_name) {
      throw new Error("not required info to create a user");
    }

    this.bot = environment.getBot();

    this._chat = {
      id: details.id,
      type: "private",
      username: details.username,
      first_name: details.first_name,
      last_name: details.last_name,
    };

    this.user = {
      is_bot: false,
      id: details.id,
      first_name: details.first_name,
      last_name: details.last_name,
      username: details.username,
      added_to_attachment_menu: details.added_to_attachment_menu,
      is_premium: details.is_premium,
      language_code: details.language_code,
    };

    this.metadata = details.metadata ?? {};
    this.pinned = details.pinnedMessages ?? [];
    this.messages = new Map(
      details.pinnedMessages?.map((m) => [m.message_id, m]),
    );

    this.bot.api.config.use(async (prev, method, payload, signal) => {
      // CHECK is there any user specific methods?
      return await prev(method, payload, signal);
    });
  }

  get chat(): Types.Chat.PrivateChat {
    return this._chat;
  }

  getChat(): Types.Chat.PrivateGetChat {
    return {
      type: "private",
      id: this._chat.id,
      first_name: this.chat.first_name,
      last_name: this._chat.last_name,
      username: this._chat.username,
      pinned_message: this.pinned[this.pinned.length - 1],
      ...this.metadata,
    };
  }
}
