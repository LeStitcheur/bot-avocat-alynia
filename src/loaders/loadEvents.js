import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadEvents(client) {
  const eventsPath = path.resolve("src/events");

  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(eventsPath, file);
    const event = await import(pathToFileURL(filePath));

    if (!event.name || !event.execute) continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    console.log(`✅ Event chargé : ${event.name}`);
  }
}
