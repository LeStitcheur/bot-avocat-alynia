import { Events } from "discord.js";

import {
  claimAvocatTicket,
  closeAvocatTicket,
  createAvocatRdvTicketFromModal,
  createAvocatTicketFromModal,
  showAvocatRdvModal,
  showAvocatRequestModal,
  showAvocatTicketInfo,
} from "../services/ticketService.js";

export const name = Events.InteractionCreate;

export async function execute(interaction, client) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: "❌ Commande introuvable.",
          flags: 64,
        });
      }

      return command.execute(interaction, client);
    }

    if (interaction.isButton()) {
      if (interaction.customId === "avocat_demande") {
        return showAvocatRequestModal(interaction);
      }

      if (interaction.customId === "avocat_rdv") {
        return showAvocatRdvModal(interaction);
      }

      if (interaction.customId === "avocat_facture") {
        return interaction.reply({
          content: "💵 Le système de facture arrive bientôt.",
          flags: 64,
        });
      }

      if (interaction.customId === "avocat_ticket_claim") {
        return claimAvocatTicket(interaction);
      }

      if (interaction.customId === "avocat_ticket_info") {
        return showAvocatTicketInfo(interaction);
      }

      if (interaction.customId === "avocat_ticket_close") {
        return closeAvocatTicket(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "avocat_request_modal") {
        return createAvocatTicketFromModal(interaction);
      }

      if (interaction.customId === "avocat_rdv_modal") {
        return createAvocatRdvTicketFromModal(interaction);
      }
    }
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "❌ Une erreur est survenue.",
        flags: 64,
      });
    }

    return interaction.reply({
      content: "❌ Une erreur est survenue.",
      flags: 64,
    });
  }
}
