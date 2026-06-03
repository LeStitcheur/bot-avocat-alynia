import "dotenv/config";

export const env = {
  // Congif base
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  avocatRoleId: process.env.AVOCAT_ROLE_ID,
  managerRoleId: process.env.MANAGER_ROLE_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  contactPanelChannelId: process.env.CONTACT_PANEL_CHANNEL_ID,

  // Tickets
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
};
