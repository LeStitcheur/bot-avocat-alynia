import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(client) {
  const commandsPath = path.resolve("src/commands");

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(commandsPath, file);
    const command = await import(pathToFileURL(filePath));

    if (!command.data || !command.execute) continue;

    client.commands.set(command.data.name, command);
    console.log(`✅ Commande chargée : ${command.data.name}`);
  }
}
