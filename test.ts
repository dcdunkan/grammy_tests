import { Chats } from "./chats.ts";
import { Bot } from "https://deno.land/x/grammy@v1.15.1/mod.ts";

/// Setup Bot
const bot = new Bot("token");

/* bot.command("start", async (ctx) => {
  const sent = await ctx.reply("Hello.");
  console.log(sent); // Dynamically generated!
}); */

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
  creator: {
    status: "creator",
    user: { id: 345, first_name: "The Owner", is_bot: false },
    is_anonymous: false,
  },
});

user.join(group.chat_id);
user.onNotification("message", (m) => {
  console.log("User recieved a message from the bot saying", m.text);
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
