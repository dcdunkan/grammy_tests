import { bot, MyContext } from "./bot.ts";
import { Chats } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.127.0/testing/asserts.ts";

const chats = new Chats<MyContext>(bot);

const user = chats.newUser({
  first_name: "Test user",
  id: 1234567890,
});

Deno.test("hello-hi", async (t) => {
  await t.step("hello", async () => {
    await user.command("start");
    assertEquals(user.last.payload.text, "Hello there!");
  });

  await t.step("hi", async () => {
    await user.sendMessage("Hi");
    assertEquals(user.last.payload.text, "Hi!");
  });

  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("message counter", async (t) => {
  await t.step("increase counter to 3", async () => {
    await user.sendMessage("blah");
    assertEquals(user.last.payload.text, "1");
    await user.sendMessage("blah");
    await user.sendMessage("blah");

    assertEquals(user.outgoing.length, 3);
    assertEquals(user.incoming.length, 3);
  });

  await t.step("reset", async () => {
    await user.command("reset");
    assertEquals(user.last.payload.text, "Reset!");
  });

  await t.step("increase after resetting", async () => {
    await user.sendMessage("blah");
    assertEquals(user.last.payload.text, "1");
    await user.command("reset");
    assertEquals(user.last.payload.text, "Reset!");
  });

  assertEquals(user.outgoing.length, 6);
  assertEquals(user.incoming.length, 6);
  user.clearIncoming();
  user.clearOutgoing();

  // If the reset was already called, the bot sends two messages -->
  // 1. "Reset!" 2. "(It was, already!)".
  await t.step("reset again", async () => {
    await user.command("reset");

    assertEquals(
      user.incoming[user.incoming.length - 2].payload.text,
      "Reset!",
    );
    assertEquals(user.last.payload.text, "(It was, already!)");
  });

  assertEquals(user.outgoing.length, 1);
  assertEquals(user.incoming.length, 2); // + 1 because double replies from last /reset.
  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("forwarded messages", async (t) => {
  await t.step("text from user", async () => {
    await user.forwardTextMessage();
    const id = user.lastSent.message?.forward_from?.id;
    assertEquals(user.last.payload.text, `It's forwarded from ${id}, right?`);
  });

  await t.step("photo from a custom user", async () => {
    await user.forwardMessage({
      forward_from: {
        first_name: "Another user",
        id: 14141414141,
        is_bot: false,
      },
      message: {
        chat: user.chat,
        date: Date.now(),
        message_id: 10000,
        photo: [{
          file_id: "hgbfbfiebfeijfbef",
          file_unique_id: "ewfvewfibfiewbfeifbvefi",
          height: 1920,
          width: 1080,
          file_size: 2573234,
        }],
      },
    });

    assertEquals(
      user.last.payload.text,
      `It's forwarded from 14141414141, right?`,
    );
  });

  await t.step("text from bot", async () => {
    await user.forwardMessage({
      forward_from: {
        is_bot: true,
        first_name: "A bot",
        id: 14562378,
        username: "fwd_msgs_from_bot",
      },
      message: {
        chat: user.chat,
        date: Date.now(),
        message_id: 10000,
        text: "Hey bot!",
      },
    });

    assertEquals(
      user.last.payload.text,
      "It's from... a bot?",
    );
  });

  assertEquals(user.incoming.length, 3);
  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("reply to message", async () => {
  await user.replyTo({
    reply_to_message: undefined,
    chat: user.chat,
    date: Date.now(),
    message_id: 333,
  });

  assertEquals(
    user.last.payload.text,
    `You are replying to 333`,
  );

  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("edited message", async (t) => {
  await t.step("message text", async () => {
    await user.editMessageText("Yeshh");
    assertEquals(
      user.last.payload.text,
      `You edited: ${user.lastSent.edited_message?.message_id}`,
    );
  });

  await t.step("edit photo", async () => {
    const { edited_message } = await user.editMessage({
      date: Date.now() - 2000,
      chat: user.chat,
      from: user.user,
      message_id: 1365,
      photo: [{ file_id: "dd", file_unique_id: "df", height: 33, width: 33 }],
      edit_date: Date.now(),
    });
    assertEquals(
      user.last.payload.text,
      `That's an edited picture in ${edited_message?.message_id}`,
    );
  });

  assertEquals(user.incoming.length, 2);
  assertEquals(user.outgoing.length, 2);

  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("media handling", async (t) => {
  await t.step("animation", async () => {
    await user.sendAnimation({
      animation: {
        duration: 10,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
      },
    });
    assertEquals(user.last.payload.text, "That's a cool animation!");
  });

  await t.step("audio", async () => {
    await user.sendAudio({
      audio: {
        duration: 10,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(user.last.payload.text, "That song hits different.");
  });

  await t.step("document", async () => {
    await user.sendDocument({
      document: {
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(
      user.last.payload.text,
      "What's that? Wait a sec. Let me check it.",
    );
  });

  await t.step("photo", async () => {
    await user.sendPhoto({
      photo: [{
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 1920,
        width: 1080,
      }],
    });
    assertEquals(
      user.last.payload.text,
      "Let me process the photo. Please wait...",
    );
  });

  await t.step("photo (higher than height limit)", async () => {
    await user.sendPhoto({
      photo: [{
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 2000, // max 1920 (Set by the bot; NOT an official limit)
        width: 1080,
      }],
    });
    assertEquals(
      user.last.payload.text,
      "I can't process images that big!",
    );
  });

  await t.step("sticker", async () => {
    await user.sendSticker({
      sticker: {
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
        is_animated: true,
        is_video: true,
      },
    });
    assertEquals(
      user.incoming[user.incoming.length - 2].payload.text,
      "I got another one, here we go!",
    );

    assertEquals(
      user.last.payload.sticker,
      "sticker_id",
    );
  });

  await t.step("video", async () => {
    await user.sendVideo({
      video: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
      },
    });
    assertEquals(user.last.payload.text, "Oh, you! You rickrolled me again!");
  });

  await t.step("video_note", async () => {
    await user.sendVideoNote({
      video_note: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        length: 30,
      },
    });
    assertEquals(user.last.payload.text, "Did you trimmed your beard?");
  });

  await t.step("animation", async () => {
    await user.sendVoice({
      voice: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(
      user.last.payload.text,
      "Your voice is actually pretty good, I liked it.",
    );
  });

  assertEquals(user.outgoing.length, 9);
  assertEquals(user.incoming.length, 10);

  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("inline query", async (t) => {
  await t.step("query", async () => {
    await user.inlineQuery();
    assertEquals(user.last.payload.results[0].id, "grammy-website");
  });

  assertEquals(user.incoming.length, 1);

  // await t.step("choose", async () => {
  //   await user.chooseInlineResult({
  //     from: user.user,
  //     query: "",
  //     result_id: "grammy-website",
  //     inline_message_id: "330",
  //   });
  //   assertEquals(user.last.payload.text, "You chose: grammy-website");
  // });

  user.clearIncoming();
  user.clearOutgoing();
});

Deno.test("callback query", async (t) => {
  await t.step("click cb data", async () => {
    await user.clicks("click-me");
    assertEquals(user.last.payload.text, "Nothing here :)");
  });

  assertEquals(user.outgoing.length, 1);
  assertEquals(user.incoming.length, 1);

  user.clearOutgoing();
  user.clearIncoming();
});
