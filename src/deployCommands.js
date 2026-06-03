import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import { REST, Routes } from "discord.js";
import { env } from "./config/env.js";

export async function deployCommands() {
  try {
    const commands = [];
    const commandsPath = path.resolve("src/commands");

    const files = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(commandsPath, file);

      const command = await import(pathToFileURL(filePath));

      if (!command.data) continue;

      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(env.token);

    console.log(
      `🔄 Déploiement automatique de ${commands.length} commande(s)...`,
    );

    await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), {
      body: commands,
    });

    console.log("✅ Commandes déployées automatiquement");
  } catch (error) {
    console.error("❌ Erreur deploy commandes :", error);
  }
}
