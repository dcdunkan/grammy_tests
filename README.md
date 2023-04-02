> **Warning**: Unstable.

# Test framework for grammY

A **work-in-progress** framework for testing Telegram bots made using the grammY
Telegram bot framework. Read more about grammY here: **<https://grammy.dev>**. grammY is a great framework and it's ecosystem provides everything for developing Telegram bots.

However, grammY lacks one important thing. A testing framwork, a good one. And this repository is only an
attempt to make one. I've regretted some choices that I made in the past about the architecture of the library. So, I'm re-writing the whole thing until I get it right.

#### Installation

**Note**: This library is **only available for Deno** at the moment. Node.js support will land when the library is stable and published on <https://deno.land/x>.

You can import from GitHub raw URLs for now,
as this haven't been published on <https://deno.land/x> yet.

```ts
import { Chats } from "https://raw.githubusercontent.com/dcdunkan/tests/refine-2/mod.ts";
```

> The URL above imports from this branch. It is recommended to use a versioned URL than this.

## Writing Tests

Here is a simple setup showing how you can test your bot. Note that the example is pretty basic at the moment. It'll be extended more as the implementation progresses.

**`bot.ts`**

This file is supposed to export the `Bot` instance. You can have the logic and handlers of the bot in this file.

```ts
import { Bot } from "https://deno.land/x/grammy/mod.ts";

export const bot = new Bot(""); // <-- Put your token inside the quotes.

bot.command("start", (ctx) => ctx.reply("How you doin'?"));
```

> **Warning**
> 
> Never start your bot in long polling (`bot.start()`) in `bot.ts` file (where you export the bot). It will cause issues with installing the transformer middlewares which is necessary for the test framework to function. To start your bot, create another file (perhaps `main.ts`?), import the bot there, start it there, and run that file.

**`bot_test.ts`**

```ts
import { Chats } from "...";
import { bot } from "./bot.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const chats = new Chats(bot);

// Create a user to interact with the bot.
const user = chats.newUser({/* details of the user */});

// Send a message to the bot.
await user.sendMessage("Hello there!");

// Looking good.

// Let's actually test something: The start command.
Deno.test("Start command", async () => {
  await user.command("start");
  // So the bot replies, and after the bot handles it,
  // it's response payload becomes available in the last object.
  assertEquals(user.last.text, "How you doin'?");
});
```

There are methods other than just `sendMessage` and `command`. You can try them out. If you want to see a more up-to-date (not exactly, but yes) example, that is used for testing the implementation while developing this library, checkout the **[example.ts](./example.ts)** file.

> **TIP**
>
> > its response payload becomes available in the `last` object.
>
> `chats.responses` is an array containing all of the responses and `chats.updates` is another array containing all the
> updates that have been sent to the user.

That's a simple enough setup. Now you can run the test using `deno test`, and you should see a
bunch of green OKs printing out in the terminal.

## How Does This Work?

First consider reading what the Official grammY Documentation says about testing your bots: <https://grammy.dev/advanced/deployment.html#testing>.

This framework handles takes care of what you read there:

- It handles all the outgoing API requests (from the bot) behind the curtain; and the dynamically generated API responses respects the environment the bot is in. So, it should work very well with all of the methods.
- Generating updates for force-testing the bot can be hard and tedious. This framework provides enough methods to cover almost all of your needs.

> A much more detailed explanation will be added here later on.

---

<div align="center">

Licensed under MIT (c) 2023 Dunkan

</div>