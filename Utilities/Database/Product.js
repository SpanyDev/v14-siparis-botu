const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  GuildID: { type: String, required: true },
  productChannel: { type: String, required: true },
  products: [
    {
      productName: { type: String, required: true },
      productDescription: { type: String, required: true },
      productId: { type: Number, required: true },
      productDate: { type: Date, required: true },
      messageId: { type: String, required: true },
      productPrice: { type: String, required: true },
      stocks: { type: Array, default: [], required: true },
      deliveryCodes: {
        type: Array,
        default: [
          {
            code: { type: String, required: true },
            used: { type: Boolean, default: false },
            products: { type: Array, default: [], required: true },
          },
        ],
        required: true,
      },
    },
  ],
});

module.exports = model("product", productSchema);
