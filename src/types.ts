import { GrammyTypes } from "../deps.ts";

export type User = Omit<GrammyTypes.User, "is_bot">;

export interface ForwardTextMessageOptions {
  forward_from?: GrammyTypes.User;
  forward_date?: number;
  forward_from_chat?: GrammyTypes.Chat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  is_automatic_forward?: true;
}

export interface ForwardMessageOptions2 {
  animation?: GrammyTypes.Animation;
  audio?: GrammyTypes.Audio;
  author_signature?: string;
  caption?: string;
  caption_entities?: GrammyTypes.MessageEntity[];
  contact?: GrammyTypes.Contact;
  dice?: GrammyTypes.Dice;
  document?: GrammyTypes.Document;
  edit_date?: number;
  entities?: GrammyTypes.MessageEntity[];
  forward_date?: number;
  forward_from?: GrammyTypes.User;
  forward_from_chat?: GrammyTypes.Chat;
  forward_from_message_id?: number;
  forward_sender_name?: string;
  forward_signature?: string;
  game?: GrammyTypes.Game;
  has_protected_content?: true;
  is_automatic_forward?: true;
  location?: GrammyTypes.Location;
  media_group_id?: string;
  photo?: GrammyTypes.PhotoSize[];
  poll?: GrammyTypes.Poll;
  reply_markup?: GrammyTypes.InlineKeyboardMarkup;
  reply_to_message?: GrammyTypes.ReplyMessage;
  sender_chat?: GrammyTypes.Chat;
  sticker?: GrammyTypes.Sticker;
  text?: string;
  venue?: GrammyTypes.Venue;
  via_bot?: GrammyTypes.User;
  video?: GrammyTypes.Video;
  video_note?: GrammyTypes.VideoNote;
  voice?: GrammyTypes.Voice;
}

export interface ForwardMessageOptions {
  message: GrammyTypes.Message;
}

export interface MaybeCaptioned {
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
