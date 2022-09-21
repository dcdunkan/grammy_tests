<h1 align="center">grammY Tests</h1>

**Work in progress!**

Unofficial testing framework for Telegram bots written using
[grammY](https://grammy.dev). This library currently only works with
[Deno](https://deno.land/).

Check out the test examples in the [tests](./tests/) folder. The file
[bot.ts](./tests/bot.ts) contains an example logic of the bot we want to write
tests for. [user.test.ts](./tests/user.test.ts) has an example of
[test user instance](#testuser), which sends fake updates and checks whether
your bot replies as expected or not.

## Writing tests

Export the
[`Bot`](https://doc.deno.land/https://deno.land/x/grammy/mod.ts/~/Bot) instance
you created.

```ts
import { Bot } from "https://deno.land/x/grammy/mod.ts";
export const bot = new Bot("BOT_TOKEN");
// ...Your bot's handlers and logic goes here.
```

For now, consider the following simple program as the bot's logic.

```ts
bot.command("start", (ctx) => ctx.reply("Hello there!"));
bot.hears("Hi", (ctx) => ctx.reply("Hi!"));
```

Now the bot we are testing has a start command handler which replies "Hello
there!" and a "Hi" listener which says "Hi!" back.

But, to make sure that our bot works as we want it to be, let's add some tests.

First, Import the bot object we created first to the test file.

```ts
import { bot } from "./path/to/your/bot/file.ts";
```

Create a chat "manager" instance and create a user. With that user, we can send
fake updates to the bot and make sure that the bot responds as expected.

```ts
import { Chats } from "https://ghc.deno.dev/dcdunkan/tests@main/mod.ts";

// A testing helper function from Deno standard library.
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const chats = new Chats(bot);
const user = chats.newUser({
  id: 1234567890,
  first_name: "Test user",
  username: "test_user",
});
```

- Does the bot send "Hello there!" as expected, for the <samp>/start</samp>
  command?
  ```ts
  Deno.test("start command", async () => {
    await user.command("start");
    assertEquals(user.last.text, "Hello there!");
  });
  ```

  <ins>What's happening here?</ins>

  <samp><b>user.<i>command</i>("start");</b></samp>

  is going to send a <samp>/start</samp> command to the bot. Then we asserts the
  text reply of the bot `user.last.text`, to the expected reply, "Hello,
  there!". If the logic is right, our test should pass.

- Does the bot reply "Hi!" upon hearing "Hi" from the user?
  ```ts
  Deno.test("hi", async () => {
    await user.sendMessage("Hi");
    assertEquals(user.last.text, "Hi!");
  });
  ```

  <ins>What's happening here?</ins>

  <samp><b>user.<i>sendMessage</a></i>("Hi");</b></samp>

  This sends a text message saying "Hi" to the bot. According to the hears
  listener logic, the bot should be replying "Hi!" back. Just like with the
  start command, we can compare the expected reply against `user.last.text`,
  which points to the text in the last message the bot sent.

Now let's run the tests using
[Deno's built-in test runner](https://deno.land/manual/testing).

```bash
deno test # You might pass permission flags like --allow-env if needed.
```

If everything's fine, and your tests were successful, which means your bot is
working as expected, you will see the `deno test` command logging a bunch of
green OK-s. It works! 🎉

### Updates and Responses

<samp><b>user.last</b></samp> contains payload of the last response sent by the
bot. In the first case, it'll look like:

```jsonc
{
  "chat_id": 1234567890,
  "text": "Hello there!"
}
```

- We can access the text that bot is replying from `user.last.text`
- The actual last full response will be the last element of `user.responses`
- You can also get the updates (requests) the user sent from `user.updates`
- The last sent update is `user.lastUpdate`

## Chat types

### <samp>TestUser</samp>

Defined at: <samp> [src/chat_types/user.ts](./src/chat_types/user.ts)</samp>

Represents a Telegram user (Private chat). They can send, edit, forward, pin
messages; send commands, media; query inline and click buttons. And stop, block,
restart the bot.

---

<p align="center">
  <samp>
    <a href="./LICENSE">Licensed under MIT</a>
  </samp>
</p>
