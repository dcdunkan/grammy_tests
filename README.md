# 🧪 grammY Tests

**Work in progress!**

Testing framework for Telegram bots written using [grammY](https://grammy.dev).
Written in [TypeScript](https://typescript.org) and [Deno](https://deno.land/).

Check out the test examples in the [tests](/tests/) folder. The file
[bot.ts](/tests/bot.ts) contains the logic of the bot we want to write tests
for. [user.test.ts](/tests/user.test.ts) has an example of
[test user instance](#testuser), which sends fake updates and checks whether
your bot replies as expected or not.

## Writing tests

Export the
[`Bot`](https://doc.deno.land/https://deno.land/x/grammy/mod.ts/~/Bot) instance
you created, and import to the test file.

```ts
import { bot } from "./path/to/your/bot/file.ts";
```

Create a chat "manager" instance and create a user. With that user, we can send
fake updates to the bot and make sure that the bot responds as expected.

```ts
import { Chats } from "https://raw.githubusercontent.com/dcdunkan/tests/main/mod.ts";

// A testing helper function from Deno standard library.
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const chats = new Chats(bot);
const user = chats.newUser({
  id: 1234567890,
  first_name: "Test user",
  username: "testuser",
});
```

Consider the following simple program as the bot's logic.

```ts
bot.command("start", async (ctx) => {
  await ctx.reply("Hello there!");
});

bot.hears("Hi", async (ctx) => {
  await ctx.reply("Hi!");
});
```

To make sure that our bot works fine, let's add some tests.

Does the bot sends "Hello there!" as expected, for `/start` command? Does the
bot reply "Hi!" upon hearing "Hi" from the user?

```ts
Deno.test("start command", async () => {
  await user.command("start");
  assertEquals(user.last.payload.text, "Hello there!");
});

Deno.test("hi", async () => {
  await user.sendMessage("Hi");
  assertEquals(user.last.payload.text, "Hi!");
});
```

- `user.command("start");`

  Sends the start command.

  `user.sendMessage("Hi");`

  Sends text message.

- `user.last.payload.text`

  `user.last` contains the last incoming response: The last response sent by the
  bot. In the first case, it might look like this:

  ```ts
  {
    "method": "sendMessage",
    "payload": {
      "chat_id": 1234567890,
      "text": "Hello there!"
    },
    "signal": undefined
  }
  ```

  We can access the text that bot is replying using `user.last.payload.text` and
  compare it with the expecting response using `assertEquals`.

Now let's run the tests using
[Deno's built-in test runner](https://deno.land/manual/testing).

```bash
deno test # You might pass permissions flags like --allow-env if needed.
```

If everything's fine, and your tests were successful, which means your bot is
working as expected, you will see the `deno test` command printing a bunch of
OK-s. Awesome! 🎉

## Chat types

### `TestUser`

Defined at: [src/TestUser.ts](/src/TestUser.ts)

Telegram user (Private chat). They can send, edit, forward, pin messages; send
commands, media; query inline and click buttons. And stop, block, restart the
bot.

## TODO

- Add `Group`, `SuperGroup`, `Channel` chat types.
- Return proper API request results.

  Example use case:
  ```ts
  const message = await ctx.reply("Hello!");
  // Currently `message` is just `true`.
  console.log(message.message_id);
  // => undefined
  ```
- Add more _practical_ test cases and examples.

---

<p align="center">
  <samp>
    <a href="https://github.com/dcdunkan/tests/blob/main/LICENSE">Licensed under MIT</a>
  </samp>
</p>
