require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import { courseRouter } from "./routes/course.route";
import { notificationRouter } from "./routes/notification.route";
import { layoutRouter } from "./routes/layout.route";
import {orderRouter} from "./routes/order.route";
import fileUpload from 'express-fileupload';
import { analyticsRouter } from "./routes/analytics.route";




// import userRouter

// create a server
export const app = express();

// body parser
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// cookie parse
app.use(cookieParser());

// cors =>
app.use(
  cors({
    // origin: process.env.ORIGIN,
    origin:["http://localhost:3000"],
    credentials:true
  })
);

// routes
app.use(
  "/api/v1",
  userRouter,
  courseRouter,
  notificationRouter,
  layoutRouter ,
  orderRouter,
  analyticsRouter
);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});
// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(ErrorMiddleware);
