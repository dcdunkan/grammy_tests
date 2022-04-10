import { bot, MyContext } from "./bot.ts";
import { /* ApiPayload, */ Chats } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.133.0/testing/asserts.ts";

const chats = new Chats<MyContext>(bot);
const user = chats.newUser({
  id: 1234567890,
  first_name: "Test",
  last_name: "User",
  username: "test_usr",
  language_code: "en",
});

const user2 = chats.newUser({
  id: 2323232323,
  first_name: "Test",
  last_name: "user 2",
  username: "test_usr2",
});

Deno.test("Handle Commands and Hi message", async ({ step }) => {
  await step("/start Command", async () => {
    await user.command("start");
    await user2.command("start");
    // const payload = user.last as ApiPayload<"sendMessage">;
    assertEquals(user.last.text, "Hello there!");
    assertEquals(user2.last.text, "Hello there!");
  });

  await step("Reply 'Hi!' to 'Hi'", async () => {
    await user.sendMessage("Hi");
    assertEquals(user.last.text, "Hi!");
  });

  assertEquals(user.updates.length, 2);
  assertEquals(user.responses.length, 2);
  assertEquals(user2.updates.length, 1);
  assertEquals(user2.responses.length, 1);

  user.clear();
  user2.clear();
});

Deno.test("Message Counter (Session usage)", async ({ step }) => {
  await step("Set count to 3", async () => {
    await user.sendMessage("Message 1");
    await user.sendMessage("Message 2");
    await user.sendMessage("Message 3");

    assertEquals(user.updates.length, 3);
    assertEquals(user.responses.length, 3);
  });

  await step("Reset count command", async () => {
    await user.command("reset");
    assertEquals(user.last.text, "Reset!");
  });

  await step("Increase count after resetting", async () => {
    await user.sendMessage("Message (again)");
    assertEquals(user.last.text, "1");

    await user.command("reset");
    assertEquals(user.last.text, "Reset!");
  });

  assertEquals(user.updates.length, 6);
  assertEquals(user.responses.length, 6);

  user.clear();

  // If the reset was already called, the bot sends two messages -->
  // 1. "Reset!"; and 2. "(It was, already!)".
  await step("Reset again when already reset", async () => {
    await user.command("reset");

    assertEquals(user.responses.at(-2)?.payload.text, "Reset!");
    assertEquals(user.last.text, "(It was, already!)");
  });

  assertEquals(user.updates.length, 1);
  assertEquals(user.responses.length, 2); // 2, because bot sends 2 messages here.

  user.clear();
});

Deno.test("Handle forwarded messages", async ({ step }) => {
  await step("Forward: Text message from a user", async () => {
    const text = "Forwarding message text content";
    await user.forwardTextMessage(text);

    assertEquals(user.last.text, `It says: "${text}" here.`);
  });

  await step("Forward: Photo from a specific user", async () => {
    await user.forwardMessage({
      photo: [{
        file_id: "photo_file_id",
        file_unique_id: "photo_file_unique_id",
        height: 1920,
        width: 1080,
        file_size: 123456,
      }],
      forward_from: {
        id: 123,
        first_name: "Another user",
        is_bot: false,
      },
    });

    assertEquals(user.last.text, "It's from 123");
  });

  await step("Forward: Text from bot", async () => {
    await user.forwardMessage({
      text: "Hey bot!",
      forward_from: {
        id: 234,
        first_name: "Another bot",
        username: "another_bot",
        is_bot: true,
      },
    });

    assertEquals(user.last.text, "It's from... a bot?");
  });

  assertEquals(user.responses.length, 3);
  user.clear();
});

Deno.test("Reply to message", async () => {
  await user.replyTo({
    chat: user.chat,
    date: Date.now(),
    message_id: 333,
  }, {
    text: "Reply message text",
  });

  assertEquals(user.last.text, "You are replying to 333");
  user.clear();
});

Deno.test("Handle edited messages", async ({ step }) => {
  await step("Edit: Text message", async () => {
    await user.editMessageText(2345, "Yes");
    assertEquals(user.last.text, "You edited: 2345");
  });

  await step("Edit: Photo", async () => {
    // Example of getting the update.
    const { edited_message } = await user.editMessage({
      date: Date.now() - 2000,
      chat: user.chat,
      from: user.user,
      message_id: 112,
      photo: [{ file_id: "id", file_unique_id: "id", height: 33, width: 33 }],
      edit_date: Date.now(),
    });
    assertEquals(
      user.last.text,
      `Now, that's an edited picture in ${edited_message?.message_id}`,
    );
  });

  assertEquals(user.responses.length, 2);
  assertEquals(user.updates.length, 2);

  user.clear();
});

Deno.test("Handling medias", async ({ step }) => {
  await step("Media: Animation", async () => {
    await user.sendAnimation({
      animation: {
        duration: 10,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
      },
    });
    assertEquals(user.last.text, "That's a cool animation!");
  });

  await step("Media: Audio", async () => {
    await user.sendAudio({
      audio: {
        duration: 10,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(user.last.text, "Is that a new song?");
  });

  await step("Media: Document", async () => {
    await user.sendDocument({
      document: {
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(user.last.text, "What's that? Wait a sec. Let me check it.");
  });

  await step("Media: Photo", async () => {
    await user.sendPhoto({
      photo: [{
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 1920,
        width: 1080,
      }],
    });
    assertEquals(user.last.text, "Let me process the photo. Please wait...");
  });

  await step("Media: Photo (height > 1920)", async () => {
    await user.sendPhoto({
      photo: [{
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 2000, // max 1920 (NOT an official limit)
        width: 1080,
      }],
    });
    assertEquals(user.last.text, "Sorry, but I can't process images that big!");
  });

  await step("Media: Sticker", async () => {
    await user.sendSticker({
      sticker: {
        file_id: "Media: file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
        is_animated: true,
        is_video: true,
      },
    });
    assertEquals(
      user.responses[user.responses.length - 2].payload.text,
      "I got another one, here we go!",
    );

    assertEquals(user.last.sticker, "sticker_id");
  });

  await step("Media: Video", async () => {
    await user.sendVideo({
      video: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        height: 320,
        width: 240,
      },
    });
    assertEquals(user.last.text, "Oh, you! You rickrolled me again!");
  });

  await step("Media: Video note", async () => {
    await user.sendVideoNote({
      video_note: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
        length: 30,
      },
    });
    assertEquals(user.last.video_note, "video_note_file_id");
    assertEquals(user.last.duration, 15);
  });

  await step("Media: Voice", async () => {
    await user.sendVoice({
      voice: {
        duration: 90,
        file_id: "file_id",
        file_unique_id: "file_unique_id",
      },
    });
    assertEquals(user.last.text, "Your voice is amazing!");
  });

  assertEquals(user.updates.length, 9);
  assertEquals(user.responses.length, 10);

  user.clear();
});

Deno.test("Inline Query", async ({ step }) => {
  await step("Query", async () => {
    await user.inlineQuery({
      query: "", // Empty query
      offset: "",
      id: "11",
    });
  });

  assertEquals(user.last.results[0].id, "grammy-website");
  assertEquals(user.responses.length, 1);

  user.clear();
});

Deno.test("Callback Query and buttons", async ({ step }) => {
  await step("Clicking 'click-me' button", async () => {
    await user.click({ id: "111", data: "click-me" });
    assertEquals(user.last.text, "Nothing here :)");
  });

  assertEquals(user.updates.length, 1);
  assertEquals(user.responses.length, 1);

  user.clear();
});
