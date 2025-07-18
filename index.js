import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import userRouter from "./Roters/userRouter.js";
import { decode } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import productRouter from "./Roters/productRouter.js";

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  const value = req.headers["authorization"];
  if (value != null) {
    const token = value.replace("Bearer ", "");
    jwt.verify(token, "ABC-123", (err, decoded) => {
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

const connectionString =
  "mongodb+srv://admin:123@fullstack-db.a7i51fc.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-db";

mongoose.connect(connectionString).then(() => {
  console.log("Connected to MongoDB");
});

app.use("/users", userRouter);
app.use("/products", productRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
