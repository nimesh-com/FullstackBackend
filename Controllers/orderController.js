import Order from "../Models/orders";

export async function createOrder(req, res) {
  try {
    if (req.user == null) {
      res.status(403).json({ message: "Please Login and create an order" });
      return;
    }
    const latestOrder = await Order.findOne().sort({ date: -1 }).limit(1);
    let OrderId = "CBC00050";
    if (latestOrder.length > 0) {
      //if order exists
      const latestOrderIdString = latestOrder[0].OrderId; //CBC00050
      const latestOrderIdWithoutPrefix = parseInt(
        latestOrderIdString.replace("CBC", "")
      ); //00050
      const nextOrderId = latestOrderIdWithoutPrefix + 1; //51
      const newOrderId = nextOrderId.toString().padStart(5, "0"); //00051
      OrderId = "CBC" + newOrderId; //CBC00051
    }

    const order = new Order({
      userID: req.user._id,
      email: req.user.email,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      OrderId: OrderId,
      items: [],
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
