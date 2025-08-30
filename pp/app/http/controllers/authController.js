const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')
const Menu = require('../../models/menu');
const Restaurant = require('../../models/restaurant');
function authController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders'
    }
    
    return {
        login(req, res) {
            res.render('auth/login')
        },
        postLogin(req, res, next) {
            const { email, password }   = req.body
           // Validate request 
            if(!email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }
            passport.authenticate('local', (err, user, info) => {
                if(err) {
                    req.flash('error', info.message )
                    return next(err)
                }
                if(!user) {
                    req.flash('error', info.message )
                    return res.redirect('/login')
                }
                req.logIn(user, (err) => {
                    if(err) {
                        req.flash('error', info.message ) 
                        return next(err)
                    }

                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register')
        },
        async postRegister(req, res) {
         const { name, email, password }   = req.body
         // Validate request 
         if(!name || !email || !password) {
             req.flash('error', 'All fields are required')
             req.flash('name', name)
             req.flash('email', email)
            return res.redirect('/register')
         }

         // Check if email exists 
         User.exists({ email: email }, (err, result) => {
             if(result) {
                req.flash('error', 'Email already taken')
                req.flash('name', name)
                req.flash('email', email) 
                return res.redirect('/register')
             }
         })

         // Hash password 
         const hashedPassword = await bcrypt.hash(password, 10)
         // Create a user 
         const user = new User({
             name,
             email,
             password: hashedPassword
         })

         user.save().then((user) => {
            // Login
            return res.redirect('/')
         }).catch(err => {
            req.flash('error', 'Something went wrong')
                return res.redirect('/register')
         })
        },
        logout(req, res) {
          req.logout()
          return res.redirect('/login')  
        },
        profile(req, res) {
            res.render('auth/profile')
        },
        updateProfile(req, res) {
            const { name, email } = req.body
            User.findByIdAndUpdate(req.user._id, { name, email }, { new: true }, (err, user) => {
                if (err) {
                    req.flash('error', 'Could not update profile')
                    return res.redirect('/profile')
                }
                req.flash('success', 'Profile updated successfully')
                res.redirect('/profile')
            })
        },
        adminPage(req, res) {
            res.render('admin/addFood');
        },
        adminPage(req, res) {
            res.render('admin/addFood');
        },
        async addFood(req, res) {
            const { name, image, price, size, toppings, restaurant, location } = req.body;
            const newPizza = new Menu({ name, image, price, size, toppings: toppings.split(','), restaurant });

            try {
                await newPizza.save();

                // Check if the restaurant already exists
                let existingRestaurant = await Restaurant.findOne({ name: restaurant });
                if (!existingRestaurant) {
                    // Add new restaurant
                    const newRestaurant = new Restaurant({ name: restaurant, location });
                    await newRestaurant.save();
                }

                req.flash('success', 'Food added successfully');
                res.redirect('/admin/addFood');
            } catch (err) {
                req.flash('error', 'Error adding pizza');
                res.redirect('/admin/addFood');
            }
        }
    }
}

module.exports = authController