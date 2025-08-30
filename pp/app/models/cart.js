// cart.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
        itemId: { type: Schema.Types.ObjectId, ref: 'Menu', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        qty: { type: Number, required: true },
        toppings: { type: [String], default: [] }
    }],
    totalQty: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema, 'carts');