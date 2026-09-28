import "dotenv/config";
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import Redis from "ioredis";
import User from "./modules/user.model.js";

// MongoDB connection
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

connectToMongoDB();

// Redis connection
const redis = new Redis(process.env.REDIS_URI);

redis.once("ready", () => {
    console.log("Connected to Redis");
});

redis.on("error", (error) => {
    console.error("Redis connection error:", error);
});

// Express app
const app = express();

app.use(morgan("dev"));
app.use(express.json());

// GET user
app.get("/user/:id", async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
        });

        res.json({
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching user",
        });
    }
});

// POST user
app.post("/user", async (req, res) => {
    try {
        const newUser = new User(req.body);

        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            data: newUser,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error creating user",
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



            