// web.js

const homeController = require('../app/http/controllers/homeController');
const authController = require('../app/http/controllers/authController');
const cartController = require('../app/http/controllers/customers/cartController');
const orderController = require('../app/http/controllers/customers/orderController');
const adminOrderController = require('../app/http/controllers/admin/orderController');
const statusController = require('../app/http/controllers/admin/statusController');
const reviewController = require('../app/http/controllers/reviewController');
const Cart = require('../app/models/cart');

// Middlewares 
const guest = require('../app/http/middlewares/guest');
const auth = require('../app/http/middlewares/auth');
const admin = require('../app/http/middlewares/admin');

function initRoutes(app) {
    app.get('/', homeController().index);
    app.get('/login', guest, authController().login);
    app.post('/login', authController().postLogin);
    app.get('/register', guest, authController().register);
    app.post('/register', authController().postRegister);
    app.post('/logout', authController().logout);

    app.get('/profile', auth, authController().profile);
    app.post('/profile', authController().updateProfile);

    app.get('/profile', async (req, res) => {
        let cartQty = 0;
        if (req.user && req.isAuthenticated()) {
            try {
                const cart = await Cart.findOne({ userId: req.user._id });
                cartQty = cart ? cart.totalQty : 0;
            } catch (err) {
                console.error(err);
            }
        }
        res.render('profile', { cartQty });
    });

    app.get('/admin/addFood', admin, authController().adminPage);
    app.post('/admin/addFood', admin, authController().addFood);

    app.get('/cart', auth, cartController().index);
    app.post('/update-cart', auth, cartController().update);
    app.post('/delete-cart-item', auth, cartController().delete);
    app.post('/increase-cart-item', auth, cartController().increase);
    app.post('/decrease-cart-item', auth, cartController().decrease);

    // Customer routes
    app.post('/orders', auth, orderController().store);
    app.get('/customer/orders', auth, orderController().index);
    app.get('/customer/orders/:id', auth, orderController().show);
    app.get('/search-recommendations', homeController().searchRecommendations);

    // Admin routes
    app.get('/admin/orders', admin, adminOrderController().index);
    app.post('/admin/order/status', admin, statusController().update);

    app.post('/reviews', auth, reviewController().store);
    app.get('/reviews', reviewController().index);

    app.get('/', async (req, res) => {
        let cartQty = 0;
        if (req.user && req.isAuthenticated()) {
            try {
                const cart = await Cart.findOne({ userId: req.user._id });
                cartQty = cart ? cart.totalQty : 0;
            } catch (err) {
                console.error(err);
            }
        }
        res.render('home', { cartQty });
    });
}

module.exports = initRoutes;