import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { env } from "../config/env.js";

export const data = new SlashCommandBuilder()
  .setName("setup-avocat")
  .setDescription("Installe le panel principal du cabinet d’avocat.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  try {
    await interaction.deferReply({ flags: 64 });

    const panelChannel = await interaction.guild.channels
      .fetch(env.contactPanelChannelId)
      .catch(() => null);

    if (!panelChannel) {
      return interaction.editReply({
        content:
          "❌ Salon du panel contact introuvable. Vérifie `CONTACT_PANEL_CHANNEL_ID` dans le `.env`.",
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("⚖️ Goodman & Associés")
      .setDescription(
        [
          "Bienvenue au cabinet d’avocat.",
          "",
          "Utilisez ce panel pour contacter le cabinet :",
          "",
          "📁 **Demander un avocat**",
          "Ouvre un dossier privé avec le cabinet.",
          "",
          "📅 **Prendre rendez-vous**",
          "Permet de convenir d’un créneau avec un avocat.",
          "",
          "💵 **Facture / Devis**",
          "Permet de demander une facture ou une estimation d’honoraires.",
          "",
          "Un membre du cabinet vous répondra dès que possible.",
        ].join("\n"),
      )
      .setFooter({
        text: "Goodman & associés — Cabinet d’Avocat",
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("avocat_demande")
        .setLabel("Demander un avocat")
        .setEmoji("📁")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("avocat_rdv")
        .setLabel("Prendre RDV")
        .setEmoji("📅")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("avocat_facture")
        .setLabel("Facture / Devis")
        .setEmoji("💵")
        .setStyle(ButtonStyle.Success),
    );

    await panelChannel.send({
      embeds: [embed],
      components: [row],
    });

    return interaction.editReply({
      content: `✅ Panel avocat installé dans ${panelChannel}.`,
    });
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        content:
          "❌ Impossible d’installer le panel avocat. Vérifie les permissions du bot et la configuration `.env`.",
      });
    }

    return interaction.reply({
      content: "❌ Une erreur est survenue.",
      flags: 64,
    });
  }
}
