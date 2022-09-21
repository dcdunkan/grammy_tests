// TODO: Remove usage of these types from other source files
// and define and use types there.

import { Types } from "./deps.ts";

export type User = Omit<Types.User, "is_bot">;

export interface ForwardMessageOptions {
  animation?: Types.Animation;
  audio?: Types.Audio;
  author_signature?: string;
  caption?: string;
  caption_entities?: Types.MessageEntity[];
  contact?: Types.Contact;
  dice?: Types.Dice;
  document?: Types.Document;
  edit_date?: number;
  entities?: Types.MessageEntity[];
  forward_date?: number;
  forward_from?: Types.User;
  forward_from_chat?: Types.Chat;
  forward_from_message_id?: number;
  forward_sender_name?: string;
  forward_signature?: string;
  game?: Types.Game;
  has_protected_content?: true;
  is_automatic_forward?: true;
  location?: Types.Location;
  media_group_id?: string;
  photo?: Types.PhotoSize[];
  poll?: Types.Poll;
  reply_markup?: Types.InlineKeyboardMarkup;
  reply_to_message?: Types.ReplyMessage;
  sender_chat?: Types.Chat;
  sticker?: Types.Sticker;
  text?: string;
  venue?: Types.Venue;
  via_bot?: Types.User;
  video?: Types.Video;
  video_note?: Types.VideoNote;
  voice?: Types.Voice;
}

export interface MaybeCaptioned {
  caption?: string;
  caption_entities?: Types.MessageEntity[];
}

export interface MaybeReplied {
  reply_to_message?: Types.ReplyMessage;
}

export interface Misc {
  via_bot?: Types.User;
}

export interface GroupAndChannelMisc {
  has_protected_content?: true;
  author_signature?: string;
}
