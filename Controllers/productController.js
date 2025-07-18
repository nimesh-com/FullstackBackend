import Product from "../Models/products.js";
import { isAdmin } from "./userController.js";

export async function createProduct(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "Please Login and create a product" });
  }
  const product = new Product(req.body);

  try {
    const response = await product.save();
    return res.status(201).json({
      message: "Product created successfully",
      product: response,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      message: "Error creating product",
      error: error,
    });
  }
}

export async function getProduct(req, res) {
  try {
    if (isAdmin(req)) {
      const product = await Product.find();
      return res.json(product);
    } else {
      const product = await Product.find({ isAvailable: true });
      return res.json(product);
    }
  } catch (error) {
    console.error("Error getting product:", error);
    return res.status(500).json({
      message: "Error getting product",
      error: error,
    });
  }
}

export async function deleteProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Please Login and delete a product" });
    return;
  }
  try {
    const productId = req.params.productId;
    await Product.deleteOne({ productId });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      message: "Error deleting product",
      error: error,
    });
  }
}

export async function updateProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "access denied as you are not admin" });
    return;
  }
  try {
    const data = req.body;
    const productId = req.params.productId;
    data.productId = productId;
    await Product.updateOne({ productId }, data);
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      message: "Error updating product",
      error: error,
    });
  }
}
