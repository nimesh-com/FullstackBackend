import express from "express";
import { productReview } from "../Controllers/productController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", productReview);

export default reviewRouter;