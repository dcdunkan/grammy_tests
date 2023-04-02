## Test framework for grammY

A work in progress framework for testing Telegram bots made using the grammY
Telegram bot framework. Read more about grammY here: <https://grammy.dev>. The
only thing grammY lacks is a good testing framework. This repository is only an
attempt to make it possible.

**Note**: The framework is currently only for Deno. Node.js support will be added
iff this is properly finished.

Not many features at the moment:

<!-- All chat environments synced very well, btw. -->

- Dynamic API responses.
- Supports all types of chats.

#### Installation

As said, currently available only for Deno. You can import from GitHub raw URLs
as this not have been published in <https://deno.land/x> yet.

```ts
// consider using versioned (commit) urls tho.
import { Chats } from "https://raw.githubusercontent.com/dcdunkan/tests/refine-2/mod.ts";
```

### Usage

Here is a simple example:

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
> the `responses` contains all of the responses and `updates` contains all the
> updates that have been sent to the user.

So, that's a simple enough setup. Now if you run the test using `deno test`, you should see a
bunch of green OKs printing out in the terminal.

**WARNING**: Never start your bot in the bot.ts. It will cause issues with
installing the transformer middlewares which is necessary for the test framework
to function.

### How Does This Work?

Consider reading what official grammY documentation says about testing your
bots: <https://grammy.dev/advanced/deployment.html#testing>.

This framework handles takes care of what you read: it handles all the outgoing
API requests (from the bot) very well; and the results are completely dynamic!

Also with easy methods and the good enough chat environment mockings, this
framework helps you to write tests very easily.

A much more detailed explanation will be added here later on.

---

Licensed under MIT | (c) 2023 Dunkan