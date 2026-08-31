const express = require("express");
const {authMiddleware} = require("../middlewares/auth.js"); 
const ConnectionRequest = require("../models/connectionRequest")
const User = require("../models/user")

const router = express.Router();

router.post("/request/send/:status/:toUserId", authMiddleware, async (req, res) => {
    
    try {
        
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["ignored", "interested"];
        if(!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status type :" + status,
            })
        }

        const toUser = await User.findById(toUserId);
        if(!toUser) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or:[
                {fromUserId, toUserId},
                {fromUserId: toUserId, toUserId: fromUserId},
            ]
        })

        if(existingConnectionRequest) {
            return res.status(400).send({
                message: "Connection Request Already Exists"
            })
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

        const data = await connectionRequest.save();
        res.status(200).json({
            // message: "Connection Request Sent Successfully",
            // message: req.user.name + " is " + status + " in " + toUser.name,
            message: status == 'interested' ? req.user.name + " is " + status + " in " + toUser.name : req.user.name + " " + status + " " + toUser.name,
            data
        })

    } catch (error) {
        res.status(400).send("ERROR : " + error.message);
    }
})

router.post("/request/review/:status/:requestId", authMiddleware, async (req, res) => {
    
    try {
        
        const loggedInUser = req.user;
        const { status, requestId } = req.params;
        

        const allowedStatus = ["accepted", "rejected"];
        if(!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Status not allowed"
            });
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser,
            status: "interested"
        })

        if(!connectionRequest) {
            return res.status(404).json({
                message: "Connection request not found"
            })
        }

        connectionRequest.status = status;

        const data = await connectionRequest.save();

        res.status(200).json({
            message: "Connection request " + status, 
            data
        })

    } catch (error) {
        res.status(400).send("ERROR : " + error.message);
    }
})

module.exports = router;