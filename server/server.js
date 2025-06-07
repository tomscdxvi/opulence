const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer();
const socket = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

socket.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
    })

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
    })
});

const HTTP_PORT = process.env.HTTP_PORT || 6001;

const PORT = process.env.PORT || 6000;

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})

const connectToMongoDb = async() => {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });

        console.log("Connected to MongoDB");
    } finally {
        await client.close();
    }
}

try {
    app.listen(PORT, () => console.log(`Connected to Server at Port: ${PORT}`));
    httpServer.listen(HTTP_PORT, () => {
        console.log(`Connected to HTTP Server at HTTP Port ${HTTP_PORT}`);
    })
    connectToMongoDb().catch(console.dir);
} catch(error) {
    console.log(`${error}, failed to connect`);
}
