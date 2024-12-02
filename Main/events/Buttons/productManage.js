const { Main } = require("../../../Utilities/Settings/config.js");
const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  time,
  PermissionsBitField,
} = require("discord.js");
const pSchema = require("../../../Utilities/Database/Product");
const { Paginator } = require("paginated.embed");

module.exports = {
  name: Events.InteractionCreate,
  async start(client, interaction) {
    if (!interaction.isButton()) return;
    const guildData = await pSchema.findOne({ GuildID: interaction.guild.id });

    if (interaction.customId === "productAdd") {
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

      const modal = new ModalBuilder()
        .setCustomId("productAddModal")
        .setTitle("Ürün Ekle");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productName")
            .setLabel("Ürün Adı")
            .setPlaceholder("Ürün adını giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productDesc")
            .setLabel("Ürün Açıklaması")
            .setPlaceholder("Ürün açıklamasını giriniz.")
            .setMinLength(0)
            .setMaxLength(150)
            .setStyle(TextInputStyle.Paragraph)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productPrice")
            .setLabel("Ürün Fiyatı")
            .setPlaceholder("Ürün fiyatını giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === "productDelete") {
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

      const modal = new ModalBuilder()
        .setCustomId("productDeleteModal")
        .setTitle("Ürün Sil");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productCode")
            .setLabel("Ürün Kodu")
            .setPlaceholder("Ürün kodunu giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === "productView") {
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

      const modal = new ModalBuilder()
        .setCustomId("productViewModal")
        .setTitle("Ürün Görüntüle");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productCode")
            .setLabel("Ürün Kodu")
            .setPlaceholder("Ürün kodunu giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

      await interaction.showModal(modal);
    }
    if (interaction.customId === "productList") {
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

      await interaction.deferReply();

      if (
        !guildData ||
        !guildData.products ||
        guildData.products.length === 0
      ) {
        return interaction.reply({
          content: "Bu sunucuda herhangi bir ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const products = guildData.products;

      const embeds = products.map((product, index) => {
        return {
          author: {
            name: `Ürün ${index + 1}: ${product.productName}`,
            iconURL: client.user.displayAvatarURL(),
          },
          description: `📋 ${product.productDescription}`,
          footer: {
            text: `Ürün ID: ${product.productId}`,
          },
          fields: [
            {
              name: "💵 Fiyat",
              value: `${product.productPrice}₺`,
              inline: true,
            },
            {
              name: "📦 Stok",
              value: `${product.stocks.length} adet`,
              inline: true,
            },
            {
              name: "📅 Eklenme Tarihi",
              value: `${time(
                Math.floor(new Date(product.productDate).getTime() / 1000),
                "D"
              )}`,
              inline: true,
            },
          ],
        };
      });

      const paginator = new Paginator()
        .addStrings(embeds)
        .setEmbedColor(Colors.Blue)
        .setButtons({
          firstPage: { style: ButtonStyle.Primary },
          previous: { style: ButtonStyle.Primary },
          next: { style: ButtonStyle.Primary },
          lastPage: { style: ButtonStyle.Primary },
        })
        .setTimestamp();

      await paginator.create(interaction, Paginator.Type.InteractionEditReply);
    }

    if (interaction.customId.startsWith("productDelivery")) {
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

      const modal = new ModalBuilder()
        .setCustomId("productDeliveryModal")
        .setTitle("Ürün Teslim");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productCode")
            .setLabel("Ürün Kodu")
            .setPlaceholder("Ürün kodunu giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("productCount")
            .setLabel("Ürün Sayısı")
            .setPlaceholder("Teslim edilecek ürün sayısını giriniz.")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId.startsWith("productDelete_")) {
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

      const productId = Number(interaction.customId.split("_")[1]);
      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Belirtilen ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Ürün Silme",
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(`> **${product.productName}** Adlı ürün silindi.`)
        .setFooter({
          text: `Ürün ID: ${product.productId}`,
        });

      const productChannel = client.channels.cache.get(
        guildData.productChannel
      );

      const msg = await productChannel.messages.fetch(product.messageId);
      if (msg) {
        await msg.delete();
      }

      guildData.products = guildData.products.filter(
        (product) => product.productId !== productId
      );
      await guildData.save();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (interaction.customId.startsWith("productStockAdd_")) {
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

      const productId = Number(interaction.customId.split("_")[1]);
      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Belirtilen ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`productStockAddModal_${productId}`)
        .setTitle("Stok Ekle")

        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("productStocks")
              .setLabel("Stok Ekle")
              .setPlaceholder(
                "Stokları virgülle ayırarak girin. (ürün:şifre, ürün, şifre)"
              )
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          )
        );

      await interaction.showModal(modal);
    }

    if (interaction.customId.startsWith("productStockReset_")) {
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

      const productId = Number(interaction.customId.split("_")[1]);
      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Belirtilen ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Stok Sıfırlama",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${product.productName}`)
        .setDescription(`> Ürün stokları sıfırlandı!`)
        .setFooter({
          text: `Ürün ID: ${product.productId}`,
        });

      product.stocks = [];
      await guildData.save();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (interaction.customId.startsWith("productStockView_")) {
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

      const productId = Number(interaction.customId.split("_")[1]);
      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Belirtilen ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Stoklar",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${product.productName} Adlı Ürün Stokları`)
        .setDescription(
          `\`\`\`${
            product.stocks.map((stock) => `${stock}`).join(", ") || "Stok yok!"
          }\`\`\``
        )
        .setFooter({
          text: `Ürün ID: ${product.productId}`,
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
