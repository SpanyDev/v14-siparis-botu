const {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  time,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  PermissionsBitField,
} = require("discord.js");
const pSchema = require("../../../Utilities/Database/Product");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ürün")
    .setDescription("Ürün yönetim komutudur.")
    .addSubcommand((sc) =>
      sc.setName("yönetim").setDescription("Ürün yönetim komutudur.")
    )
    .addSubcommand((sc) =>
      sc
        .setName("teslim-al")
        .setDescription("Ürün teslim alırsınız.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("Ürün teslimat kodunu giriniz.")
            .setRequired(true)
        )
    ),
  commandPermissions: [],
  usage: "/ürün [ekle, sil, görüntüle, teslim, listele]",
  developerOnly: false,
  async start(client, interaction) {
    const { options, channel, guild, user } = interaction;
    const guildId = guild.id;

    const guildData = await pSchema.findOne({ GuildID: guildId });

    if (!guildData) {
      return interaction.reply({
        content: "Ürün sistemi kurulu değil.",
        ephemeral: true,
      });
    }

    if (options.getSubcommand() === "teslim-al") {
      const code = options.getString("code");
    
      const deliveryCodeData = guildData.products
        .flatMap((product) => product.deliveryCodes)
        .find((deliveryCode) => deliveryCode.code === code);
    
      if (!deliveryCodeData) {
        return interaction.reply({
          content: "Geçersiz teslimat kodu.",
          ephemeral: true,
        });
      }
    
      if (deliveryCodeData.used) {
        return interaction.reply({
          content: "Bu teslimat kodu zaten kullanılmış.",
          ephemeral: true,
        });
      }
    
      const removedStocks = deliveryCodeData.products;
        
      await pSchema.updateOne(
        { GuildID: guildId, "products.deliveryCodes.code": code },
        {
          $pull: {
            "products.$.deliveryCodes": { code: code },
            "products.$.stocks": { $in: removedStocks },
          },
        }
      );
    
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setAuthor({
          name: "Teslimat Tamamlandı",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle("Teslimat Başarıyla Gerçekleştirildi")
        .setFields(
          {
            name: "Teslimat Kodu",
            value: `\`${code}\``,
            inline: false,
          },
          {
            name: "Teslim Edilen Ürünler",
            value: `\`\`\`${removedStocks.join(",")}\`\`\``,
            inline: false,
          }
        );
    
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
    

    if (options.getSubcommand() === "yönetim") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          content:
            "Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Ürün Yönetimi",
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
          "Aşağıdaki butonları kullanarak ürünlerinizi yönetebilirsiniz"
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("productAdd")
          .setLabel("Ürün Ekle")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("productDelete")
          .setLabel("Ürün Sil")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("productView")
          .setLabel("Ürün Görüntüle")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("productList")
          .setLabel("Ürün Listele")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("productDelivery")
          .setLabel("Ürün Teslim")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  },
};
