// deno-lint-ignore-file no-explicit-any
import { Bot, Context, GrammyTypes, Payload } from "../deps.ts";
import type { Methods, RawApi } from "../deps.ts";
import type {
  ForwardMessageOptions,
  MaybeCaptioned,
  MaybeReplied,
  Misc,
  User,
} from "./types.ts";
type Options = MaybeCaptioned & MaybeReplied & Misc;
type DefaultsOmittedMessage = Omit<
  GrammyTypes.Message,
  "date" | "chat" | "from" | "message_id"
>;
export type ApiPayload<M extends Methods<RawApi>> = Payload<M, RawApi>;
export type DiceEmoji =
  | "🎲 dice"
  | "🎳 bowling"
  | "🎯 dart"
  | "🏀 basketball"
  | "⚽ football"
  | "🎰 slot_machine";
/**
 * A test user for mocking updates sent by a Telegram user or a private chat
 */
export class TestUser<BC extends Context> {
  public readonly user: GrammyTypes.User;
  public readonly chat: GrammyTypes.Chat.PrivateChat;
  public update_id = 100000;
  public message_id = 2;

  /** Outgoing responses from the bot */
  public responses: {
    method: Methods<RawApi>;
    payload: Record<string, any>;
    // Payload<Methods<RawApi>, RawApi>;
  }[] = [];

  private callbacks: Record<string, ApiPayload<"answerCallbackQuery">> = {};
  private inlineQueries: Record<string, ApiPayload<"answerInlineQuery">> = {};

  /** Incoming requests/updates sent from the user to the bot */
  public updates: GrammyTypes.Update[] = [];

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
    update: Omit<GrammyTypes.Update, "update_id">,
  ): Promise<GrammyTypes.Update> {
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
  sendMessage(text: string, options?: {
    message_id?: number;
    entities?: GrammyTypes.MessageEntity[];
    via_bot?: GrammyTypes.User;
  }): Promise<GrammyTypes.Update> {
    const opts = {
      text: text,
      message_id: options?.message_id ?? this.message_id,
      ...options,
    };

    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
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
    replyToMessage: GrammyTypes.Message,
    toReply: string | Omit<DefaultsOmittedMessage, "reply_to_message">,
  ): Promise<GrammyTypes.Update> {
    const other = typeof toReply === "string" ? { text: toReply } : toReply;
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
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
  ): Promise<GrammyTypes.Update> {
    return this.sendMessage(`/${command}${match ? ` ${match}` : ""}`, {
      entities: [{
        type: "bot_command",
        offset: 0,
        length: 1 + command.length,
      }],
    });
  }

  /**
   * Use this method to send GIF animations to the bot.
   * @param animationOptions Information about the animation and optional parameters.
   */
  sendAnimation(
    animationOptions: Options & { animation: GrammyTypes.Animation },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...animationOptions,
      },
    });
  }

  /**
   * Use this method to send audio messages to the bot.
   * @param audioOptions Information about the audio and optional parameters.
   */
  sendAudio(
    audioOptions: Options & { audio: GrammyTypes.Audio },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...audioOptions,
      },
    });
  }

  /**
   * Use this method to send documents and files to the bot.
   * @param documentOptions Information about the document and optional parameters.
   */
  sendDocument(
    documentOptions: Options & { document: GrammyTypes.Document },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...documentOptions,
      },
    });
  }

  /**
   * Use this method to send photos to the bot.
   * @param photoOptions Information about the photo and optional parameters.
   */
  sendPhoto(
    photoOptions: Options & { photo: GrammyTypes.PhotoSize[] },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...photoOptions,
      },
    });
  }

  /**
   * Use this method to send sticker messages to the bot.
   * @param stickerOptions Information about the sticker and optional parameters.
   */
  sendSticker(
    stickerOptions: { sticker: GrammyTypes.Sticker } & MaybeReplied & Misc,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...stickerOptions,
      },
    });
  }

  /**
   * Use this method to send videos to the bot.
   * @param videoOptions Information about the video and optional parameters.
   */
  sendVideo(
    videoOptions: Options & { video: GrammyTypes.Video },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
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
      & { video_note: GrammyTypes.VideoNote }
      & MaybeReplied
      & Misc,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...videoNoteOptions,
      },
    });
  }

  /**
   * Use this method to send voice messages to the bot.
   * @param voiceOptions Information about the voice message and optional parameters.
   */
  sendVoice(
    voiceOptions: Options & { voice: GrammyTypes.Voice },
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
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
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        chat: this.chat,
        date: Date.now(),
        message_id: this.message_id,
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
    game: GrammyTypes.Game,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        chat: this.chat,
        date: Date.now(),
        message_id: this.message_id,
        game,
      },
    });
  }

  /**
   * Use this method to send a poll to the chat.
   * @param poll Information about the poll
   */
  sendPoll(
    poll: GrammyTypes.Poll,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        chat: this.chat,
        date: Date.now(),
        message_id: this.message_id,
        poll,
      },
    });
  }

  /**
   * Use this method to send a venue to the chat.
   * @param venue Information about the venue
   */
  sendVenue(
    venue: GrammyTypes.Venue,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        chat: this.chat,
        date: Date.now(),
        message_id: this.message_id,
        venue,
      },
    });
  }

  /**
   * Use this method to send a location to the chat.
   * @param location Information about the location
   */
  sendLocation(
    location: GrammyTypes.Location,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        chat: this.chat,
        date: Date.now(),
        message_id: this.message_id,
        location,
      },
    });
  }

  /**
   * Use this method to edit a message.
   * @param message Message to edit.
   */
  editMessage(
    message: GrammyTypes.Message,
  ): Promise<GrammyTypes.Update> {
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
  ): Promise<GrammyTypes.Update> {
    return this.editMessage({
      date: Date.now(),
      chat: this.chat,
      from: this.user,
      edit_date: Date.now(),
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
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        from: this.user,
        chat: this.chat,
        message_id: this.message_id,
        forward_date: Date.now(),
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
    entities?: GrammyTypes.MessageEntity[],
  ): Promise<GrammyTypes.Update> {
    return this.forwardMessage({ text, entities });
  }

  /**
   * Use this method to query inline.
   * @param query Query string. Defaults to an empty string.
   * @param options Additional information about the query.
   */
  inlineQuery(
    query: Omit<GrammyTypes.InlineQuery, "from" | "chat_type">,
  ): Promise<GrammyTypes.Update> {
    this.inlineQueries[query.id] = { inline_query_id: query.id, results: [] };
    return this.sendUpdate({
      inline_query: { ...query, from: this.user },
    });
  }

  // TODO: Implement `chooseInlineResult`.

  /**
   * Use this method to click an inline button.
   * @param callbackQuery The callback data of the inline button.
   */
  click(
    callbackQuery: Omit<GrammyTypes.CallbackQuery, "chat_instance" | "from">,
  ): Promise<GrammyTypes.Update> {
    this.callbacks[callbackQuery.id] = { callback_query_id: callbackQuery.id };

    return this.sendUpdate({
      callback_query: {
        ...callbackQuery,
        chat_instance: `${this.user.id}071801131325`, // 07 18 01 13 13 25
        from: this.user,
      },
    });
  }

  /**
   * Use this method to pin a message in chat.
   * @param message The message to be pin in chat.
   */
  pinMessage(
    message: GrammyTypes.ReplyMessage,
  ): Promise<GrammyTypes.Update> {
    return this.sendUpdate({
      message: {
        date: Date.now(),
        chat: this.chat,
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
  ) {
    if (!options) return this.command("start");
    this.sendMessage(
      `/start${options.payload ? ` ${options.payload}` : ""}`,
      {
        entities: [{ type: "bot_command", offset: 0, length: 6 }],
        message_id: options.first_start ? 1 : this.message_id,
      },
    );
  }

  /**
   * Use this method to block or stop the bot. The bot will no longer be able to
   * send messages if it is blocked by the user.
   */
  stopBot() {
    return this.sendUpdate({
      my_chat_member: {
        date: Date.now(),
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
  async restartBot({ sendStartCmd = true }: {
    /** Whether a start command should be sent after unblocking/restarting the bot */
    sendStartCmd: boolean;
  }) {
    await this.sendUpdate({
      my_chat_member: {
        date: Date.now(),
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
    if (sendStartCmd) await this.command("start");
  }
}
