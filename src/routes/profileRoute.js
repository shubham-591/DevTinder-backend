const express = require("express");
const {authMiddleware} = require("../middlewares/auth.js"); 
const validatingUserData = require("../utils/validation.js")
const validator = require("validator");
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/profile/view", authMiddleware, async (req, res) => {

    try {
        const user = req.user;
        res.status(200).json(user);
    } catch (error) {
        res.status(400).send("ERROR :" + error.message);
    }
})

router.patch("/profile/edit", authMiddleware, async (req, res) => {

    try {
        const isValidUser = await validatingUserData(req);
        if(!isValidUser) {
            throw new Error("Invalid data");
        }

        const loggedInUser = req.user;

        Object.keys(req.body).forEach((key) => loggedInUser[key] = req.body[key]);
        
        // map() method will work but it will create an unnecessary array which means wastage of memory. Thats why we used forEach bcz we 
        // dont want to return anything, we just want to perform some action

        // const result = Object.keys(req.body).map((key) => {
        //     return loggedInUser[key] = req.body[key];
        // });

        // console.log(result);
        await loggedInUser.save();
        res.status(200).json({ message: `${loggedInUser.name}, your profile has been updated`, data: loggedInUser});
    } catch (error) {
        res.status(400).send("ERROR :" + error.message);
    }
})

router.patch("/profile/password", authMiddleware, async (req, res) => {

    try {
        const user = req.user;
        const existingPassword = await bcrypt.compare(req.body.oldPassword, user.password);
        if(!existingPassword) {
            throw new Error("Password is incorrect!!");
        }
        const { newPassword } = req.body;
        if(!validator.isStrongPassword(newPassword)) {
            throw new Error("Password is not strong");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message : "Your password has been updated!"});

    } catch (error) {
        res.status(400).send("ERROR :" + error.message);
    }
})

module.exports = router;