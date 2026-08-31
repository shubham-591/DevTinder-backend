const express = require("express");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const router = express.Router();


router.post("/signUp", async (req, res) => {
    
    // // const user = new User({
    //     // name: "Jan Doe",
    //     // email: "jan.doe@email.com",
    //     // password: "12345678",
    //     // age: 30
    // // });
    
    // // const savedUser = await user.save();
    // // res.status(201).json(savedUser);
    // console.log(req);
    // res.send("Okay")
    // const user = new User(req.body);
    // try {
    //     const savedUser = await user.save();
    //     res.status(201).json(savedUser);
    // } catch (error) {
    //     res.status(400).json("User creation failed" + error.message);
    // }

    // Requiring the body Data
    
    try {
        const { name, email, password, gender } = req.body;

        if(!name || !email || !password || !gender) {
            throw new Error("All fields are required");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            gender
        })

        const savedUser = await user.save();

        const token = await savedUser.getJWT();
        res.cookie("token", token);

        res.status(201).json({
            message: "User Added Successfully",
            data: savedUser
        });
    } catch (error) {
        res.status(400).send("ERROR :" + error.message);
    } 
})

router.post("/login", async (req, res) => {
    try {
        const { email , password } = req.body;
        const user = await User.findOne({email});
        // console.log("Email received:", email);
        // console.log("User found:", user);
        if(!user) {
            throw new Error("Invalid credentials");
        }
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        const isPasswordValid = await user.validatingPassword(password);
        
        if(!isPasswordValid) {
            throw new Error("Invalid credentials");
        } else {
            const token = await user.getJWT();
            res.cookie("token", token);

            res.status(200).json(user);
        }
        // res.cookie("token", "abcdefghijklmno");
        // const token = jwt.sign({_id: user._id}, "mySecretKey", {expiresIn : "7d"});

        // res.cookie("token", token);
        // res.status(200).json(user);

    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
})

router.post('/logout', async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });
    res.status(200).send("Logout Successfull");
})

module.exports = router;
