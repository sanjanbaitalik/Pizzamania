const Menu = require('../../models/menu');
const Restaurant = require('../../models/restaurant');

function homeController() {
    return {
        async index(req, res) {
            const { search, restaurant, size, toppings } = req.query;
            let query = {};

            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }
            if (restaurant) {
                query.restaurant = restaurant;
            }
            if (size) {
                query.size = size;
            }
            if (toppings) {
                query.toppings = { $in: toppings.split(',') };
            }

            const pizzas = await Menu.find(query);
            const uniqueToppings = await Menu.distinct('toppings');
            const uniqueRestaurants = await Menu.distinct('restaurant');
            const uniqueSizes = await Menu.distinct('size');

            return res.render('home', { pizzas, uniqueToppings, uniqueRestaurants, uniqueSizes });
        },
        async searchRecommendations(req, res) {
            const { query } = req.query;
            const recommendations = await Menu.find({ name: { $regex: query, $options: 'i' } }).limit(5);
            res.json(recommendations);
        }
    }
}

module.exports = homeController;