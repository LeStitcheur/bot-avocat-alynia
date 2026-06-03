import { Client, Collection, GatewayIntentBits } from "discord.js";

import { env } from "./config/env.js";

import { loadCommands } from "./loaders/loadCommands.js";
import { loadEvents } from "./loaders/loadEvents.js";

import { deployCommands } from "./deployCommands.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

await loadCommands(client);

await deployCommands();

await loadEvents(client);

client.login(env.token);
