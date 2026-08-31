const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const router = express.Router();

const USER_SAFE_DATA = "name age gender photoUrl skills about";

// Get all the pending connection requests for the loggedIn User
router.get("/user/requests/received", authMiddleware, async (req, res) => {
    
    try {
        
        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        // }).populate("fromUserId", ["name", "gender"]);
        // }).populate("fromUserId", "name gender age skills");  // Another way is to pass in String
        }).populate("fromUserId", USER_SAFE_DATA);  

        res.status(200).json({
            message: "Data fetched successfully",
            data: connectionRequest
        })

    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

router.get("/user/connections", authMiddleware, async (req, res) => {
    
    try {
        
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                {
                    toUserId: loggedInUser._id, status: "accepted"
                },
                {
                    fromUserId: loggedInUser._id, status: "accepted",
                }
            ]
        }).populate(
            "fromUserId",
            // "name gender age skills"
            USER_SAFE_DATA
        ).populate(
            "toUserId",
            // "name gender age skills"
            USER_SAFE_DATA
        );

        const data = connectionRequests.map((elem) => {
            // We cant compare two mongodb ids using === , we have to use equals method
            // if(elem.fromUserId._id === loggedInUser._id) {

            // if(elem.fromUserId._id.equals(loggedInUser._id)) {
            // OR 
            if(elem.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return elem.toUserId;
            }
            return elem.fromUserId;
        });

        res.status(200).json({
            // data: connectionRequests
            data: data
        })

    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }    
});

router.get("/user/feed", authMiddleware, async (req, res) => {
    
    try {

        // Get the page number and limit from the query parameters
        const page = req.query.page || 1;

        // Danger bcz what if user set limit to 100000000 then it will take a lot of time to fetch these many users
        // const limit = req.query.limit || 10;

        // Another way
        let limit = req.query.limit || 10;
        limit = limit > 30 ? 30 : limit;
        const offset = (page - 1) * limit;
        // console.log(page, limit, offset);
        
        const loggedInUser = req.user;

        // const allUsers = await User.find();

        const allRequests = await ConnectionRequest.find({
            $or: [
                {
                    toUserId: loggedInUser._id
                },
                {
                    fromUserId: loggedInUser._id
                }
            ]
        }).select("fromUserId toUserId");

        let excludeUserIds = [];
        for(let i=0;i<allRequests.length;i++) {
            excludeUserIds[i] = allRequests[i].toUserId.toString() === loggedInUser._id.toString() ? allRequests[i].fromUserId._id.toString() : allRequests[i].toUserId._id.toString();
        }

        excludeUserIds[excludeUserIds.length] = loggedInUser._id.toString();
        // console.log(excludeUserIds);
        
        // const filteredData = allUsers.filter((elem) => {
        //     return !arr.includes(elem._id.toString())
        // });
        // console.log(filteredData);
        const filteredData = await User.find({
            _id: { $nin: excludeUserIds}
        })
        .select(USER_SAFE_DATA)
        .skip(offset)
        .limit(limit);

        res.status(200).json({
            data: filteredData
        })


    } catch (error) {
        res.status(400).json({
            message: "ERROR :" + error.message
        })
    }
})

module.exports = router;
