import { Bot, Context as BaseC, session, SessionFlavor } from "./test_deps.ts";
export type MyContext = BaseC & SessionFlavor<{ counter: number }>;
export const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN")!);

bot.use(session({
  initial: () => ({ counter: 0 }),
}));

bot.command("start", async (ctx, next) => {
  await ctx.reply("Hello!");
  await next();
});

bot.command("reset", async (ctx) => {
  const old = ctx.session.counter;
  ctx.session.counter = 0;
  await ctx.reply("Reset!");
  if (old === 0) {
    return await ctx.reply("(It was, already!)");
  }
});

bot.on("msg:forward_date", async (ctx) => {
  if (ctx.message?.forward_from?.is_bot) {
    return await ctx.reply("It's from... a bot?");
  }
  await ctx.reply(
    `It's forwarded from ${ctx.message?.forward_from?.id}, right?`,
  );
});

bot.on("edited_message:photo", async (ctx) => {
  await ctx.reply(
    `That's an edited picture in ${ctx.editedMessage.message_id}`,
  );
});

bot.on("edited_message", async (ctx) => {
  await ctx.reply(`You edited: ${ctx.editedMessage.message_id}`);
});

bot.on("message:text", async (ctx, next) => {
  ctx.session.counter++;
  await ctx.reply(ctx.session.counter.toString());
  await next();
});

bot.on("message:animation", async (ctx) => {
  await ctx.reply("That's a cool animation!");
});

bot.on("message:audio", async (ctx) => {
  await ctx.reply("That song hits different.");
});

bot.on("message:document", async (ctx) => {
  await ctx.reply("What's that? Wait a sec. Let me check it.");
});

bot.on("message:photo", async (ctx) => {
  if (ctx.message.photo.pop()?.height! > 1920) {
    return await ctx.reply("I can't process images that big!");
  }
  await ctx.reply("Let me process the photo. Please wait...");
});

bot.on("message:sticker", async (ctx) => {
  await ctx.reply("I got another one, here we go!");
  await ctx.replyWithSticker("sticker_id");
});

bot.on("message:video", async (ctx) => {
  await ctx.reply("Oh, you! You rickrolled me again!");
});

bot.on("message:video_note", async (ctx) => {
  await ctx.reply("Did you trimmed your beard?");
});

bot.on("message:voice", async (ctx) => {
  await ctx.reply("Your voice is actually pretty good, I liked it.");
});

bot.on("message", async (ctx, next) => {
  if (!ctx.message.reply_to_message) return await next();
  await ctx.reply(
    `You are replying to ${ctx.message.reply_to_message.message_id}`,
  );
});

bot.on("inline_query", async (ctx) => {
  await ctx.answerInlineQuery([{
    type: "article",
    id: "grammy-website",
    title: "grammY",
    input_message_content: {
      message_text:
"<b>grammY</b> is the best way to create your own Telegram bots. \
They even have a pretty website! 👇",
      parse_mode: "HTML",
    },
    reply_markup: {
      inline_keyboard: [[{
        text: "grammY website",
        url: "https://grammy.dev/",
      }]],
    },
    url: "https://grammy.dev/",
    description: "The Telegram Bot Framework.",
  }]);
});

// Not commonly used, and you need to enable "Inline Feedback" feature for your
// bot in the settings of BotFather. So, there is no proper test.
bot.on("chosen_inline_result", async (ctx) => {
  console.log(ctx.chosenInlineResult);
  await ctx.reply(`You chose: ${ctx.chosenInlineResult.result_id}`);
});

bot.callbackQuery("click-me", async (ctx) => {
  await ctx.answerCallbackQuery("Nothing here :)");
});
