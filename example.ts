import { Chats } from "./chats.ts";
import { Bot, Context } from "https://deno.land/x/grammy@v1.15.1/mod.ts";

/// Setup Bot
type MyContext = Context; // Can be extended.

const bot = new Bot<MyContext>("token");

bot.command("start", async (ctx) => {
  /* const sent = */ await ctx.reply("Hello.");
  // console.log(sent); // Dynamically generated!
});

/// Test setup
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
  owner: {
    status: "creator",
    user: { id: 345, first_name: "The Owner", is_bot: false },
    is_anonymous: false,
  },
});

user.join(group.chat_id);
user.onEvent("message", () => {
  // console.log("User recieved a message from the bot saying", m.text);
});
// Send a message to the bot.
// await user.sendMessage("Hello");
await user.command("start");
// Send a message to the group.
await user.in(group).sendMessage("Hi everyone!");

// or first declare a state of the user:
const userInGroup = user.in(group);
await userInGroup.sendMessage("Hi again!");
// and other properties can be accesses as well:
// userInGroup.sendVideo(...)
