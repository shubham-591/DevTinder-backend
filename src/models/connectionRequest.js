const mongoose = require("mongoose");
const User = require("./user");

const connectionRequestSchema = new mongoose.Schema({

    fromUserId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // reference to the users collection
        required: true
    },
    toUserId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status : {
        type: String,
        required: true,
        // enum: ["ignore", "interested", "accepted", "rejected"], // Use this if dont want to send a custom message
        
        // Use this way if we want to send a custom message also
        enum: {
            values : ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not a valid status`
        }
    }
}, { timestamps : true });

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1});

// pre is a Kind of middleware  
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this; 

    // Check if the fromUserId is same as toUserId
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("Cannot send connection request to yourself");
    }

    next();
})

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;