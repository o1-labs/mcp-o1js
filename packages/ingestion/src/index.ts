import { ingestMarkdownFiles } from "./ingestors/markdown.js";
import { ingestDiscordExports } from "./ingestors/discord.js";
import {
  ingestTypeScriptFiles,
  analyzeTypeScriptProject,
} from "./ingestors/typescript.js";
import { config } from "./config.js";

async function main() {
  try {
    console.log("Starting ingestion process...");

    const args = process.argv.slice(2);
    const ingestTypes = args.length > 0 ? args : ["all"];

    if (ingestTypes.includes("all") || ingestTypes.includes("docs")) {
      console.log(`Ingesting o1js docs from ${config.docsFolderPath}...`);
      await ingestMarkdownFiles(config.docsFolderPath);
    }

    if (ingestTypes.includes("all") || ingestTypes.includes("discord")) {
      console.log(
        `Ingesting Discord chats from ${config.discordFolderPath}...`,
      );
      await ingestDiscordExports(config.discordFolderPath);
    }

    if (ingestTypes.includes("all") || ingestTypes.includes("o1js")) {
      console.log(`Ingesting o1js from ${config.o1jsFolderPath}...`);
      await analyzeTypeScriptProject(config.o1jsFolderPath);
      await ingestTypeScriptFiles(config.o1jsFolderPath);
    }

    console.log("Ingestion process completed successfully!");
  } catch (error) {
    console.error("Error during ingestion process:", error);
    process.exit(1);
  }
}

main();
