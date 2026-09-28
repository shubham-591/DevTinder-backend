const express = require("express");
const Chat = require("../models/chat");
const { authMiddleware } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const router = express.Router();

router.get("/chat/:targetUserId", authMiddleware, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    // Should not chat with ourselves
    if(userId.toString() === targetUserId.toString()) {
        console.log("Should not chat");
        return res.status(400).json({
            message: "You cannot chat with yourself"
        })
    }

    // Check whether the userId and targetUserId are friends 
    const connection = await ConnectionRequest.findOne({
        $or: [
            {
                fromUserId: userId,
                toUserId: targetUserId,
                status: "accepted"
            },
            {
                fromUserId: targetUserId,
                toUserId: userId,
                status: "accepted"
            }
        ]
    });
    // console.log(connection);

    if(!connection) {
        console.log("Inside");
        return res.status(403).json({
            message: "You are not connected with this user"
        })
    }

    try {
        let chat = await Chat.findOne({
            participants: {
                $all: [userId, targetUserId]
            }
        }).populate({
            path: "messages.senderId",
            select: "name"
        });

        if(!chat) {
            chat = new Chat({
                participants: [userId, targetUserId],
                messages: []
            });
        }
        await chat.save();
        res.status(200).json(chat);
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ message: "Internal server error" });
    }

})

module.exports = router;