import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ message: "hello, world!" });
});

app.get("/api/data", (req, res) => {
    const data = {
        message: "This is some sample data from the backend.",
        timestamp: new Date(),
    };
    res.status(200).json(data);
});

export default app;