import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import userRouter from "./Routers/userRouter.js";
import { decode } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import productRouter from "./Routers/productRouter.js";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  const value = req.headers["authorization"];
  if (value != null) {
    const token = value.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (decoded == null) {
        return res.status(403).json({
          message: "Unauthorized access",
        });
      } else {
        req.user = decoded;
        next();
      }
    });
  } else {
    next();
  }
});

const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString).then(() => {
  console.log("Connected to MongoDB");
});

app.use("/users", userRouter);
app.use("/products", productRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
