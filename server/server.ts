import { app } from "./app";
import connectDB from "./utils/db";
require("dotenv").config();
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { initSocketServer } from "./socketServer";

//create a server
const server = http.createServer(app);



// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary config:", cloudinary.config());
initSocketServer(server);
server.listen(process.env.PORT, () => {
  console.log("Server is connected with port ", process.env.PORT);
  connectDB();
});
