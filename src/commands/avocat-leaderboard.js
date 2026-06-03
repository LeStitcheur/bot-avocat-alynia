import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { getLawyerLeaderboard } from "../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("avocat-leaderboard")
  .setDescription("Affiche le classement des avocats du cabinet.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  const leaderboard = getLawyerLeaderboard(10);

  const description = leaderboard.length
    ? leaderboard
        .map((row, index) => {
          const medal =
            index === 0
              ? "🥇"
              : index === 1
                ? "🥈"
                : index === 2
                  ? "🥉"
                  : `**${index + 1}.**`;

          return `${medal} <@${row.lawyer_id}> — **${row.closed_count}** dossier(s) fermé(s)`;
        })
        .join("\n")
    : "Aucun dossier fermé pour le moment.";

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🏆 Classement des avocats")
    .setDescription(description)
    .setFooter({
      text: "Goodman & associés — Cabinet d’Avocat",
    })
    .setTimestamp();

  return interaction.editReply({
    embeds: [embed],
  });
}
