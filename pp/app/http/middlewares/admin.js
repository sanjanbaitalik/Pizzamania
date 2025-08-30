function admin (req, res, next) {
    console.log('User:', req.user);
    if(req.isAuthenticated() && req.user.role === 'admin') {
        return next()
    }
    return res.redirect('/')
}

module.exports = admin