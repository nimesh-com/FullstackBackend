import Product from "../Models/products.js";
import Review from "../Models/reviews.js";
import User from "../Models/users.js";
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
      const product = await Product.find({});
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

export default async function GetProductInformation(req, res) {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    console.error("Error getting product:", error);
    return res.status(500).json({
      message: "Error getting product",
      error: error,
    });
  }
}

export async function serachProduct(req, res) {
  const query = req.params.query;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
      isAvailable: true,
    });
    res.json(products);
  } catch (error) {
    console.error("Error searching product:", error);
    return res.status(500).json({
      message: "Error searching product",
      error: error,
    });
  }
}

export async function productReview(req, res) {
  const productId = req.body.productId;
  const review = req.body.review;
  const email = req.body.email;
  const user = await User.findOne({ email: email });

  const reviewData = {
    productId: productId,
    userId: user._id,
    review: review,
    email: email,
  };
  const newReview = new Review(reviewData);
  try {
    await newReview.save();
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      message: "Error adding review",
      error: error,
    });
  }
}

export async function getReviews(req, res) {
  const productId = req.params.productId;
  try {
    const reviews = await Review.find({ productId })
      .populate("userId", "firstname lastname email")
      .sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error getting reviews:", error);
    return res.status(500).json({
      message: "Error getting reviews",
      error: error,
    });
  }
}

export async function deleteReview(req, res) {
  const reviewId = req.params.reviewId;

  try {
    await Review.deleteOne({ _id: reviewId });
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      message: "Error deleting review",
      error: error,
    });
  }
}
