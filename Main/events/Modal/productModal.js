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
} = require("discord.js");
const pSchema = require("../../../Utilities/Database/Product");

module.exports = {
  name: Events.InteractionCreate,
  async start(client, interaction) {
    if (!interaction.isModalSubmit()) return;
    const guildData = await pSchema.findOne({ GuildID: interaction.guild.id });

    if (interaction.customId === "productAddModal") {
      const productName = interaction.fields.getTextInputValue("productName");
      const productDescription =
        interaction.fields.getTextInputValue("productDesc");
      const productPrice = interaction.fields.getTextInputValue("productPrice");
      const productDate = new Date();

      if (!guildData) {
        return interaction.reply({
          content: "Ürün sistemi kurulu değil.",
          ephemeral: true,
        });
      }

      const productChannel = client.channels.cache.get(
        guildData.productChannel
      );

      if (!productChannel) {
        return channel.send({
          content: "Ürün kanalı veya stok log kanalı bulunamadı.",
          ephemeral: true,
        });
      }

      const existingProduct = guildData.products.find(
        (product) => product.productName === productName
      );
      if (existingProduct) {
        return interaction.reply({
          content: "Aynı isimde ürün ekleyemezsiniz.",
          ephemeral: true,
        });
      }

      const lastProduct = guildData.products[guildData.products.length - 1];
      const newProductId = lastProduct ? lastProduct.productId + 1 : 1;

      await pSchema.findOneAndUpdate(
        { GuildID: interaction.guild.id },
        {
          $push: {
            products: {
              productName: productName,
              productDescription: productDescription,
              productId: newProductId,
              productPrice: productPrice,
              productDate: productDate,
              messageId: null,
              stocks: [],
            },
          },
        },
        { new: true }
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`productDelete_${newProductId}`)
          .setLabel("Ürünü Sil")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`productStockAdd_${newProductId}`)
          .setLabel("Stok Ekle")
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Yeni Ürün!",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${productName}`)
        .setDescription(`> 📋 ${productDescription}`)
        .setFields(
          {
            name: "💵 Ürün Fiyatı",
            value: `${productPrice}`,
            inline: true,
          },
          {
            name: "🏷️ Ürün Kodu",
            value: `#${newProductId}`,
            inline: true,
          },
          {
            name: "📅 Ürün Tarihi",
            value: `${time(Math.floor(productDate / 1000), "D")}`,
            inline: true,
          }
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
      return productChannel.send({ embeds: [embed] }).then(async (msg) => {
        const productUpdate = await pSchema.findOneAndUpdate(
          { GuildID: interaction.guild.id },
          {
            $set: {
              "products.$[product].messageId": msg.id,
            },
          },
          {
            arrayFilters: [{ "product.productId": newProductId }],
            new: true,
          }
        );
      });
    }

    if (interaction.customId === "productDeleteModal") {
      const productId = Number(
        interaction.fields.getTextInputValue("productCode")
      );

      if (!guildData) {
        return interaction.reply({
          content: "Ürün sistemi kurulu değil.",
          ephemeral: true,
        });
      }

      if (!guildData.products || guildData.products.length === 0) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const productIndex = guildData.products.findIndex(
        (product) => product.productId === productId
      );

      if (productIndex === -1) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const product = guildData.products[productIndex];

      guildData.products.splice(productIndex, 1);
      await guildData.save();

      const productChannel = client.channels.cache.get(
        guildData.productChannel
      );

      const msg = await productChannel.messages.fetch(product.messageId);
      if (msg) {
        await msg.delete();
      }

      await interaction.reply({
        content: "Ürün başarıyla silindi.",
        ephemeral: true,
      });
    }

    if (interaction.customId === "productViewModal") {
      const productId = Number(
        interaction.fields.getTextInputValue("productCode")
      );

      if (!guildData) {
        return interaction.reply({
          content: "Ürün sistemi kurulu değil.",
          ephemeral: true,
        });
      }

      if (!guildData.products || guildData.products.length === 0) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`productDelete_${product.productId}`)
          .setLabel("Ürünü Sil")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`productStockAdd_${product.productId}`)
          .setLabel("Stok Ekle")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`productStockReset_${product.productId}`)
          .setLabel("Stok Sıfırlama")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`productStockView_${product.productId}`)
          .setLabel("Stok Görüntüleme")
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Ürün Görüntüleme",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${product.productName}`)
        .setDescription(`> 📋 ${product.productDescription}`)
        .setFields(
          {
            name: "💵 Ürün Fiyatı",
            value: `${product.productPrice}`,
            inline: true,
          },
          {
            name: "🏷️ Ürün Kodu",
            value: `#${product.productId}`,
            inline: true,
          },
          {
            name: "📅 Ürün Tarihi",
            value: `${time(Math.floor(product.productDate / 1000), "D")}`,
            inline: true,
          },
          {
            name: "📊 Stok Bilgileri",
            value: `Stok: ${product.stocks.length}`,
            inline: true,
          }
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }

    if (interaction.customId.startsWith("productStockAddModal_")) {
      const productId = Number(interaction.customId.split("_")[1]);
      const stocksInput = interaction.fields.getTextInputValue("productStocks");

      const rawStocksArray = stocksInput
        .split(",")
        .map((stock) => stock.trim())
        .filter((stock) => stock.length > 0);

      const uniqueInputStocks = [...new Set(rawStocksArray)];

      const product = guildData.products.find(
        (product) => product.productId === productId
      );

      if (!product) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      if (uniqueInputStocks.length === 0) {
        return interaction.reply({
          content: "Geçerli stok bilgisi girmediniz. Lütfen tekrar deneyin.",
          ephemeral: true,
        });
      }

      const existingStocks = new Set(product.stocks);
      const newStocks = uniqueInputStocks.filter(
        (stock) => !existingStocks.has(stock)
      );
      const duplicateStocks = rawStocksArray.filter(
        (stock, index, self) => self.indexOf(stock) !== index
      );
      const alreadyExistingStocks = uniqueInputStocks.filter((stock) =>
        existingStocks.has(stock)
      );

      if (newStocks.length === 0) {
        return interaction.reply({
          content: "Eklemeye çalıştığınız tüm stoklar zaten mevcut.",
          ephemeral: true,
        });
      }

      product.stocks = product.stocks.concat(newStocks);

      await pSchema.updateOne(
        { GuildID: interaction.guild.id, "products.productId": productId },
        {
          $addToSet: {
            "products.$.stocks": { $each: newStocks },
          },
        }
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Stok Ekleme",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${product.productName}`)
        .setFields(
          {
            name: "📊 Stok Bilgileri",
            value: `> Güncel Stok: ${product.stocks.length}\n> Eklenen Stok: ${newStocks.length}`,
            inline: true,
          },
          {
            name: "Eklenen Stoklar",
            value: `\`\`\`${newStocks.join(", ")}\`\`\``,
            inline: false,
          },
          ...(alreadyExistingStocks.length > 0
            ? [
                {
                  name: "❌ Ekli olan stoklar eklenemedi",
                  value: `\`\`\`${alreadyExistingStocks.join(", ")}\`\`\``,
                  inline: false,
                },
              ]
            : []),
          ...(duplicateStocks.length > 0
            ? [
                {
                  name: "⚠️ Aynı Ürünler Alınmadı",
                  value: `\`\`\`${[...new Set(duplicateStocks)].join(
                    ", "
                  )}\`\`\``,
                  inline: false,
                },
              ]
            : [])
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (interaction.customId === "productDeliveryModal") {
      const productId = Number(
        interaction.fields.getTextInputValue("productCode")
      );
      const productCount = interaction.fields.getTextInputValue("productCount");

      if (!guildData) {
        return interaction.reply({
          content: "Ürün sistemi kurulu değil.",
          ephemeral: true,
        });
      }

      if (!productId || isNaN(productId)) {
        return interaction.reply({
          content: "Geçerli bir ürün kodu girin.",
          ephemeral: true,
        });
      }

      if (!guildData.products || guildData.products.length === 0) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const productIndex = guildData.products.findIndex(
        (p) => p.productId === productId
      );

      if (productIndex === -1) {
        return interaction.reply({
          content: "Ürün bulunamadı.",
          ephemeral: true,
        });
      }

      const product = guildData.products[productIndex];

      if (product.stocks.length < Number(productCount)) {
        return interaction.reply({
          content: `Yeterli stok bulunmuyor. Mevcut stok: ${product.stocks.length}`,
          ephemeral: true,
        });
      }

      const removedStocks = product.stocks.splice(0, Number(productCount));

      const deliveryCode = generateDeliveryCode();
      const deliveryCodeObj = {
        code: deliveryCode,
        used: false,
        products: removedStocks,
      };

      await pSchema.updateOne(
        { GuildID: interaction.guild.id, "products.productId": productId },
        {
          $pull: {
            "products.$.stocks": { $in: removedStocks },
          },
          $push: {
            "products.$.deliveryCodes": deliveryCodeObj,
          },
        }
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setAuthor({
          name: "Ürün Teslimatı",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(`${product.productName}`)
        .setFields(
          {
            name: "Oluşturulan Kod",
            value: `\`${deliveryCode}\``,
            inline: false,
          },
          {
            name: "Ürün Adedi",
            value: `${productCount}`,
            inline: true,
          },
          {
            name: "Alınan Stoklar",
            value: `\`\`\`${removedStocks.join(", ")}\`\`\``,
            inline: false,
          }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};

function generateDeliveryCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghıijklmnopqrstuvwxyz";
  let code = "";
  for (let i = 0; i < 9; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
