const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Cart = require("../models/cartModel"); // Fixed import path
const Order = require("../models/orderModel"); // Fixed import path
const User = require("../models/userModel"); // Fixed import path
const WoodenFloor = require("../models/woodenFloorModel");
const Wallpaper = require("../models/wallpaperModel");
const { getShiprocketToken } = require("../utils/shiprocket");
const axios = require("axios");
const Coupons = require("../models/couponModel");
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

const createOrder = async (req, res) => {
  try {
    const shiprocketToken = await getShiprocketToken();
    console.log("ship token", shiprocketToken);
    console.log("Create order endpoint called");
    const userId = req.user?.id;
    const {
      shippingAddress,
      paymentMode = "COD",
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      coupon = "",
      isCouponApplied = false,
      discount = 0,
      totalAfterCoupon,
      couponId = null,
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing shipping address details",
      });
    }

    if (
      paymentMode === "Prepaid" &&
      (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required for Prepaid orders",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const wallpaperItems = cart.items.filter(
      (item) => item.productType === "Wallpaper"
    );
    const woodenFloorItems = cart.items.filter(
      (item) => item.productType === "WoodenFloor"
    );

    const populateItems = async (items, model) => {
      const productIds = items.map((item) => item.productId);
      const products = await model
        .find({ _id: { $in: productIds } })
        .select("name images price dp sampleCost thumbnail");

      return items.map((item) => {
        const product = products.find((p) => p._id.equals(item.productId));
        return {
          ...item.toObject(),
          productDetails: product,
        };
      });
    };

    const populatedWallpapers =
      wallpaperItems.length > 0
        ? await populateItems(wallpaperItems, Wallpaper)
        : [];

    const populatedWoodenFloors =
      woodenFloorItems.length > 0
        ? await populateItems(woodenFloorItems, WoodenFloor)
        : [];

    const allItems = [...populatedWallpapers, ...populatedWoodenFloors];

    const itemsPrice = cart.totalAmount;
    const taxPrice = calculateTax(itemsPrice);
    const shippingPrice = 0;
    const totalPrice = Math.ceil(itemsPrice + taxPrice + shippingPrice);
    console.log("all itms", allItems);

    const orderItems = allItems.map((item) => ({
      productId: item.productId,
      productType: item.productType,
      productName: item.productDetails?.name || "Unknown",
      productThumbnail:
        item.productType === "Wallpaper"
          ? item.productDetails.images[0]?.pic
          : item.productDetails?.images,
      isSample: item.isSample,
      color: item.productType === "Wallpaper" ? item.productDetails.color : "",
      texture:
        item.productType === "Wallpaper" ? item.productDetails.texture : "",
      quantity: item.isSample ? item.quantity : undefined,
      floorArea: item.floorArea,
      pricePerUnit: item.pricePerUnit || 0,
      totalPrice: item.totalPrice,
      status: "pending",
      texture: item?.texture || "NA",
      color: item?.color || "NA",
    }));

    const paymentResult =
      paymentMode === "Prepaid"
        ? {
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: razorpaySignature,
            status: "paid",
            update_time: new Date().toISOString(),
          }
        : null;

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress.billingAddress || shippingAddress,
      paymentMethod: paymentMode,
      paymentResult,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount: discount || 0,
      coupon: coupon || "",
      isCouponApplied: isCouponApplied || false,
      couponId: couponId === "" ? null : couponId,
      totalAfterCoupon: totalAfterCoupon || totalPrice,
      totalPrice,
      status: "pending",
      isPaid: paymentMode === "Prepaid",
      paidAt: paymentMode === "Prepaid" ? new Date() : null,
      isDelivered: false,
      deliveredAt: null,
      isCancelled: false,
      cancelledAt: null,
      order_id: null,
      shipment_id: null,
      awb_code: null,
      notes: shippingAddress.notes || "",
    });

    // Get Shiprocket token (store in env or fetch at login)

    // Prepare items for Shiprocket API
    const totalQuantity = allItems.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

    const shiprocketPayload = {
      order_id: newOrder._id.toString(),
      order_date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
      pickup_location: "Home",
      channel_id: "7120096",
      comment: "Order created via API",
      billing_customer_name: shippingAddress.firstName,
      billing_last_name: shippingAddress.lastName,
      billing_address: shippingAddress.Street,
      billing_address_2: shippingAddress.Landmark || "",
      billing_city: shippingAddress.City,
      billing_pincode: shippingAddress.PinCode,
      billing_state: shippingAddress.State,
      billing_country: shippingAddress.country || "India",
      billing_email: shippingAddress.email,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      shipping_customer_name: "",
      shipping_last_name: "",
      shipping_address: "",
      shipping_address_2: "",
      shipping_city: "",
      shipping_pincode: "",
      shipping_country: "",
      shipping_state: "",
      shipping_email: "",
      shipping_phone: "",
      order_items: allItems.map((item) => ({
        name: item.productDetails.name,
        sku: `SKU_${item.productId}`,
        units: item.quantity || 1,
        selling_price: item.totalPrice,
        discount: "",
        tax: "",
        hsn: 441122,
      })),
      payment_method: paymentMode === "COD" ? "COD" : "Prepaid",
      shipping_charges: shippingPrice,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: totalPrice,
      length: 10,
      breadth: 15,
      height: 20,
      weight: 0.5 * totalQuantity,
    };

    const shiprocketRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      shiprocketPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shiprocketToken}`,
        },
      }
    );

    if (shiprocketRes.status === 200) {
      if (shiprocketRes.data && shiprocketRes.data.shipment_id) {
        newOrder.awb_code = shiprocketRes.data.awb_code;
        newOrder.shippingProvider = "Shiprocket";
        newOrder.order_id = shiprocketRes.data.order_id;
        newOrder.shipment_id = shiprocketRes.data.shipment_id;
      } else {
        console.error("Shiprocket response:", shiprocketRes.data);
        throw new Error(
          "Shiprocket order created but shipment_id not received"
        );
      }
    } else {
      throw new Error(
        `Failed to create shipping order in Shiprocket: ${
          shiprocketRes.data?.message || "Unknown error"
        }`
      );
    }

    const savedOrder = await newOrder.save();

    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalAmount: 0, totalQuantity: 0 } }
    );

    await User.findByIdAndUpdate(userId, {
      $push: { orders: savedOrder._id },
      $set: {
        shippingAddress: newOrder.shippingAddress,
        billingAddress: newOrder.billingAddress,
      },
    });
    if (isCouponApplied) {
      await Coupons.findByIdAndUpdate(couponId, {
        $push: { usedBy: userId },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: savedOrder._id,
        totalAmount: savedOrder.totalPrice,
        status: savedOrder.status,
        trackingNumber: savedOrder.trackingNumber,
        isPaid: savedOrder.isPaid,
        createdAt: savedOrder.createdAt,
      },
    });
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: err.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // Most recent orders first
      .populate("user", "name email") // Optional: user details
      .exec();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }
    console.log(orders, "orders");

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to calculate tax
const calculateTax = (itemsPrice) => {
  // Implement your tax calculation logic here
  return itemsPrice * 0.18; // Example: 18% GST
};

const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updateFields = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update allowed fields
    if (updateFields.status) order.status = updateFields.status;
    if (typeof updateFields.isPaid === "boolean") {
      order.isPaid = updateFields.isPaid;
      if (updateFields.isPaid) {
        order.paidAt = new Date();
      }
    }
    if (typeof updateFields.isDelivered === "boolean") {
      order.isDelivered = updateFields.isDelivered;
      if (updateFields.isDelivered) {
        order.deliveredAt = new Date();
      }
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders with populated user and product details
    const orders = await Order.find({})
      .populate("user", "userName email") // Changed to match user model
      .sort({ createdAt: -1 }) // Most recent orders first
      .lean();

    // Format orders for frontend
    const formattedOrders = orders.map((order) => {
      // Calculate total items count
      const totalItems = order.items.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );

      return {
        orderId: order.order_id,
        orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        date: new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        customer: order.user?.userName || "Unknown",
        itemsCount: totalItems,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        paymentMethod:
          order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid",
        amount: `₹${order.totalPrice.toFixed(2)}`,
        isPaid: order.isPaid,
        isDelivered: order.isDelivered,
        trackingNumber: order.awb_code || "Not shipped yet",
        _id: order._id,
      };
    });

    // Calculate statistics for admin dashboard
    const statistics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      pendingOrders: orders.filter((order) => order.status === "pending")
        .length,
      processingOrders: orders.filter((order) => order.status === "processing")
        .length,
      shippedOrders: orders.filter((order) => order.status === "shipped")
        .length,
      deliveredOrders: orders.filter((order) => order.status === "delivered")
        .length,
      cancelledOrders: orders.filter((order) => order.status === "cancelled")
        .length,
      codOrders: orders.filter((order) => order.paymentMethod === "COD").length,
      prepaidOrders: orders.filter((order) => order.paymentMethod === "Prepaid")
        .length,
    };

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders: formattedOrders,
        statistics,
      },
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving orders",
      error: err.message,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Get the order with basic user info
    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Format order details for frontend
    const formattedOrder = {
      orderInfo: {
        id: order.order_id,
        number: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        date: new Date(order.createdAt).toISOString(),
        status: order.status,
        trackingNumber: order.awb_code,
        shippingProvider: order.shippingProvider || "Shiprocket",
        notes: order.notes || "",
        shipmentId: order.shipment_id,
      },
      customer: {
        id: order.user?._id,
        name:
          order.shippingAddress.firstName +
          " " +
          (order.shippingAddress.lastName || ""),
        email: order.user?.email || order.shippingAddress.email,
        phone: order.user?.phone || order.shippingAddress.phone,
      },
      shipping: {
        address: {
          name: `${order.shippingAddress.firstName} ${
            order.shippingAddress.lastName || ""
          }`,
          street: order.shippingAddress.Street,
          landmark: order.shippingAddress.Landmark || "",
          city: order.shippingAddress.City,
          state: order.shippingAddress.State,
          country: order.shippingAddress.country || "India",
          pinCode: order.shippingAddress.PinCode,
          phone: order.shippingAddress.phone,
        },
        method: "Standard Delivery",
      },
      billing: {
        address: order.billingAddress
          ? {
              name: `${order.billingAddress.firstName} ${
                order.billingAddress.lastName || ""
              }`,
              street: order.billingAddress.Street,
              landmark: order.billingAddress.Landmark || "",
              city: order.billingAddress.City,
              state: order.billingAddress.State,
              country: order.billingAddress.country || "India",
              pinCode: order.billingAddress.PinCode,
              phone: order.billingAddress.phone,
            }
          : null,
        method: order.paymentMethod,
        transactionId: order.paymentResult?.razorpay_payment_id || null,
        status: order.isPaid
          ? "Paid"
          : order.paymentMethod === "COD"
          ? "Pending"
          : "Failed",
        paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : null,
      },
      items: order.items.map((item) => ({
        id: item.productId,
        type: item.productType,
        name: item.productName || "Unknown Product",
        image: item.productThumbnail || "/product-placeholder.jpg",
        price: item.pricePerUnit,
        quantity: item.quantity || (item.isSample ? 1 : null),
        total: item.totalPrice,
        isSample: item.isSample || false,
        floorArea: item.floorArea,
        status: item.status || "pending",
        color: item.color,
        texture: item.texture,
      })),
      summary: {
        subtotal: order.itemsPrice,
        tax: order.taxPrice,
        shipping: order.shippingPrice,
        discount: order.discount || 0,
        total: order.totalPrice,
        currency: "INR",
      },
      timeline: [
        {
          status: "Order Placed",
          date: order.createdAt,
          completed: true,
        },
        {
          status: "Confirmed",
          date: order.confirmedAt,
          completed: [
            "confirmed",
            "processing",
            "shipped",
            "delivered",
          ].includes(order.status),
        },
        {
          status: "Processing",
          date: order.processingAt,
          completed: ["processing", "shipped", "delivered"].includes(
            order.status
          ),
        },
        {
          status: "Shipped",
          date: order.shippedAt,
          completed: ["shipped", "delivered"].includes(order.status),
          trackingNumber: order.awb_code,
        },
        {
          status: "Delivered",
          date: order.deliveredAt,
          completed: order.status === "delivered",
        },
      ],
    };

    res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      data: formattedOrder,
    });
  } catch (err) {
    console.error("Get order details error:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving order details",
      error: err.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, cancellationReason, notes } = req.body;
    const userId = req.user?.id; // Assuming you have user authentication
    console.log(orderId, status, trackingNumber, cancellationReason, notes);
    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has permission (admin or order owner)
    if (
      order.user.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this order",
      });
    }

    // Prepare update object
    const updateData = {
      status,
      notes: notes || order.notes,
    };

    // Status-specific updates
    switch (status) {
      case "processing":
        updateData.processingAt = new Date();
        break;
      case "shipped":
        if (!trackingNumber) {
          return res.status(400).json({
            success: false,
            message: "Tracking number is required when shipping",
          });
        }
        updateData.shippedAt = new Date();
        updateData.trackingNumber = trackingNumber;

        break;
      case "delivered":
        updateData.deliveredAt = new Date();
        updateData.isDelivered = true;
        break;
      case "cancelled":
      case "returned":
        if (!cancellationReason) {
          return res.status(400).json({
            success: false,
            message: `${status} reason is required`,
          });
        }
        updateData.cancelledAt = new Date();
        updateData.isCancelled = true;
        updateData.cancellationReason = cancellationReason;
        break;
    }

    // Update order status and timeline
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    }).populate("user", "userName email phone");

    // Format the response similar to getOrderDetails
    const formattedOrder = {
      orderInfo: {
        id: updatedOrder._id,
        number: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        notes: updatedOrder.notes,
      },
      timeline: [
        {
          status: "Order Placed",
          date: updatedOrder.createdAt,
          completed: true,
        },
        {
          status: "Processing",
          date: updatedOrder.processingAt,
          completed: ["processing", "shipped", "delivered"].includes(
            updatedOrder.status
          ),
        },
        {
          status: "Shipped",
          date: updatedOrder.shippedAt,
          completed: ["shipped", "delivered"].includes(updatedOrder.status),
        },
        {
          status: "Delivered",
          date: updatedOrder.deliveredAt,
          completed: updatedOrder.status === "delivered",
        },
      ],
    };

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: formattedOrder,
    });
  } catch (err) {
    console.error("Update order status error:", {
      error: err.message,
      stack: err.stack,
      orderId: req.params.orderId,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error while updating order status",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  updateOrderStatus,
  createOrder,
  getOrders,
  updateOrder,
  getAllOrders,
  getOrderDetails,
};
