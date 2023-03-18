import { Chats } from "./chats.ts";
import { Context, HTMLParser, HTMLParserHandler, Types } from "./deps.ts";

type Attributes = Record<string, string>;
/*
<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<span class="tg-spoiler">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>
<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
*/

type TelegramHTMLTags =
  | "strong"
  | "b"
  | "tg-spoiler"
  | "span" // span class="tg-spoiler"
  | "u"
  | "ins"
  | "em"
  | "i"
  | "del"
  | "s"
  | "strike"
  | "pre"
  | "code"
  | "a";

export class HTMLToTelegramHandler<C extends Context>
  implements HTMLParserHandler {
  text: string;
  entities: Types.MessageEntity[];

  #env: Chats<C>;
  #buildingEntities: Map<string, Types.MessageEntity>;
  #openTags: string[];
  #openTagsMeta: (string | undefined)[];

  constructor(env: Chats<C>) {
    this.#env = env;
    this.text = "";
    this.entities = [];
    this.#buildingEntities = new Map();
    this.#openTags = [];
    this.#openTagsMeta = [];
  }

  onopentag(name: TelegramHTMLTags, attributes: Attributes) {
    this.#openTags.unshift(name);
    this.#openTagsMeta.unshift(undefined);
    let entityType: Types.MessageEntity["type"] | undefined;
    // deno-lint-ignore no-explicit-any
    const entityOptions: any = {};
    if (name === "strong" || name === "b") {
      entityType = "bold";
    } else if (
      name === "tg-spoiler" ||
      (name === "span" && attributes.class.split(" ").includes("tg-spoiler"))
    ) {
      entityType = "spoiler";
    } else if (name === "em" || name === "i") {
      entityType = "italic";
    } else if (name === "u" || name === "ins") {
      entityType = "underline";
    } else if (name === "del" || name === "s" || name === "strike") {
      entityType = "strikethrough";
    } else if (name === "code") {
      const pre = this.#buildingEntities.get("pre");
      if (pre && pre.type === "pre" && attributes.class) {
        const [_prefix, ...langSegs] = attributes.class.split(" ")
          .filter((c) => c.match(/language-(.+)/)?.[1])[0]?.split("-");
        pre.language = langSegs.join("-");
      } else {
        entityType = "code";
      }
    } else if (name === "pre") {
      entityType = "pre";
    } else if (name === "a") {
      let url: string | undefined = attributes.href;
      if (!url) return;
      if (url.startsWith("tg://")) {
        const id = Number(url.match(/tg:\/\/user\?id=(\d+)/)?.[1]);
        if (isNaN(id)) return;
        entityType = "text_mention";
        const chat = this.#env.chats.get(id);
        if (!chat) {
          entityOptions["user"] = { id, is_bot: false } as Types.User;
        } else {
        }
      } else {
        entityType = "url";
        entityOptions["url"] = url;
        url = undefined;
      }
      this.#openTagsMeta.shift();
      this.#openTagsMeta.unshift(url);
    }

    if (entityType !== undefined && !this.#buildingEntities.has(name)) {
      this.#buildingEntities.set(name, {
        type: entityType,
        offset: this.text.length,
        length: 0,
        ...entityOptions,
      });
    }
  }

  ontext(text: string) {
    const prevTag = this.#openTags.length > 0 ? this.#openTags[0] : "";
    if (prevTag === "a") {
      const url = this.#openTagsMeta[0];
      if (url) text = url;
    }
    for (const [_, entity] of this.#buildingEntities) {
      entity.length += text.length;
    }
    this.text += text;
  }

  onclosetag(tagname: string) {
    this.#openTagsMeta.shift();
    this.#openTags.shift();
    const entity = this.#buildingEntities.get(tagname);
    if (entity) {
      this.#buildingEntities.delete(tagname);
      this.entities.push(entity);
    }
  }

  onattribute() {}
  oncdataend() {}
  oncdatastart() {}
  oncomment() {}
  oncommentend() {}
  onend() {}
  onerror() {}
  onopentagname() {}
  onparserinit() {}
  onprocessinginstruction() {}
  onreset() {}
}

function stripText(text: string, entities: Types.MessageEntity[]) {
  if (!entities || !entities.length) return text.trim();
  while (text && text[text.length - 1].trim() === "") {
    const entity = entities[entities.length - 1];
    if (entity.offset + entity.length === text.length) {
      if (entity.length === 1) {
        entities.pop();
        if (!entities.length) return text.trim();
      } else entity.length -= 1;
    }
    text = text.slice(0, -1);
  }
  while (text && text[0].trim() === "") {
    for (const entity of entities) {
      if (entity.offset !== 0) {
        entity.offset--;
        continue;
      }
      if (entity.length === 1) {
        entities.shift();
        if (!entities.length) return text.trimStart();
      } else entity.length -= 1;
    }
    text = text.slice(1);
  }
  return text;
}

export function HTMLtoEntities<C extends Context>(env: Chats<C>, html: string) {
  if (!html) return { text: html, entities: [] };
  const handler = new HTMLToTelegramHandler(env);
  const parser = new HTMLParser(handler);
  parser.write(html);
  parser.end();
  const text = stripText(handler.text, handler.entities);
  return { text, entities: handler.entities };
}

export class ParseMode<C extends Context> {
  #env: Chats<C>;
  #text: Types.Message["text"];
  #entities?: Types.MessageEntity[];
  #parseMode?: Types.ParseMode;

  constructor(
    env: Chats<C>,
    text: string,
    options: {
      entities?: Types.MessageEntity[];
      parseMode?: Types.ParseMode;
    },
  ) {
    this.#env = env;
    this.#text = text;
    this.#entities = options.entities;
    this.#parseMode = options.parseMode;
  }

  toEntities(): { text: string; entities: Types.MessageEntity[] } {
    if (!this.#text) throw new Error("No valid text");
    if (!this.#parseMode) throw new Error("No parse mode specified");
    if (this.#parseMode.toLowerCase() === "html") {
      return HTMLtoEntities(this.#env, this.#text);
    }
    return { text: this.#text, entities: [] };
  }
}
