> **Warning**: Unstable as it is a work in progress. Things could change.

# Test framework for grammY

A **work-in-progress** framework for testing Telegram bots made using the grammY
Telegram bot framework. Read more about grammY here: **<https://grammy.dev>**. grammY is a great framework and it's ecosystem provides everything for developing a bot.

However, grammY lacks one important thing. A testing framwork, a good one. And this repository is only an
attempt to make one good. I've regretted some choices that I made in the past about the architecture of the library. So, I'm re-writing the whole thing until I get it right.

#### Installation

**Note**: This library is **only available** for Deno at the moment. Node.js support will land when the library is stable and published on <https://deno.land/x>.

You can import from GitHub raw URLs for now,
as this haven't been published on <https://deno.land/x> yet.

```ts
// Consider using versioned (commit) URLs.
import { Chats } from "https://raw.githubusercontent.com/dcdunkan/tests/refine-2/mod.ts";
```

### Getting Started

Here is a simple setup showing how you can test your bot. Note that the example is pretty basic at the moment. It'll be extended more as the implementation progresses.

```ts
// @filename: ./bot.ts

import { Bot } from "https://deno.land/x/grammy/mod.ts";
export const bot = new Bot("token");

bot.command("start", async (ctx) => {
  const sent = await ctx.reply("How you doin'?");
  console.log(sent); // Dynamically generated API result!
});

// DO NOT START YOUR BOT HERE. READ ABOUT IT BELOW.
```

```ts
// @filename: ./bot_test.ts

import { bot } from "./bot.ts";
// and some assertion functions for testing:
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

// `chats` is like a whole Telegram instance.
const chats = new Chats(bot);

// create a user to interact with the bot.
const user = chats.newUser({/* details of the user */});

// setup a event handler if you like to:
user.onEvent("message", (message) => {
  // do something with the message. or,
  console.log("Message recieved");
});

// demo: send a message to the bot.
await user.sendMessage("Hello there!");

// nice. let's *test* something basic:
Deno.test("Start command", async () => {
  // a command (there are other methods as well):
  await user.command("start");

  // so the bot replies. and after the bot handles it,
  // its response payload becomes available in the last object.
  assertEquals(user.last.text, "How you doin'?");
});
```

> > its response payload becomes available in the `last` object.
>
> `chats.responses` is an array containing all of the responses and `chats.updates` is another array containing all the
> updates that have been sent to the user.

That's a simple enough setup. Now you can run the test using `deno test`, and you should see a
bunch of green OKs printing out in the terminal.

**Warning**: Never start your bot in long polling (`bot.start()`). It will cause issues with
installing the transformer middlewares which is necessary for the test framework
to function.

### How Does This Work?

First consider reading what the Official grammY Documentation says about testing your bots: <https://grammy.dev/advanced/deployment.html#testing>.

This framework handles takes care of what you read there:

- It handles all the outgoing API requests (from the bot) behind the curtain; and the dynamically generated API responses respects the environment the bot is in. So, it should work very well with get* calls and all.
- Generating updates to force-test the bot can be hard and tedious. This framework provides enough methods to cover almost all of your needs.

> A much more detailed explanation will be added here later on.

---

<div align="center">

Licensed under MIT (c) 2023 Dunkan

</div>