const socket = require("socket.io");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: "http://localhost:5173",
        }
    })

    // To track online users
    const onlineUsers = new Map();

    io.on("connection", (socket) => {
        // console.log("Connected to socket.io");

        socket.on("userOnline", (userId) => {

            socket.userId = userId;

            onlineUsers.set(userId, socket.id);
            // console.log("Online users map :", onlineUsers);

            // console.log("User online:", userId);

            // io.emit("userOnline", userId);
            // Tell this newly connected user who is already online
            socket.emit("onlineUsers", Array.from(onlineUsers.keys()));

            // Tell all OTHER users that this user just came online
            socket.broadcast.emit("userOnline", userId);
        });

        socket.on("joinChat", async ({ name, userId, targetUserId }) => {
            // console.log("User joined the chat");

            // Check whether both users are connected
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

            if (!connection) {
                console.log("Users are not connected");
                return;
            }

            const roomId = [userId, targetUserId].sort().join("_");
            // console.log(name + " joined the room " + roomId);
            socket.join(roomId);
        });

        socket.on("sendMessage", async ({ name, userId, targetUserId, newMessage }) => {
            // console.log("Message received:", newMessage);

            // Save messages
            try {

                // Check whether both users are connected
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

                if (!connection) {
                    console.log("Users are not connected");
                    return;
                }

                const roomId = [userId, targetUserId].sort().join("_");
                // console.log(name + " " + "sent a message : " + newMessage);


                let chat = await Chat.findOne({
                    participants: {
                        $all: [userId, targetUserId]
                    }
                });

                if (!chat) {
                    chat = new Chat({
                        participants: [userId, targetUserId],
                        messages: []
                    });
                }

                chat.messages.push({
                    senderId: userId,
                    text: newMessage,
                });

                await chat.save();
                io.to(roomId).emit("receiveMessage", { name, newMessage });

            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("getUserStatus", async (userId) => {

            const isOnline = onlineUsers.has(userId);

            const user = await User.findById(userId).select("lastSeen");

            socket.emit("userStatus", {
                userId,
                isOnline,
                lastSeen: user?.lastSeen || null
            });

        });

        socket.on("disconnect", async () => {

            const userId = socket.userId;

            if (!userId) {
                return;
            }

            onlineUsers.delete(userId);

            // await User.findByIdAndUpdate(userId, {
            //     lastSeen: new Date()
            // });

            // console.log("User offline:", userId);
            const lastSeen = new Date();

            await User.findByIdAndUpdate(userId, {
                lastSeen
            });

            // console.log("User offline:", userId);

            io.emit("userOffline", {
                userId,
                lastSeen
            });
        });
    })

    return io;
}

module.exports = initializeSocket;