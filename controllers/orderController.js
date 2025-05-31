const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Cart = require("../models/cartModel"); // Fixed import path
const Order = require("../models/orderModel"); // Fixed import path
const User = require("../models/userModel"); // Fixed import path
const WoodenFloor = require("../models/woodenFloorModel");
const Wallpaper = require("../models/wallpaperModel");
const { getShiprocketToken } = require("../utils/shiprocket");
const axios = require("axios");
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

// const createOrder = async (req, res) => {
//   try {
//     console.log("Create order endpoint called");
//     const userId = req.user?.id;
//     const { shippingAddress, paymentMode = "COD", razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

//     // Validate required fields
//     if (!shippingAddress) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or missing shipping address details",
//       });
//     }

//     // Validate payment details for Prepaid orders
//     if (paymentMode === "Prepaid" && (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature)) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification details are required for Prepaid orders",
//       });
//     }

//     // 1. Get and populate the user's cart with both product types
//     let cart = await Cart.findOne({ userId });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Cart is empty",
//       });
//     }

//     // Separate items by product type for population
//     const wallpaperItems = cart.items.filter(item => item.productType === 'Wallpaper');
//     const woodenFloorItems = cart.items.filter(item => item.productType === 'WoodenFloor');

//     // Function to populate items
//     const populateItems = async (items, model) => {
//       const productIds = items.map(item => item.productId);
//       const products = await model.find({ _id: { $in: productIds } })
//         .select('name images price dp sampleCost thumbnail');

//       return items.map(item => {
//         const product = products.find(p => p._id.equals(item.productId));
//         return {
//           ...item.toObject(),
//           productDetails: product // attach populated product
//         };
//       });
//     };

//     // Populate both types of items
//     const populatedWallpapers = wallpaperItems.length > 0
//       ? await populateItems(wallpaperItems, Wallpaper)
//       : [];

//     const populatedWoodenFloors = woodenFloorItems.length > 0
//       ? await populateItems(woodenFloorItems, WoodenFloor)
//       : [];

//     // Combine all populated items
//     const allItems = [...populatedWallpapers, ...populatedWoodenFloors];

//     // 2. Calculate prices
//     const itemsPrice = cart.totalAmount;
//     const taxPrice = calculateTax(itemsPrice);
//     const shippingPrice = 0; // Free shipping or calculate as needed
//     const totalPrice = Math.ceil(itemsPrice + taxPrice + shippingPrice);

//     // 3. Format items for order
//     const orderItems = allItems.map((item) => ({
//       productId: item.productId,
//       productType: item.productType,
//       productName: item.productDetails?.name || "Unknown",
//       productThumbnail: item.productType==="Wallpaper"?item.productDetails.images[0]?.pic:item.productDetails?.images ,
//       isSample: item.isSample,
//       quantity: item.isSample ? item.quantity : undefined,
//       floorArea: item.floorArea,
//       pricePerUnit: item.pricePerUnit,
//       totalPrice: item.totalPrice,
//       status: "pending" // Initial status for each item
//     }));
//     console.log("all",allItems[0]);

//     // 4. Prepare payment result
//     const paymentResult = paymentMode === "Prepaid" ? {
//       razorpay_payment_id: razorpayPaymentId,
//       razorpay_order_id: razorpayOrderId,
//       razorpay_signature: razorpaySignature,
//       status: "paid",
//       update_time: new Date().toISOString()
//     } : null;

//     // 5. Create the new order instance
//     const newOrder = new Order({
//       user: userId,
//       items: orderItems,
//       shippingAddress: {
//         firstName: shippingAddress.firstName,
//         lastName: shippingAddress.lastName,
//         companyName: shippingAddress.companyName || '',
//         email: shippingAddress.email,
//         phone: shippingAddress.phone,
//         Street: shippingAddress.Street,
//         Landmark: shippingAddress.Landmark || '',
//         City: shippingAddress.City,
//         State: shippingAddress.State,
//         PinCode: shippingAddress.PinCode,
//         country: shippingAddress.country || 'India',
//         isHome: shippingAddress.isHome !== false // Default to true if not specified
//       },
//       billingAddress: shippingAddress.billingAddress || {
//         ...shippingAddress,
//         isHome: shippingAddress.isHome !== false
//       },
//       paymentMethod: paymentMode,
//       paymentResult: paymentResult,
//       itemsPrice,
//       taxPrice,
//       shippingPrice,
//       discount: shippingAddress.discount || 0,
//       totalPrice,
//       status: "pending",
//       isPaid: paymentMode === "Prepaid",
//       paidAt: paymentMode === "Prepaid" ? new Date() : null,
//       isDelivered: false,
//       deliveredAt: null,
//       isCancelled: false,
//       cancelledAt: null,
//       trackingNumber: null,
//       notes: shippingAddress.notes || ''
//     });

//     // 6. Create shipping order
//     const totalQuantity = allItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
//     const productNames = allItems.map(item => item.productDetails?.name || "Zendor Product").join(", ");

//     const shippingData = {
//       api_key: "dd2b48e36cf8eb837d7b",
//       customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
//       customer_email: shippingAddress.email,
//       customer_address1: shippingAddress.Street,
//       customer_address2: shippingAddress.Landmark || "",
//       customer_address_landmark: shippingAddress.Landmark || "",
//       customer_address_state: shippingAddress.State,
//       customer_address_city: shippingAddress.City,
//       customer_address_pincode: shippingAddress.PinCode,
//       customer_contact_number1: shippingAddress.phone,
//       customer_contact_number2: "",
//       product_id: newOrder._id.toString(),
//       product_name: productNames,
//       sku: `SKU${Date.now()}_${newOrder._id}`,
//       mrp: totalPrice.toString(),
//       product_size: "Multiple",
//       product_weight: (0.5 * totalQuantity).toString(),
//       product_color: "Standard",
//       pay_mode: paymentMode,
//       quantity: totalQuantity.toString(),
//       total_amount: totalPrice.toString(),
//       client_order_no: newOrder._id.toString()
//     };
//     console.log("new Order:", newOrder);

//     try {
//       const shipResponse = await axios.post(
//         "https://www.shipcorrect.com/api/createForwardOrder.php",
//         shippingData,
//         {
//           headers: {
//             "Content-Type": "application/json"
//           }
//         }
//       );

//       if (shipResponse.status===200) {
//         newOrder.trackingNumber = shipResponse.data.order_no;
//         newOrder.shippingProvider = "ShipCorrect";
//         console.log("ShipCorrect order created successfully",shipResponse);
//       } else {
//         throw new Error('Shipping order creation failed');
//       }
//     } catch (error) {
//       console.error("Shipping API Error:", error.response?.data || error.message);
//       throw new Error('Failed to create shipping order');
//     }

//     // 7. Save the final order
//     const savedOrder = await newOrder.save();

//     // 8. Clear the user's cart
//     await Cart.findOneAndUpdate(
//       { userId },
//       { $set: { items: [], totalAmount: 0, totalQuantity: 0 } }
//     );

//     // 9. Link order to user's profile
//     await User.findByIdAndUpdate(userId, {
//       $push: { orders: savedOrder._id },
//       $set: {
//         shippingAddress: newOrder.shippingAddress,
//         billingAddress: newOrder.billingAddress
//       }
//     });

//     res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       data: {
//         orderId: savedOrder._id,
//         orderNumber: savedOrder.orderNumber, // Virtual field
//         totalAmount: savedOrder.totalPrice,
//         status: savedOrder.status,
//         trackingNumber: savedOrder.trackingNumber,
//         isPaid: savedOrder.isPaid,
//         createdAt: savedOrder.createdAt
//       },
//     });

//   } catch (err) {
//     console.error("Create order error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Error creating order",
//       error: err.message,
//     });
//   }
// };

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

    const orderItems = allItems.map((item) => ({
      productId: item.productId,
      productType: item.productType,
      productName: item.productDetails?.name || "Unknown",
      productThumbnail:
        item.productType === "Wallpaper"
          ? item.productDetails.images[0]?.pic
          : item.productDetails?.images,
      isSample: item.isSample,
      quantity: item.isSample ? item.quantity : undefined,
      floorArea: item.floorArea,
      pricePerUnit: item.pricePerUnit,
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
      discount: shippingAddress.discount || 0,
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
    console.log("ship", shiprocketRes);
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
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Access denied. Admin privileges required."
    //   });
    // }

    // Fetch all orders with populated user and product details
    const orders = await Order.find({})
      .populate("user", "userName") // Changed to userName to match the user model
      .populate({
        path: "items.productId",
        model: WoodenFloor,
        select: "name images price",
      })
      .populate({
        path: "items.productId",
        model: Wallpaper,
        select: "name images price",
      })
      .sort({ createdAt: -1 }) // Most recent orders first
      .lean(); // Convert to plain JavaScript object

    console.log(orders, "orders");

    // Format orders to match frontend UI requirements
    const formattedOrders = orders.map((order) => ({
      orderId: order.trackingNumber, // Format: #25426
      date: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }), // Format: Nov 8th,2023
      customer: order.user?.userName || "Unknown",
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1), // Capitalize status
      amount: `₹${order.totalPrice.toFixed(2)}`, // Format: ₹200.00
      _id: order._id, // Keep original ID for actions
    }));

    // Calculate statistics for admin dashboard
    const statistics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      pendingOrders: orders.filter((order) => order.status === "pending")
        .length,
      deliveredOrders: orders.filter((order) => order.status === "delivered")
        .length,
      canceledOrders: orders.filter((order) => order.status === "canceled")
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
        error: "Please provide a valid MongoDB ObjectId",
      });
    }

    // First get the order with basic user info
    const order = await Order.findById(orderId)
      .populate("user", "userName email phone profilePicture")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        error: `No order found with ID: ${orderId}`,
      });
    }

    // Separate items by product type for population
    const wallpaperItems = order.items.filter(
      (item) => item.productType === "Wallpaper"
    );
    const woodenFloorItems = order.items.filter(
      (item) => item.productType === "WoodenFloor"
    );

    // Function to populate items
    const populateItems = async (items, model) => {
      const productIds = items.map((item) => item.productId);
      const products = await model
        .find({ _id: { $in: productIds } })
        .select("name images price dp sampleCost thumbnail category")
        .lean();

      return items.map((item) => {
        const product = products.find((p) => p._id.equals(item.productId));
        return {
          ...item,
          productDetails: product || null,
        };
      });
    };

    // Populate both types of items
    const populatedWallpapers =
      wallpaperItems.length > 0
        ? await populateItems(wallpaperItems, Wallpaper)
        : [];

    const populatedWoodenFloors =
      woodenFloorItems.length > 0
        ? await populateItems(woodenFloorItems, WoodenFloor)
        : [];

    // Combine all populated items back into order
    order.items = [...populatedWallpapers, ...populatedWoodenFloors];

    // Format order details for frontend
    const formattedOrder = {
      orderInfo: {
        id: order._id,
        number: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        date: new Date(order.createdAt).toISOString(),
        status: order.status,
        trackingNumber: order.trackingNumber,
        shippingProvider: order.shippingProvider || "ShipCorrect",
        notes: order.notes || "",
      },
      customer: {
        id: order.user._id,
        name: order.user.userName,
        email: order.user.email,
        phone: order.user.phone,
        avatar: order.user.profilePicture || "/default-avatar.png",
      },
      shipping: {
        address: {
          street: order.shippingAddress.Street,
          landmark: order.shippingAddress.Landmark || "",
          city: order.shippingAddress.City,
          state: order.shippingAddress.State,
          country: order.shippingAddress.country || "India",
          pinCode: order.shippingAddress.PinCode,
          type: order.shippingAddress.isHome ? "Home" : "Work",
        },
        method: "Standard Delivery", // Can be dynamic if available
        estimatedDelivery: order.expectedDelivery
          ? new Date(order.expectedDelivery).toISOString()
          : null,
      },
      billing: {
        address: order.billingAddress
          ? {
              street: order.billingAddress.Street,
              landmark: order.billingAddress.Landmark || "",
              city: order.billingAddress.City,
              state: order.billingAddress.State,
              country: order.billingAddress.country || "India",
              pinCode: order.billingAddress.PinCode,
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
        name:
          item.productDetails?.name || item.productName || "Unknown Product",
        sku:
          item.productDetails?.sku ||
          `SKU-${item.productId.toString().slice(-6)}`,
        image:
          item.productDetails?.images?.[0] ||
          item.productDetails?.thumbnail ||
          item.productThumbnail ||
          "/product-placeholder.jpg",
        category: item.productDetails?.category || item.productType,
        price: item.pricePerUnit,
        quantity: item.quantity || (item.isSample ? 1 : null),
        total: item.totalPrice,
        isSample: item.isSample || false,
        size: item.size,
        floorArea: item.floorArea,
        status: item.status || "pending",
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
          date: new Date(order.createdAt).toISOString(),
          completed: true,
        },
        {
          status: "Processing",
          date: order.processingAt
            ? new Date(order.processingAt).toISOString()
            : null,
          completed: order.status !== "pending",
        },
        {
          status: "Shipped",
          date: order.shippedAt
            ? new Date(order.shippedAt).toISOString()
            : null,
          completed: ["shipped", "delivered"].includes(order.status),
        },
        {
          status: "Delivered",
          date: order.deliveredAt
            ? new Date(order.deliveredAt).toISOString()
            : null,
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
    console.error("Get order details error:", {
      error: err.message,
      stack: err.stack,
      orderId: req.params.orderId,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving order details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
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
