import { Events } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  console.log(`⚖️ Bot avocat connecté : ${client.user.tag}`);
}
