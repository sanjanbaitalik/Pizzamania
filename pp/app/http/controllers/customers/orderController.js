const Order = require('../../../models/order');
const Cart = require('../../../models/cart');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

function orderController() {
    return {
        async store(req, res) {
            // Validate request
            const { phone, address, stripeToken, paymentType } = req.body;
            if (!phone || !address) {
                return res.status(422).json({ message: 'All fields are required' });
            }

            try {
                // Fetch the cart from the database
                const cart = await Cart.findOne({ userId: req.user._id });
                if (!cart) {
                    return res.status(404).json({ message: 'Cart not found' });
                }

                const order = new Order({
                    customerId: req.user._id,
                    items: cart.items, // Use items from the fetched cart
                    phone,
                    address,
                    paymentType
                });

                const savedOrder = await order.save();
                await Order.populate(savedOrder, { path: 'customerId' });

                // Stripe payment
                if (paymentType === 'card') {
                    try {
                        await stripe.charges.create({
                            amount: cart.totalPrice * 100,
                            source: stripeToken,
                            currency: 'inr',
                            description: `Pizza order: ${savedOrder._id}`
                        });

                        savedOrder.paymentStatus = true;
                        savedOrder.paymentType = paymentType;
                        await savedOrder.save();

                        // Emit event
                        const eventEmitter = req.app.get('eventEmitter');
                        eventEmitter.emit('orderPlaced', savedOrder);

                        // Clear the cart
                        await Cart.findOneAndDelete({ userId: req.user._id });

                        return res.json({ message: 'Payment successful, Order placed successfully' });
                    } catch (err) {
                        console.error(err);
                        await Cart.findOneAndDelete({ userId: req.user._id });
                        return res.json({ message: 'Order placed but payment failed, You can pay at delivery time' });
                    }
                } else {
                    // Emit event
                    const eventEmitter = req.app.get('eventEmitter');
                    eventEmitter.emit('orderPlaced', savedOrder);

                    // Clear the cart
                    await Cart.findOneAndDelete({ userId: req.user._id });

                    return res.json({ message: 'Order placed successfully' });
                }
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Something went wrong' });
            }
        },

        async index(req, res) {
            try {
                const orders = await Order.find({ customerId: req.user._id }, null, { sort: { 'createdAt': -1 } });
                res.header('Cache-Control', 'no-store');
                res.render('customers/orders', { orders, moment: require('moment') });
            } catch (err) {
                console.error(err);
                res.status(500).send('Server Error');
            }
        },

        async show(req, res) {
            try {
                const order = await Order.findById(req.params.id);
                // Authorize user
                if (req.user._id.toString() === order.customerId.toString()) {
                    return res.render('customers/singleOrder', { order });
                }
                return res.redirect('/');
            } catch (err) {
                console.error(err);
                res.status(500).send('Server Error');
            }
        }
    }
}

module.exports = orderController;