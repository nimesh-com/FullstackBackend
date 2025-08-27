import express from "express";
import { createOrder, getOrders, UpdateOrder } from "../Controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/", createOrder);
orderRouter.get("/:page/:limit",getOrders);
orderRouter.put("/:id",UpdateOrder);

export default orderRouter;