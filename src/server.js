require("dotenv").config();
const express = require('express');
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoute");
const profileRoute = require("./routes/profileRoute");
const requestRoute = require("./routes/requestRoute");
const userRoute = require("./routes/userRoute");
const paymentRoute = require("./routes/paymentRoute");
const chatRoute = require("./routes/chatRoute");
const cors = require("cors"); 
const http = require("http");
const initializeSocket = require("./utils/socket");

require("./utils/cronjob");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
// app.use("/", paymentRoute);

app.use(cookieParser());
// app.use("/", paymentRoute);
app.use(express.json()); // Middleware to parse JSON bodies

const server = http.createServer(app);
const io = initializeSocket(server);

app.use("/", authRoute);
app.use("/", profileRoute);
app.use("/", requestRoute(io));
app.use("/", userRoute);
app.use("/", paymentRoute);
app.use("/", chatRoute);


connectDB()
    .then(() => {
        console.log("Database connected successfully");
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });

  