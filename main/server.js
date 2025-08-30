// server.js

require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3300
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')(session)
const passport = require('passport')
const Emitter = require('events')
const Cart = require('./app/models/cart')

mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useCreateIndex:true, useUnifiedTopology: true, useFindAndModify : true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected...');
}).catch(err => {
    console.log('Connection failed...')
});

let mongoStore = new MongoDbStore({
    mongooseConnection: connection,
    collection: 'sessions'
})

const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}))

const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})

// Middleware to fetch cart quantity from the database
app.use(async (req, res, next) => {
    if (req.user && req.isAuthenticated()) {
        try {
            const cart = await Cart.findOne({ userId: req.user._id });
            res.locals.cartQty = cart ? cart.totalQty : 0;
        } catch (err) {
            console.error(err);
            res.locals.cartQty = 0;
        }
    } else {
        res.locals.cartQty = 0;
    }
    next();
});

app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

require('./routes/web')(app)
app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT , () => {
    console.log(`Listening on port ${PORT}`)
})

const io = require('socket.io')(server)
io.on('connection', (socket) => {
    socket.on('join', (orderId) => {
        socket.join(orderId)
    })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})