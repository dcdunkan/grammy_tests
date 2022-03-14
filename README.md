# 🧪 grammY Tests

A small testing framework for Telegram bots written using
[grammY](https://grammy.dev). Just a try, probably not a good choice as a grammY
bot testing framework. It's still work in progress.

It's currently written in [TypeScript](https://typescript.org) on
[Deno](https://deno.land/).

Checkout the test examples in the [tests](/tests/) folder. The file
[`bot.ts`](/tests/bot.ts) contains the logic of your bot.
[`user.test.ts`](/tests/user.test.ts) has an example
[test user instance](#testuser), which sends fake updates and checks whether
your bot replies as expected or not.

#### TODO

- Add more update sources like, `Group` and `Channel` (more chat types).
- Add more practical test cases/examples.

### `TestUser`

Represents a Telegram Private chat/User. They can send messages to the bot,
commands, medias, forward messages to, reply to bot's messages, edit a message,
query inline and click a button!
