const jwt = require('jsonwebtoken');
const user = require('../models/User')

let fetchUser = async (req, res, next) => {
    let token = req.cookies['auth-token']
    if (!token) {
        return res.status(401).json({ message: "You have to logged in first" })
    }
    try {
        let data = jwt.verify(token, 'shhhhh')
        let User = await user.findOne({ email: data.email }).select("-password")
        req.user = User
    } catch (error) {
        return res.status(401).json({message:"Invalid token"})
    }
    next()
}

module.exports = fetchUser