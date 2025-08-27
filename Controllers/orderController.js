import Order from "../Models/orders.js";
import Product from "../Models/products.js";
import { isAdmin } from "./userController.js";

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
      total: total,
    });

    const response = await order.save();
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

export async function UpdateOrder(req,res){

  try{
    if(isAdmin(req)){
      const orderId = req.params.id;
      const status = req.body.status;
      Order.findOneAndUpdate({orderID:orderId},{status:status}).then((order)=>{
        if(order==null){
          res.status(404).json({message:"Order not found"});
        }else{
          res.json({message:"Order updated successfully"});
        }
      })
    }
    
  }catch(error){
    console.error("Error updating order:", error);
    return res.status(500).json({
      message: "Error updating order",
      error: error,
    });
  }

}
