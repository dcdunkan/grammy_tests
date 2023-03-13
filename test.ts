import { Chats } from "./chats.ts";
import { Bot } from "https://deno.land/x/grammy@v1.14.1/mod.ts";

const bot = new Bot("token");
const chats = new Chats(bot);

const user = chats.newUser({
  id: 123,
  blocked: false,
  username: "mak",
  first_name: "kek",
  last_name: "none",
  language_code: "en",
});

const group = chats.newGroup({
  id: 234,
  title: "Movie Night",
  creator: {
    status: "creator",
    user: { id: 345, first_name: "The Owner", is_bot: false },
    is_anonymous: false,
  },
});

user.join(group.chat_id);
// Send a message to the bot.
user.sendMessage("Hello");
// Send a message to the group.
user.in(group).sendMessage("Hi everyone!");

// or first declare a state of the user:
const userInGroup = user.in(group);
userInGroup.sendMessage("Hi again!");
// and other properties can be accesses as well:
// userInGroup.sendVideo(...)
