const Review = require('../../models/review');
const Restaurant = require('../../models/restaurant');

function reviewController() {
    return {
        async store(req, res) {
            const { restaurant, rating, comment } = req.body;
            if (!rating || !comment) {
                req.flash('error', 'All fields are required');
                return res.redirect('/reviews');
            }
            const review = new Review({
                restaurant,
                userId: req.user._id,
                rating,
                comment
            });
            review.save().then(result => {
                req.flash('success', 'Thank you for your review!');
                res.redirect('/reviews');
            }).catch(err => {
                req.flash('error', 'Something went wrong');
                res.redirect('/reviews');
            });
        },
        async index(req, res) {
            const reviews = await Review.find().populate('userId', 'name');
            const restaurants = await Restaurant.find();
            res.render('reviews', { reviews, restaurants, messages: req.flash() });
        }
    }
}

module.exports = reviewController;