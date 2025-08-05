import express from "express";
import GetProductInformation, { createProduct, deleteProduct, getProduct, updateProduct } from "../Controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/", createProduct);
productRouter.get("/", getProduct);
productRouter.get("/:productId", GetProductInformation);
productRouter.delete("/:productId", deleteProduct);
productRouter.put("/:productId", updateProduct);

export default productRouter;