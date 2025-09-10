import express from "express";
import {
  deleteReview,
  getReviews,
  productReview,
} from "../Controllers/productController.js";
import { get } from "mongoose";

const reviewRouter = express.Router();

reviewRouter.post("/", productReview);
reviewRouter.get("/:productId", getReviews);
reviewRouter.delete("/:reviewId", deleteReview);

export default reviewRouter;
