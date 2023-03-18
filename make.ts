import { Project } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
const project = new Project();

const file = await fetch("https://deno.land/x/grammy_types@v3.0.3/methods.ts");
const src = project.createSourceFile("methods.ts", await file.text());

const methods = src.getTypeAliasOrThrow("ApiMethods").getType()
  .getProperties().map((property) => property.getName());
await Deno.writeTextFile(
  "methods/all.ts",
  `export const methods = ${JSON.stringify(methods)};`,
);
const cmd = new Deno.Command(Deno.execPath(), {
  args: ["fmt", "methods/all.ts"],
});
await cmd.spawn().status;
