const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authMiddleware = async (req, res, next) => {
    try {
        const { token } = await req.cookies;
        if (!token) {
            // throw new Error("Token is not valid");
            return res.status(401).send("Please Login");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { _id } = decoded;
        const user = await User.findById(_id);

        if (!user) {
            throw new Error("User doesn't exist");
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(400).send("ERROR :" + error.message);
    }

}

module.exports = {
    authMiddleware
};