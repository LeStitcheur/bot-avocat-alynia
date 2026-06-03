import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { getGlobalTicketStats, getLawyerTicketStats } from "../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("avocat-stats")
  .setDescription("Affiche les statistiques du cabinet d’avocat.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  const globalStats = getGlobalTicketStats();
  const lawyerStats = getLawyerTicketStats(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("📊 Statistiques du cabinet")
    .addFields(
      {
        name: "📁 Total dossiers",
        value: `${globalStats.total}`,
        inline: true,
      },
      {
        name: "🟡 Ouverts",
        value: `${globalStats.open}`,
        inline: true,
      },
      {
        name: "🟢 Pris en charge",
        value: `${globalStats.claimed}`,
        inline: true,
      },
      {
        name: "🔒 Fermés",
        value: `${globalStats.closed}`,
        inline: true,
      },
      {
        name: "⚖️ Demandes avocat",
        value: `${globalStats.demandes}`,
        inline: true,
      },
      {
        name: "📅 Rendez-vous",
        value: `${globalStats.rdv}`,
        inline: true,
      },
      {
        name: "🧑‍⚖️ Vos dossiers pris",
        value: `${lawyerStats.claimed}`,
        inline: true,
      },
      {
        name: "✅ Vos dossiers fermés",
        value: `${lawyerStats.closed}`,
        inline: true,
      },
    )
    .setFooter({
      text: "Goodman & associés — Cabinet d’Avocat",
    })
    .setTimestamp();

  return interaction.editReply({
    embeds: [embed],
  });
}
