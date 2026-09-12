require("dotenv").config();
const express = require('express');
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoute");
const profileRoute = require("./routes/profileRoute");
const requestRoute = require("./routes/requestRoute");
const userRoute = require("./routes/userRoute");
const cors = require("cors"); 

require("./utils/cronjob");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser());

app.use("/", authRoute);
app.use("/", profileRoute);
app.use("/", requestRoute);
app.use("/", userRoute)


connectDB()
    .then(() => {
        console.log("Database connected successfully");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });

  