const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const API_KEY = process.env.N2YO_API_KEY;
const SAT_ID = 25544; 
const OBS_LAT = 45.4215;
const OBS_LON = -75.6972;
const OBS_ALT = 0;
const SECS = 2;