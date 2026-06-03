import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import transcript from "discord-html-transcripts";
import { env } from "../config/env.js";
import {
  claimTicket,
  closeTicket,
  createTicket,
  getTicketByChannel,
} from "../database/db.js";

function cleanChannelName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}min`;
  }

  return `${minutes}min`;
}

function buildTicketButtons(claimed = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("avocat_ticket_claim")
      .setLabel(claimed ? "Dossier pris" : "Prendre le dossier")
      .setEmoji("🧑‍⚖️")
      .setStyle(ButtonStyle.Success)
      .setDisabled(claimed),

    new ButtonBuilder()
      .setCustomId("avocat_ticket_info")
      .setLabel("Informations")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("avocat_ticket_close")
      .setLabel("Fermer le dossier")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );
}

function findExistingTicket(guild, userId) {
  return guild.channels.cache.find(
    (channel) => channel.topic === `avocat-ticket-${userId}`,
  );
}

function hasAvocatRole(member) {
  return member.roles.cache.has(env.avocatRoleId);
}

async function createPrivateTicketChannel({ guild, user, channelName }) {
  return guild.channels.create({
    name: cleanChannelName(channelName),
    type: ChannelType.GuildText,
    parent: env.ticketCategoryId || null,
    topic: `avocat-ticket-${user.id}`,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: env.avocatRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });
}

export async function showAvocatRequestModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("avocat_request_modal")
    .setTitle("Demande d’avocat");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("nom_rp")
        .setLabel("Nom & prénom RP")
        .setPlaceholder("Exemple : John Smith")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("telephone_rp")
        .setLabel("Numéro de téléphone RP")
        .setPlaceholder("Exemple : 555-1234")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("motif")
        .setLabel("Motif de la demande")
        .setPlaceholder("Garde à vue, procès, plainte, contrat...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("service_concerne")
        .setLabel("Service concerné")
        .setPlaceholder("LSPD, BCSO, Gouvernement, particulier...")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(80),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("disponibilites")
        .setLabel("Disponibilités")
        .setPlaceholder("Exemple : ce soir après 21h")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500),
    ),
  );

  return interaction.showModal(modal);
}

export async function createAvocatTicketFromModal(interaction) {
  await interaction.deferReply({ flags: 64 });

  const guild = interaction.guild;
  const user = interaction.user;

  const existingChannel = findExistingTicket(guild, user.id);

  if (existingChannel) {
    return interaction.editReply({
      content: `❌ Tu as déjà un dossier ouvert : ${existingChannel}`,
    });
  }

  const nomRp = interaction.fields.getTextInputValue("nom_rp");
  const telephoneRp = interaction.fields.getTextInputValue("telephone_rp");
  const motif = interaction.fields.getTextInputValue("motif");
  const serviceConcerne =
    interaction.fields.getTextInputValue("service_concerne") || "Non renseigné";
  const disponibilites =
    interaction.fields.getTextInputValue("disponibilites") || "Non renseignées";

  const channel = await createPrivateTicketChannel({
    guild,
    user,
    channelName: `avocat-${nomRp}`,
  });

  createTicket({
    channelId: channel.id,
    clientId: user.id,
    type: "demande_avocat",
    clientName: nomRp,
    clientPhone: telephoneRp,
  });

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("⚖️ Nouveau dossier avocat")
    .setDescription("Une nouvelle demande d’avocat vient d’être ouverte.")
    .addFields(
      { name: "👤 Client Discord", value: `${user}`, inline: true },
      { name: "🪪 Nom RP", value: nomRp, inline: true },
      { name: "📞 Téléphone RP", value: telephoneRp, inline: true },
      { name: "🏛️ Service concerné", value: serviceConcerne, inline: false },
      { name: "📌 Motif", value: motif, inline: false },
      { name: "⏰ Disponibilités", value: disponibilites, inline: false },
      { name: "🧑‍⚖️ Avocat assigné", value: "Aucun", inline: false },
    )
    .setFooter({ text: "Goodman & associés — Cabinet d’Avocat" })
    .setTimestamp();

  await channel.send({
    content: `${user} <@&${env.avocatRoleId}>`,
    embeds: [embed],
    components: [buildTicketButtons(false)],
  });

  return interaction.editReply({
    content: `✅ Votre dossier a été créé : ${channel}`,
  });
}

export async function showAvocatRdvModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("avocat_rdv_modal")
    .setTitle("Prendre rendez-vous");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("nom_rp")
        .setLabel("Nom & prénom RP")
        .setPlaceholder("Exemple : John Smith")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("telephone_rp")
        .setLabel("Numéro de téléphone RP")
        .setPlaceholder("Exemple : 555-1234")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("type_rdv")
        .setLabel("Type de rendez-vous")
        .setPlaceholder("Consultation, contrat, défense, plainte...")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("date_rdv")
        .setLabel("Date / heure souhaitée")
        .setPlaceholder("Exemple : Vendredi à 21h30")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("infos")
        .setLabel("Informations complémentaires")
        .setPlaceholder("Expliquez brièvement le contexte du rendez-vous.")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(1000),
    ),
  );

  return interaction.showModal(modal);
}

export async function createAvocatRdvTicketFromModal(interaction) {
  await interaction.deferReply({ flags: 64 });

  const guild = interaction.guild;
  const user = interaction.user;

  const existingChannel = findExistingTicket(guild, user.id);

  if (existingChannel) {
    return interaction.editReply({
      content: `❌ Tu as déjà un dossier ouvert : ${existingChannel}`,
    });
  }

  const nomRp = interaction.fields.getTextInputValue("nom_rp");
  const telephoneRp = interaction.fields.getTextInputValue("telephone_rp");
  const typeRdv = interaction.fields.getTextInputValue("type_rdv");
  const dateRdv = interaction.fields.getTextInputValue("date_rdv");
  const infos =
    interaction.fields.getTextInputValue("infos") || "Non renseigné";

  const channel = await createPrivateTicketChannel({
    guild,
    user,
    channelName: `rdv-${nomRp}`,
  });

  createTicket({
    channelId: channel.id,
    clientId: user.id,
    type: "rdv",
    clientName: nomRp,
    clientPhone: telephoneRp,
  });

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("📅 Nouvelle demande de rendez-vous")
    .setDescription("Un nouveau rendez-vous vient d’être demandé.")
    .addFields(
      { name: "👤 Client Discord", value: `${user}`, inline: true },
      { name: "🪪 Nom RP", value: nomRp, inline: true },
      { name: "📞 Téléphone RP", value: telephoneRp, inline: true },
      { name: "📌 Type de rendez-vous", value: typeRdv, inline: false },
      { name: "🕘 Date / heure souhaitée", value: dateRdv, inline: false },
      { name: "📝 Informations complémentaires", value: infos, inline: false },
      { name: "🧑‍⚖️ Avocat assigné", value: "Aucun", inline: false },
    )
    .setFooter({ text: "Goodman & associés — Cabinet d’Avocat" })
    .setTimestamp();

  await channel.send({
    content: `${user} <@&${env.avocatRoleId}>`,
    embeds: [embed],
    components: [buildTicketButtons(false)],
  });

  return interaction.editReply({
    content: `✅ Votre demande de rendez-vous a été créée : ${channel}`,
  });
}

export async function claimAvocatTicket(interaction) {
  await interaction.deferReply({ flags: 64 });

  const channel = interaction.channel;
  const member = interaction.member;

  if (!channel.topic?.startsWith("avocat-ticket-")) {
    return interaction.editReply({
      content: "❌ Ce salon n’est pas un ticket avocat.",
    });
  }

  if (!hasAvocatRole(member)) {
    return interaction.editReply({
      content: "❌ Seuls les avocats peuvent prendre un dossier.",
    });
  }

  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.editReply({
      content: "❌ Ce dossier n’existe pas en base de données.",
    });
  }

  if (ticket.status === "claimed") {
    return interaction.editReply({
      content: "❌ Ce dossier est déjà pris en charge.",
    });
  }

  claimTicket(channel.id, interaction.user.id);

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);

  const fields = embed.data.fields || [];
  const assignedIndex = fields.findIndex(
    (field) => field.name === "🧑‍⚖️ Avocat assigné",
  );

  if (assignedIndex >= 0) {
    fields[assignedIndex].value = `${interaction.user}`;
  } else {
    fields.push({
      name: "🧑‍⚖️ Avocat assigné",
      value: `${interaction.user}`,
      inline: false,
    });
  }

  embed.setFields(fields);
  embed.setColor(0x2ecc71);

  await message.edit({
    embeds: [embed],
    components: [buildTicketButtons(true)],
  });

  const baseName = channel.name.replace(/^avocat-/, "").replace(/^rdv-/, "");
  await channel.setName(cleanChannelName(`pris-${baseName}`)).catch(() => null);

  await channel.send({
    content: `🧑‍⚖️ ${interaction.user} a pris ce dossier en charge.`,
  });

  return interaction.editReply({
    content: "✅ Dossier pris en charge.",
  });
}

export async function showAvocatTicketInfo(interaction) {
  const channel = interaction.channel;

  if (!channel.topic?.startsWith("avocat-ticket-")) {
    return interaction.reply({
      content: "❌ Ce salon n’est pas un ticket avocat.",
      flags: 64,
    });
  }

  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({
      content: "❌ Aucune information trouvée pour ce dossier.",
      flags: 64,
    });
  }

  const openedFor = formatDuration(Date.now() - ticket.created_at);

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("📋 Informations du dossier")
    .addFields(
      { name: "Type", value: ticket.type, inline: true },
      { name: "Statut", value: ticket.status, inline: true },
      {
        name: "Client RP",
        value: ticket.client_name || "Non renseigné",
        inline: true,
      },
      {
        name: "Téléphone RP",
        value: ticket.client_phone || "Non renseigné",
        inline: true,
      },
      { name: "Client Discord", value: `<@${ticket.client_id}>`, inline: true },
      {
        name: "Avocat assigné",
        value: ticket.lawyer_id ? `<@${ticket.lawyer_id}>` : "Aucun",
        inline: true,
      },
      { name: "Temps d’ouverture", value: openedFor, inline: true },
    )
    .setTimestamp();

  return interaction.reply({
    embeds: [embed],
    flags: 64,
  });
}

export async function closeAvocatTicket(interaction) {
  const channel = interaction.channel;

  if (!channel.topic?.startsWith("avocat-ticket-")) {
    return interaction.reply({
      content: "❌ Ce salon n’est pas un ticket avocat.",
      flags: 64,
    });
  }

  await interaction.reply({
    content: "🔒 Génération du transcript puis fermeture du dossier...",
  });

  closeTicket(channel.id);

  const attachment = await transcript.createTranscript(channel, {
    limit: -1,
    returnType: "attachment",
    filename: `transcript-${channel.name}.html`,
    saveImages: true,
    poweredBy: false,
  });

  const logChannel = env.logChannelId
    ? await interaction.guild.channels.fetch(env.logChannelId).catch(() => null)
    : null;

  if (logChannel) {
    await logChannel.send({
      content: `📁 Transcript du dossier fermé : **${channel.name}**\nFermé par : ${interaction.user}`,
      files: [attachment],
    });
  }

  setTimeout(async () => {
    await channel.delete().catch(() => null);
  }, 5000);
}
