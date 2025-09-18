import Order from "../Models/orders.js";
import Product from "../Models/products.js";
import { isAdmin } from "./userController.js";
import nodemailer from "nodemailer";


const pwd = "kdedlshgzmdmchzr";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "user.nimesh@gmail.com",
    pass: pwd,
  },
});

export async function createOrder(req, res) {
  try {
    if (req.user == null) {
      res.status(403).json({ message: "Please Login and create an order" });
      return;
    }

    const latestOrder = await Order.findOne().sort({ date: -1 }); // findOne already returns a single doc
    let OrderId = "CBC00050";

    if (latestOrder) {
      // if order exists
      const latestOrderIdString = latestOrder.orderID; // correct field
      if (latestOrderIdString) {
        const latestOrderIdWithoutPrefix = parseInt(
          latestOrderIdString.replace("CBC", "")
        ); // e.g. 50
        const nextOrderId = latestOrderIdWithoutPrefix + 1; // 51
        const newOrderId = nextOrderId.toString().padStart(5, "0"); // 00051
        OrderId = "CBC" + newOrderId; // CBC00051
      }
    }
    const items = [];
    let total = 0;

    if (req.body.items !== null && Array.isArray(req.body.items)) {
      for (let i = 0; i < req.body.items.length; i++) {
        let item = req.body.items[i];

        let product = await Product.findOne({ productId: item.productId });
        if (product == null) {
          return res
            .status(404)
            .json({ message: "Product not found " + item.productId });
        }
        items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          qty: item.qty,
          image: product.image[0],
        });
        total += product.price * item.qty;
      }
    } else {
      return res.status(400).json({ message: "Invalid order items format" });
    }

    const order = new Order({
      email: req.user.email,
      name: req.user.firstname + " " + req.user.lastname,
      address: req.body.address,
      phone: req.body.phone,
      orderID: OrderId, // match schema exactly
      items: items,
      paymentMethod: req.body.paymentMethod,
      total: total,
    });
console.log(order);
    const response = await order.save();

    const message = {
      from: "user.nimesh@gmail.com",
      to: req.body.email,
      subject: "✅ Order Confirmation – Your order has been placed",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <div style="background: #00809D; padding: 20px; text-align: center; color: #fff;">
      <h1 style="margin: 0;">Thank You for Your Order! 🎉</h1>
      <p style="margin: 5px 0;">Order ID: <strong>${OrderId}</strong></p>
    </div>

    <div style="padding: 20px;">
      <p>Hi <strong>${req.user.firstname}</strong>,</p>
      <p>Your order has been placed successfully. Below are your order details:</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f5f5f5; text-align: left;">
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Image</th>
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" />
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.qty}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs.${item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2 style="text-align: right; margin-top: 20px;">Total: <span style="color: #00809D;">Rs.${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></h2>

      <div style="margin-top: 30px; text-align: center;">
        <p style="font-size: 14px; color: #555;">We’ll notify you once your order is shipped 🚚</p>
        <a href="https://luxeaura-alpha-wheat.vercel.app/dashboard" 
          style="display: inline-block; background: #00809D; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          View Order
        </a>
      </div>
    </div>

    <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
      <p>&copy; ${new Date().getFullYear()} Luxe Aura. All rights reserved.</p>
    </div>
  </div>
  `
    };


    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: response,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Error creating order",
      error: error,
    });
  }
}

export async function getOrders(req, res) {
  const page = parseInt(req.params.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.params.limit) || 10; // Default to 10 items per page if not provided

  try {
    if (req.user.role == "admin") {
      const orderCount = await Order.countDocuments();
      const totalPages = Math.ceil(orderCount / limit);
      const orders = await Order.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date: -1 });
      res.json({
        orders: orders,
        totalPages: totalPages,
      });
    } else {
          const orderCount = await Order.countDocuments();
      const totalPages = Math.ceil(orderCount / limit);
      const orders = await Order.find({ email: req.user.email })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({
          date: -1,
        });
      res.json({
        orders: orders,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    console.error("Error getting orders:", error);
    return res.status(500).json({
      message: "Error getting orders",
      error: error,
    });
  }
}

export async function UpdateOrder(req, res) {

  try {
    if (isAdmin(req)) {
      const orderId = req.params.id;
      const status = req.body.status;
      Order.findOneAndUpdate({ orderID: orderId }, { status: status }).then((order) => {
        if (order == null) {
          res.status(404).json({ message: "Order not found" });
        } else {
          res.json({ message: "Order updated successfully" });
        }
      })
    }

  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      message: "Error updating order",
      error: error,
    });
  }

}
