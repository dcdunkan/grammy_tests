// deno-lint-ignore-file no-explicit-any
import { Bot, Context, Methods, Payload, RawApi, Types } from "../deps.ts";
import type {
  ForwardMessageOptions,
  MaybeCaptioned,
  MaybeReplied,
  Misc,
  User,
} from "../types.ts";

function getDate() {
  return Math.trunc(Date.now() / 1000);
}

type InOtherChat =
  | Types.Chat.SupergroupChat
  | Types.Chat.GroupChat;
type Options = MaybeCaptioned & MaybeReplied & Misc;
type DefaultsOmittedMessage = Omit<
  Types.Message,
  "date" | "chat" | "from" | "message_id"
>;
export type ApiPayload<M extends Methods<RawApi>> = Payload<M, RawApi>;
export type DiceEmoji = "🎲" | "🎳" | "🎯" | "🏀" | "⚽" | "🎰";
/**
 * A test user for mocking updates sent by a Telegram user or a private chat
 */
export class TestUser<BC extends Context> {
  public readonly type = "private";
  public readonly user: Types.User;
  public readonly chat: Types.Chat.PrivateChat;
  public update_id = 100000;
  public message_id = 2;
  public readonly messages: Map<number, Types.Message> = new Map()

  /** Outgoing responses from the bot */
  public responses: {
    method: Methods<RawApi>;
    payload: Record<string, any>;
    // Payload<Methods<RawApi>, RawApi>;
  }[] = [];

  private callbacks: Record<string, ApiPayload<"answerCallbackQuery">> = {};
  private inlineQueries: Record<string, ApiPayload<"answerInlineQuery">> = {};

  /** Incoming requests/updates sent from the user to the bot */
  public updates: Types.Update[] = [];

  /**
   * @param bot The `Bot` instance to be tested
   * @param user Information related to the User
   */
  constructor(private bot: Bot<BC>, user: User) {
    this.user = { ...user, is_bot: false };
    this.chat = {
      first_name: user.first_name,
      id: user.id,
      type: "private",
      last_name: user.last_name,
      username: user.username,
    };

    this.bot.api.config.use((prev, method, payload, signal) => {
      // This is not how actually message ID increments, but this works for now
      if (method.startsWith("send")) this.message_id++;
      else if (method === "forwardMessage") this.message_id++;

      if ("chat_id" in payload && payload.chat_id === this.chat.id) {
        this.responses.push({ method, payload });
      } else if (method === "answerCallbackQuery") {
        const cbQueryPayload = payload as ApiPayload<"answerCallbackQuery">;
        if (cbQueryPayload.callback_query_id in this.callbacks) {
          this.responses.push({ method, payload });
          this.callbacks[cbQueryPayload.callback_query_id] = cbQueryPayload;
        }
      } else if (method === "answerInlineQuery") {
        const inlinePayload = payload as ApiPayload<"answerInlineQuery">;
        if (inlinePayload.inline_query_id in this.inlineQueries) {
          this.responses.push({ method, payload });
          this.inlineQueries[inlinePayload.inline_query_id] = inlinePayload;
        }
      }

      // TODO: Return proper API responses
      return prev(method, payload, signal);
    });
  }

  getChat() {
    
  }

  /** Last sent update by the user */
  get lastUpdate() {
    return this.updates[this.updates.length - 1];
  }

  /** Payload of last response from the bot  */
  get last() {
    return this.responses[this.responses.length - 1].payload;
  }

  /** Clears updates (requests) sent by the user */
  clearUpdates(): void {
    this.updates = [];
  }

  /** Clears responses from the bot */
  clearResponses(): void {
    this.responses = [];
  }

  /** Clears both updates and responses */
  clear(): void {
    this.responses = [];
    this.updates = [];
  }

  /**
   * Use this method to send updates to the bot.
   * @param update The Update to send; without the `update_id` property.
   */
  async sendUpdate(
    update: Omit<Types.Update, "update_id">,
  ): Promise<Types.Update> {
    // TODO: Validate update.
    const updateToSend = { ...update, update_id: this.update_id };
    await this.bot.handleUpdate(updateToSend);
    this.updates.push(updateToSend);
    this.update_id++;
    return updateToSend;
  }

  /**
   * Use this method to send text messages. The sent Update is returned.
   * Triggers `bot.hears`, `bot.on(":text")` like listeners.
   *
   * @param text Text to send.
   * @param options Optional parameters for sending the message, such as
   * message_id, message entities, bot information, if it was a message sent by
   * choosing an inline result.
   */
  sendMessage(
    text: string,
    options?: {
      message_id?: number;
      entities?: Types.MessageEntity[];
      via_bot?: Types.User;
    },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    const opts = {
      text: text,
      message_id: options?.message_id ?? this.message_id++,
      ...options,
    };

    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        ...opts,
      },
    });
  }

  /**
   * Use this method to reply to another message in chat.
   * @param replyToMessage The message to reply to.
   * @param toReply The content of the reply.
   */
  replyTo(
    replyToMessage: Types.Message,
    toReply: string | Omit<DefaultsOmittedMessage, "reply_to_message">,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    const other = typeof toReply === "string" ? { text: toReply } : toReply;
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        reply_to_message: {
          ...replyToMessage,
          reply_to_message: undefined,
        },
        ...other,
      },
    });
  }

  /**
   * Use this method to send a command to the bot. Triggers corresponding
   * `bot.command()` listeners.
   * @param command Command to send.
   * @param match Optionally you can pass in a match/payload, an extra parameter
   * which is sent with the command.
   */
  command(
    command: string,
    match?: string,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendMessage(`/${command}${match ? ` ${match}` : ""}`, {
      entities: [{
        type: "bot_command",
        offset: 0,
        length: 1 + command.length,
      }],
    }, chat);
  }

  /**
   * Use this method to send GIF animations to the bot.
   * @param animationOptions Information about the animation and optional parameters.
   */
  sendAnimation(
    animationOptions: Options & { animation: Types.Animation },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...animationOptions,
      },
    });
  }

  /**
   * Use this method to send audio messages to the bot.
   * @param audioOptions Information about the audio and optional parameters.
   */
  sendAudio(
    audioOptions: Options & { audio: Types.Audio },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...audioOptions,
      },
    });
  }

  /**
   * Use this method to send documents and files to the bot.
   * @param documentOptions Information about the document and optional parameters.
   */
  sendDocument(
    documentOptions: Options & { document: Types.Document },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...documentOptions,
      },
    });
  }

  /**
   * Use this method to send photos to the bot.
   * @param photoOptions Information about the photo and optional parameters.
   */
  sendPhoto(
    photoOptions: Options & { photo: Types.PhotoSize[] },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...photoOptions,
      },
    });
  }

  /**
   * Use this method to send sticker messages to the bot.
   * @param stickerOptions Information about the sticker and optional parameters.
   */
  sendSticker(
    stickerOptions: { sticker: Types.Sticker } & MaybeReplied & Misc,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...stickerOptions,
      },
    });
  }

  /**
   * Use this method to send videos to the bot.
   * @param videoOptions Information about the video and optional parameters.
   */
  sendVideo(
    videoOptions: Options & { video: Types.Video },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...videoOptions,
      },
    });
  }

  /**
   * Use this method to send video notes to the bot.
   * @param videoNoteOptions Information about the video note and optional parameters.
   */
  sendVideoNote(
    videoNoteOptions:
      & { video_note: Types.VideoNote }
      & MaybeReplied
      & Misc,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...videoNoteOptions,
      },
    });
  }

  /**
   * Use this method to send voice messages to the bot.
   * @param voiceOptions Information about the voice message and optional parameters.
   */
  sendVoice(
    voiceOptions: Options & { voice: Types.Voice },
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        ...voiceOptions,
      },
    });
  }

  /**
   * Use this method to send a dice animation to the chat.
   * @param emoji Emoji on which the dice throw animation is based
   * @param value Value of the dice, 1-6 for “🎲”, “🎯” and “🎳” base emoji, 1-5
   * for “🏀” and “⚽” base emoji, 1-64 for “🎰” base emoji
   */
  sendDice(
    emoji: DiceEmoji,
    value: number,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        dice: {
          emoji: emoji.split(" ")[0],
          value: value,
        },
      },
    });
  }

  /**
   * Use this method to send a game to the chat.
   * @param game Information about the game
   */
  sendGame(
    game: Types.Game,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        game,
      },
    });
  }

  /**
   * Use this method to send a poll to the chat.
   * @param poll Information about the poll
   */
  sendPoll(
    poll: Types.Poll,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        poll,
      },
    });
  }

  /**
   * Use this method to send a venue to the chat.
   * @param venue Information about the venue
   */
  sendVenue(
    venue: Types.Venue,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        venue,
      },
    });
  }

  /**
   * Use this method to send a location to the chat.
   * @param location Information about the location
   */
  sendLocation(
    location: Types.Location,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        location,
      },
    });
  }

  /**
   * Use this method to edit a message.
   * @param message Message to edit.
   */
  editMessage(
    message: Types.Message,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      edited_message: message,
    });
  }

  /**
   * Use this method to edit a message's text.
   * @param message_id ID of the text message to edit.
   * @param text New text content of the message.
   */
  editMessageText(
    message_id: number,
    text: string,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.editMessage({
      date: getDate(),
      chat: chat ?? this.chat,
      from: this.user,
      edit_date: getDate(),
      message_id,
      text,
    });
  }

  /**
   * Use this method to forward a message to the bot.
   * @param options Information of the forwarding message.
   */
  forwardMessage(
    options: ForwardMessageOptions,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id++,
        forward_date: getDate(),
        ...options,
      },
    });
  }

  /**
   * Use this method to forward a text message to the bot.
   * @param text Text of the forwarding message.
   * @param entities Optional message entities array.
   */
  forwardTextMessage(
    text: string,
    entities?: Types.MessageEntity[],
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.forwardMessage({ text, entities }, chat);
  }

  /**
   * Use this method to query inline.
   * @param query Query string. Defaults to an empty string.
   */
  inlineQuery(
    query: Omit<Types.InlineQuery, "from" | "chat_type">,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    this.inlineQueries[query.id] = { inline_query_id: query.id, results: [] };
    return this.sendUpdate({
      inline_query: {
        ...query,
        chat_type: chat?.type ?? "sender",
        from: this.user,
      },
    });
  }

  // TODO: Implement `chooseInlineResult`.

  /**
   * Use this method to click an inline button.
   * @param callbackQuery The callback data of the inline button.
   */
  click(
    callbackQuery: Omit<Types.CallbackQuery, "chat_instance" | "from">,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    this.callbacks[callbackQuery.id] = { callback_query_id: callbackQuery.id };

    return this.sendUpdate({
      callback_query: {
        ...callbackQuery,
        chat_instance: `${chat?.id ?? this.chat.id}071801131325`, // 07 18 01 13 13 25
        from: this.user,
      },
    });
  }

  /**
   * Use this method to pin a message in chat.
   * @param message The message to be pin in chat.
   */
  pinMessage(
    message: Types.ReplyMessage,
    chat?: InOtherChat,
  ): Promise<Types.Update> {
    return this.sendUpdate({
      message: {
        date: getDate(),
        chat: chat ?? this.chat,
        from: this.user,
        message_id: this.message_id,
        pinned_message: message,
      },
    });
  }

  /**
   * Short method for sending start command; or, in other words, starting a
   * conversation with the bot.
   * @param options Optional information for the start command.
   */
  startBot(
    options?: {
      /** /start command payload (match) */
      payload?: string;
      /** Whether it is the first ever `/start` command to the bot */
      first_start?: boolean;
    },
    chat?: InOtherChat,
  ) {
    if (!options) return this.command("start");
    this.sendMessage(
      `/start${options.payload ? ` ${options.payload}` : ""}`,
      {
        entities: [{ type: "bot_command", offset: 0, length: 6 }],
        message_id: options.first_start ? 1 : this.message_id,
      },
      chat,
    );
  }

  /**
   * Use this method to block or stop the bot. The bot will no longer be able to
   * send messages if it is blocked by the user.
   */
  stopBot() {
    return this.sendUpdate({
      my_chat_member: {
        date: getDate(),
        chat: this.chat,
        from: this.user,
        old_chat_member: {
          user: this.user,
          status: "member",
        },
        new_chat_member: {
          user: this.user,
          status: "kicked",
          until_date: 0,
        },
      },
    });
  }

  /**
   * Use this method to restart the bot if it has been blocked or
   * stopped by the user.
   */
  async restartBot({ sendStart = true }: {
    /** Whether a start command should be sent after unblocking/restarting the bot */
    sendStart: boolean;
  }) {
    await this.sendUpdate({
      my_chat_member: {
        date: getDate(),
        chat: this.chat,
        from: this.user,
        old_chat_member: {
          user: this.user,
          status: "kicked",
          until_date: 0,
        },
        new_chat_member: {
          user: this.user,
          status: "member",
        },
      },
    });

    // Clicking "Restart Bot" button, also sends a '/start' command
    // in Official Telegram Clients. Set `sendStartCmd` to false, to disable.
    if (sendStart) await this.command("start");
  }
}
