// cartController.js

const Cart = require('../../../models/cart');
const Menu = require('../../../models/menu');

function cartController() {
    return {
        async index(req, res) {
            try {
                const cart = await Cart.findOne({ userId: req.user._id }).populate('items.itemId');
                res.render('customers/cart', { cart });
            } catch (err) {
                console.error(err);
                res.status(500).send('Server Error');
            }
        },

        async update(req, res) {
            console.log('Update method called');
            const { _id, toppings } = req.body;

            try {
                // Find or create cart using upsert
                let cart = await Cart.findOneAndUpdate(
                    { userId: req.user._id },
                    { $setOnInsert: { items: [], totalQty: 0, totalPrice: 0 } },
                    { new: true, upsert: true }
                );

                const pizza = await Menu.findById(_id);
                if (!pizza) {
                    return res.status(404).json({ message: 'Pizza not found' });
                }

                const toppingsArray = toppings || [];

                // Check if item with same toppings exists
                const itemIndex = cart.items.findIndex(item =>
                    item.itemId.equals(_id) &&
                    JSON.stringify(item.toppings) === JSON.stringify(toppingsArray)
                );

                if (itemIndex >= 0) {
                    // Increase quantity
                    cart.items[itemIndex].qty += 1;
                } else {
                    // Add new item
                    cart.items.push({
                        itemId: _id,
                        name: pizza.name,
                        price: pizza.price,
                        size: pizza.size,
                        qty: 1,
                        toppings: toppingsArray
                    });
                }

                cart.totalQty += 1;
                cart.totalPrice += pizza.price;

                await cart.save();
                res.json({ totalQty: cart.totalQty });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            }
        },

        async delete(req, res) {
            const { itemId } = req.body;

            try {
                let cart = await Cart.findOne({ userId: req.user._id });
                if (!cart) {
                    return res.status(404).json({ message: 'Cart not found' });
                }

                const itemIndex = cart.items.findIndex(item => item.itemId.equals(itemId));

                if (itemIndex > -1) {
                    const item = cart.items[itemIndex];
                    cart.totalQty -= item.qty;
                    cart.totalPrice -= item.price * item.qty;
                    cart.items.splice(itemIndex, 1);

                    if (cart.totalPrice < 0) {
                        cart.totalPrice = 0;
                    }

                    await cart.save();
                }

                res.json({ totalQty: cart.totalQty, totalPrice: cart.totalPrice });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            }
        },

        async increase(req, res) {
            const { itemId } = req.body;

            try {
                let cart = await Cart.findOne({ userId: req.user._id });
                if (!cart) {
                    return res.status(404).json({ message: 'Cart not found' });
                }

                const itemIndex = cart.items.findIndex(item => item.itemId.equals(itemId));
                if (itemIndex > -1) {
                    cart.items[itemIndex].qty += 1;
                    cart.totalQty += 1;
                    cart.totalPrice += cart.items[itemIndex].price;

                    await cart.save();
                }

                res.json({ totalQty: cart.totalQty, totalPrice: cart.totalPrice });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            }
        },

        async decrease(req, res) {
            const { itemId } = req.body;

            try {
                let cart = await Cart.findOne({ userId: req.user._id });
                if (!cart) {
                    return res.status(404).json({ message: 'Cart not found' });
                }

                const itemIndex = cart.items.findIndex(item => item.itemId.equals(itemId));
                if (itemIndex > -1) {
                    const item = cart.items[itemIndex];
                    if (item.qty > 1) {
                        item.qty -= 1;
                        cart.totalPrice -= item.price;
                    } else {
                        cart.totalQty -= item.qty;
                        cart.totalPrice -= item.price * item.qty;
                        cart.items.splice(itemIndex, 1);
                    }

                    if (cart.totalPrice < 0) {
                        cart.totalPrice = 0;
                    }

                    await cart.save();
                }

                res.json({ totalQty: cart.totalQty, totalPrice: cart.totalPrice });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };
}

module.exports = cartController;