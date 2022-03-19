// deno-lint-ignore-file no-explicit-any
import { Bot, Context, GrammyTypes, Methods, RawApi } from "../deps.ts";
import * as types from "./types.ts";

/**
 * Creates a Telegram user account and helps to send updates as if they were
 * sent from a private chat to the bot.
 */
export class TestUser<C extends Context> {
  public user: GrammyTypes.User = {
    first_name: "Test User",
    last_name: "Account",
    id: 123456789,
    is_bot: false,
    language_code: "en",
    username: "test_usr",
  };
  public chat: GrammyTypes.Chat.PrivateChat = {
    first_name: "Test User",
    last_name: "Account",
    id: 123456789,
    username: "test_usr",
    type: "private",
  };
  private config?: types.TestUserConfig;
  /** The updates sent by the user to the bot. */
  public outgoing: GrammyTypes.Update[] = [];
  /** The responses sent by the bot to the user. */
  public incoming: {
    method: Methods<RawApi>;
    payload: Record<string, any>;
    signal: AbortSignal | undefined;
  }[] = [];

  private update_id = 10000;
  private message_id = 100;

  /**
   * Creates a test user and helps you to send mock updates as if they were sent
   * from a private chat to the bot.
   * @param bot The `Bot` instance, that to be tested.
   * @param config Custom configuration for the test user.
   */
  constructor(private bot: Bot<C>, config?: types.TestUserConfig) {
    this.config = config;
    if (config?.user) this.user = config.user;
    if (config?.chat) this.chat = config.chat;
    this.bot.botInfo = config?.botInfo ?? {
      id: 42,
      first_name: "Test Bot",
      is_bot: true,
      username: "test_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
    this.bot.api.config.use((_prev, method, payload, signal) => {
      if (method.startsWith("send")) this.message_id++;
      this.incoming.push({ method, payload, signal });
      return { ok: true, result: true } as any;
    });
  }

  /** Last response from bot */
  get last() {
    return this.incoming[this.incoming.length - 1];
  }

  /** Last sent update by the user */
  get lastSent() {
    return this.outgoing[this.outgoing.length - 1];
  }

  /** Clears the requests that the bot sent to the user. */
  clearIncoming(): void {
    this.incoming = [];
  }

  /** Clears the requests that the bot sent to the user. */
  clearOutgoing(): void {
    this.outgoing = [];
  }

  /**
   * Alternative of `bot.handleUpdate`. Sends a custom update to the bot.
   * @param update The custom update to be sent to the bot.
   * @returns The update sent.
   */
  async sendUpdate(update: GrammyTypes.Update): Promise<GrammyTypes.Update> {
    if ("message" in update) this.message_id++;
    this.update_id++;
    this.outgoing.push(update);
    await this.bot.handleUpdate(update);
    return update;
  }

  /**
   * Mocks an incoming message update. Sends a normal text message to the bot.
   * Helps to test `bot.hears`, `bot.on("message:text")` related updates.
   * @param options Can be the text to send or options.
   * @returns The update sent.
   */
  async sendMessage(
    options:
      | string
      | { text: string; entities?: GrammyTypes.MessageEntity[] }
        & types.MaybeReplied
        & types.Misc,
  ): Promise<GrammyTypes.Update> {
    const opts = typeof options === "string" ? { text: options } : options;
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        message_id: this.message_id,
        from: this.user,
        ...opts,
      },
    });
  }

  /**
   * Mocks a bot command update. You can also provide the `match` property with
   * the command text.
   * @param command The command to be sent. The preceding `/` can be omitted.
   * @returns The update sent.
   */
  async command(command: string): Promise<GrammyTypes.Update> {
    const commandName = command.replace(/[^a-zA-Z1-9_]/g, " ").split(" ")[0];
    return await this.sendMessage({
      text: `/${command}`,
      entities: [{
        type: "bot_command",
        offset: 0,
        length: 1 + commandName.length,
      }],
    });
  }

  /**
   * Mocks a message forwarding update.
   * @param options Details about the forwarding message.
   * @returns The update sent.
   */
  async forwardMessage(
    options: types.ForwardMessageOptions & types.ForwardTextMessageOptions,
  ): Promise<GrammyTypes.Update> {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        from: this.user,
        forward_from: options?.forward_from ?? {
          id: 1111111,
          first_name: "Forward First name",
          last_name: "Forward Last name",
          language_code: "en",
          is_bot: false,
          username: "forwarded_from_usr",
        },
        forward_date: Date.now(),
        forward_from_message_id: options?.forward_from_message_id,
        forward_from_chat: options?.forward_from_chat,
        forward_sender_name: options?.forward_sender_name,
        forward_signature: options?.forward_signature,
        is_automatic_forward: options?.is_automatic_forward,
        ...options.message,
      },
    });
  }

  /**
   * Forwards a text message to the bot.
   * @param text The text content of the forwarding message.
   * @param options Optional details about the forwarding message.
   * @returns The update sent.
   */
  async forwardTextMessage(
    text = "Forwarded Message",
    options?: types.ForwardTextMessageOptions,
  ): Promise<GrammyTypes.Update> {
    return await this.forwardMessage({
      message: {
        date: Date.now(),
        chat: this.chat,
        message_id: this.message_id,
        from: this.user,
        text,
      },
      ...options,
    });
  }

  /**
   * Mocks a Reply update.
   * @param messageToReplyTo The message you are replying to.
   * @returns The update sent.
   */
  async replyTo(
    messageToReplyTo: GrammyTypes.ReplyMessage,
    replyText = "Hello!",
  ): Promise<GrammyTypes.Update> {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        message_id: this.message_id,
        from: this.user,
        text: replyText,
        reply_to_message: messageToReplyTo,
      },
    });
  }

  /**
   * Sends a edited message update.
   * @param message The message you want to edit.
   * @returns The update sent.
   */
  async editMessage(message: GrammyTypes.Message): Promise<GrammyTypes.Update> {
    return await this.sendUpdate({
      update_id: this.update_id,
      edited_message: message,
    });
  }

  /** Edit a text message's text */
  async editMessageText(text: string): Promise<GrammyTypes.Update> {
    return await this.editMessage({
      date: Date.now() - 2000,
      chat: this.chat,
      from: this.user,
      message_id: this.message_id,
      text,
      edit_date: Date.now(),
    });
  }

  /** Sends a animation to the bot. */
  async sendAnimation(
    options:
      & { animation: GrammyTypes.Animation }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a audio to the bot. */
  async sendAudio(
    options:
      & { audio: GrammyTypes.Audio }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a document to the bot. */
  async sendDocument(
    options:
      & { document: GrammyTypes.Document }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a photo to the bot. */
  async sendPhoto(
    options:
      & { photo: GrammyTypes.PhotoSize[] }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a sticker to the bot. */
  async sendSticker(
    options: { sticker: GrammyTypes.Sticker } & types.MaybeReplied & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a video to the bot. */
  async sendVideo(
    options:
      & { video: GrammyTypes.Video }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a video note to the bot. */
  async sendVideoNote(
    options:
      & { video_note: GrammyTypes.VideoNote }
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /** Sends a voice message to the bot. */
  async sendVoice(
    options:
      & { voice: GrammyTypes.Voice }
      & types.MaybeCaptioned
      & types.MaybeReplied
      & types.Misc,
  ) {
    return await this.sendUpdate({
      update_id: this.update_id,
      message: {
        date: Date.now(),
        chat: this.chat,
        from: this.user,
        message_id: this.message_id,
        ...options,
      },
    });
  }

  /**
   * Sends a inline query update to the bot.
   * @param query The query.
   * @param offset Offset of the query.
   * @returns The update sent.
   */
  async inlineQuery(query = "", offset = "") {
    return await this.sendUpdate({
      update_id: this.update_id,
      inline_query: {
        id: "134567890097",
        from: this.user,
        query,
        offset,
      },
    });
  }

  /**
   * Mocks a update that user clicking a inline button.
   * @param callbackQuery The callback query. Or just the callback data.
   * @returns The update sent.
   */
  async clicks(callbackQuery: string | GrammyTypes.CallbackQuery) {
    return await this.sendUpdate({
      update_id: this.update_id,
      callback_query: typeof callbackQuery === "string"
        ? {
          chat_instance: "3131313",
          from: this.user,
          id: "313131",
          data: callbackQuery,
        }
        : callbackQuery,
    });
  }

  // /**
  //  * Chooses a inline result from the list of results.
  //  * @param chosenInlineResult Inline result that user selects.
  //  * @returns The update sent.
  //  */
  //  async chooseInlineResult(chosenInlineResult: GrammyTypes.ChosenInlineResult) {
  //   return await this.sendUpdate({
  //     update_id: this.update_id,
  //     chosen_inline_result: chosenInlineResult,
  //   });
  // }

  async pinMessage() {
  }

  async blockBot() {
  }

  async startBot() {
  }

  async restartBot() {
  }
}
