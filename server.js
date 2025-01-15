const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const app = express();

require('dotenv').config();

app.use(express.static('public'));

const server = http.createServer(app);
const io = socketio(server);

const API_KEY = process.env.N2YO_API_KEY;
const SAT_ID = 25544; // ID for ISS
const OBS_LAT = 45.4215; // Ottawa latitude
const OBS_LON = -75.6972; // Ottawa longitude
const OBS_ALT = 0; // Observation altitude
const SECS = 2; // Seconds in future to get satellite positions

const UPDATE_INTERVAL_MS = 10_000; // Interval in ms to fetch new data

io.on("connection", (socket) => {
    console.log("Client connected.");

    const intervalId = setInterval(async () => {
        try {
        // Build URL to fetch data from the N2YO API
        const url = `https://api.n2yo.com/rest/v1/satellite/positions/\
${SAT_ID}/${OBS_LAT}/${OBS_LON}/${OBS_ALT}/${SECS}&apiKey=${API_KEY}`;
    
        // Fetch satellite data
        const response = await fetch(url);
        // Parse JSON from response
        const data = await response.json();
        // Send data to client
        socket.emit("satelliteData", data);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}, UPDATE_INTERVAL_MS); // End of setInterval
    // Handle Client Disconnect
    socket.on("disconnect", () => {
        console.log("Client Disconnected.");
        clearInterval(intervalId);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});