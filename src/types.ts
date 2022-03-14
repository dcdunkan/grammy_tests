import { GrammyTypes } from "../deps.ts";

export interface TestUserConfig {
  user?: GrammyTypes.User;
  chat?: GrammyTypes.Chat.PrivateChat;
  botInfo?: GrammyTypes.UserFromGetMe;
}

export interface ForwardTextMessageOptions {
  forward_from?: GrammyTypes.User;
  forward_date?: number;
  forward_from_chat?: GrammyTypes.Chat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  is_automatic_forward?: true;
}

export interface ForwardMessageOptions {
  message: GrammyTypes.Message;
}

export interface Captionable {
  caption?: string;
  caption_entities?: GrammyTypes.MessageEntity[];
}

export interface MaybeReplied {
  reply_to_message?: GrammyTypes.ReplyMessage;
}

export interface Misc {
  via_bot?: GrammyTypes.User;
}

export interface GroupAndChannelMisc {
  has_protected_content?: true;
  author_signature?: string;
}
