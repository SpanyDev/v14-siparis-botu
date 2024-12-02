const {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ChannelType,
} = require("discord.js");
const pSchema = require("../../../Utilities/Database/Product");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ürün-sistemi")
    .setDescription("Ürün sistemini ayarlarsınız.")
    .addSubcommand((sc) =>
      sc
        .setName("kurulum")
        .setDescription("Ürün sistemini kurulum yapar.")
        .addChannelOption((option) =>
          option
            .setName("ürün-kanalı")
            .setDescription("Ürünlerin gösterileceği kanalı seçiniz.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc.setName("sıfırla").setDescription("Ürün sistemini sıfırlar.")
    ),
  commandPermissions: [],
  usage: "/example-command",
  developerOnly: false,
  async start(client, interaction) {
    const { options } = interaction;

    const guildId = interaction.guild.id;
    const guild = await pSchema.findOne({ GuildID: guildId });

    if (options.getSubcommand() === "kurulum") {
      const productChannel = options.getChannel("ürün-kanalı");

      if (!guild) {
        const newGuild = new pSchema({
          GuildID: guildId,
          productChannel: productChannel.id,
        });
        await newGuild.save();

        const embed = new EmbedBuilder()
          .setAuthor({
            name: "Ürün Sistemi Kurulumu",
            iconURL: client.user.displayAvatarURL(),
          })
          .setDescription("Ürün sistemini başarıyla kuruldu.")
          .setFields({
            name: "Ürün Kanalı",
            value: `${productChannel}`,
            inline: true,
          })
          .setColor(Colors.Blue)
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: "Ürün Sistemi Kurulumu",
            iconURL: client.user.displayAvatarURL(),
          })
          .setDescription(
            "Ürün sistemini zaten kurulu durumda eğer tekrardan kurmak istiyorsanız önce sıfırlayın."
          )
          .setColor(Colors.Blue)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (options.getSubcommand() === "sıfırla") {
      if (!guild) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: "Ürün Sistemi Sıfırlama",
            iconURL: client.user.displayAvatarURL(),
          })
          .setDescription(
            "Ürün sistemini zaten sıfır durumda eğer tekrardan kurmak istiyorsanız önce kurun."
          )
          .setColor(Colors.Blue)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        await pSchema.findOneAndDelete({ GuildID: guildId });

        const embed = new EmbedBuilder()
          .setAuthor({
            name: "Ürün Sistemi Sıfırlama",
            iconURL: client.user.displayAvatarURL(),
          })
          .setDescription("Ürün sistemi başarıyla sıfırlandı.")
          .setColor(Colors.Blue)
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }
    }
  },
};
