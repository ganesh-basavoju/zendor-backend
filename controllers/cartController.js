const Cart = require("../models/cartModel");
const Wallpaper = require("../models/wallpaperModel");
//const Wallpaper = require("../models/wallpaperModel");
const WoodenFloor = require("../models/woodenFloorModel");
const mongoose = require("mongoose");



const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;
    console.log(items,"items")

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }

    let cart = await Cart.findOne({ userId });
    let totalAddedQuantity = 0;
    let totalAddedAmount = 0;

    for (const item of items) {
      const {
        productId,
        productType,
        isSample,
        quantity,
        size,
        area,
        floorArea,
        pricePerUnit
      } = item;
      console.log(floorArea,"follo");

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      if (!["Wallpaper", "WoodenFloor"].includes(productType)) {
        return res.status(400).json({ message: "Invalid product type" });
      }

      if (isSample && (!quantity || quantity < 1)) {
        return res.status(400).json({ message: "Sample must have a valid quantity" });
      }

      if (!isSample && (!floorArea || typeof floorArea !== "object")) {
        return res.status(400).json({ message: "Full order must include floor area details" });
      }

      const ProductModel = productType === "Wallpaper" ? Wallpaper : WoodenFloor;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      // Calculate total price
      let totalPrice = 0;
      if (isSample) {
        totalPrice = pricePerUnit * quantity;
      } else {
        for (const wall in floorArea) {
          totalPrice += floorArea[wall]?.price || 0;
        }
      }

      const newItem = {
        productId,
        productType,
        isSample,
        quantity: isSample ? quantity : undefined,
        size,
        area,
        floorArea: isSample ? undefined : floorArea,
        pricePerUnit,
        totalPrice
      };

      // Create cart if not exists
      if (!cart) {
        cart = new Cart({
          userId,
          items: [newItem],
          totalQuantity: isSample ? quantity : 0,
          totalAmount: totalPrice
        });
      } else {
        const existingItemIndex = cart.items.findIndex(
          i =>
            i.productId.toString() === productId &&
            i.isSample === isSample
        );

        if (existingItemIndex !== -1) {
          // Subtract old item's values from totals
          const oldItem = cart.items[existingItemIndex];
          if (oldItem.isSample && oldItem.quantity) {
            cart.totalQuantity -= oldItem.quantity;
          }
          cart.totalAmount -= oldItem.totalPrice || 0;

          // Replace old item with new item
          cart.items[existingItemIndex] = newItem;
          
          // Add new item's values to totals
          if (isSample) cart.totalQuantity += quantity;
          cart.totalAmount += totalPrice;
        } else {
          // Add new item if it doesn't exist
          cart.items.push(newItem);
          if (isSample) cart.totalQuantity += quantity;
          cart.totalAmount += totalPrice;
        }
      }

      totalAddedQuantity += isSample ? quantity : 0;
      totalAddedAmount += totalPrice;
    }

    await cart.save();

    // Fetch updated cart with populated fields
    const updatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        model: WoodenFloor,
        select: "name images price dp sampleCost"
      });

    // Transform cart items
    const transformedItems = updatedCart.items.map(item => ({
      ...item.toObject(),
      product: item.productId
    }));

    return res.status(200).json({
      message: "Items added/updated in cart",
      cart: {
        ...updatedCart.toObject(),
        items: transformedItems
      }
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getGuestCart = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          items: [],
          totalQuantity: 0,
          totalAmount: 0
        }
      });
    }

    let totalQuantity = 0;
    let totalAmount = 0;

    // Separate items by product type
    const wallpaperItems = items.filter(item => item.productType === 'Wallpaper');
    const woodenFloorItems = items.filter(item => item.productType === 'WoodenFloor');

    // Function to populate items with product details
    const populateItems = async (items, ProductModel) => {
      const productIds = items.map(item => item.productId);
      const products = await ProductModel.find({ _id: { $in: productIds } })
        .select('name images price dp sampleCost');

      return items.map(item => {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) return null;

        // Update totals
        if (item.isSample) totalQuantity += item.quantity || 0;
        totalAmount += item.totalPrice || 0;

        return {
          ...item,
          productId: product // Replace ID with populated product data
        };
      }).filter(item => item !== null); // Remove any items where product wasn't found
    };

    // Populate both types of items
    const populatedWallpapers = wallpaperItems.length > 0
      ? await populateItems(wallpaperItems, Wallpaper)
      : [];

    const populatedWoodenFloors = woodenFloorItems.length > 0
      ? await populateItems(woodenFloorItems, WoodenFloor)
      : [];

    // Combine all populated items
    const populatedItems = [...populatedWallpapers, ...populatedWoodenFloors];

    return res.status(200).json({
      message: "Guest cart fetched successfully",
      cart: {
        items: populatedItems,
        totalQuantity,
        totalAmount
      }
    });

  } catch (error) {
    console.error("Error fetching guest cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getCart = async (req, res) => {
  try {
      const userId = req.user.id;
      
      // First, find the cart with all items
      let cart = await Cart.findOne({ userId });

      console.log("cart",cart);
      if (!cart || cart.items.length === 0) {
          return res.status(200).json({
              message: "Cart is empty",
              cart: {
                  items: [],
                  totalQuantity: 0,
                  totalAmount: 0
              }
          });
      }
      
      // Separate items by their productType
      const wallpaperItems = cart.items.filter(item => item.productType === 'Wallpaper');
      const woodenFloorItems = cart.items.filter(item => item.productType === 'WoodenFloor');
      
      // Function to populate items
      const populateItems = async (items, model) => {
          const productIds = items.map(item => item.productId);
          const products = await model.find({ _id: { $in: productIds } })
              .select('name images price dp sampleCost');
          
          return items.map(item => {
              const product = products.find(p => p._id.equals(item.productId));
              return {
                  ...item.toObject(),
                  productId: product // replace the ID with the populated product
              };
          });
      };
      
      // Populate both types of items
      const populatedWallpapers = wallpaperItems.length > 0 
          ? await populateItems(wallpaperItems, Wallpaper) 
          : [];
      
      const populatedWoodenFloors = woodenFloorItems.length > 0 
          ? await populateItems(woodenFloorItems, WoodenFloor) 
          : [];
      
      // Combine all items back together
      const allItems = [...populatedWallpapers, ...populatedWoodenFloors];
      
      // Reconstruct the cart object
      const populatedCart = {
          ...cart.toObject(),
          items: allItems
      };
      
      return res.status(200).json({ 
          message: "Cart fetched successfully", 
          cart: populatedCart
      });
      
  } catch (error) {
      console.error("Error fetching cart:", error);
      return res.status(500).json({ message: "Server error" });
  }
};

  
const removeFromCart = async (req, res) => {
  try {
      const userId = req.user.id;
      const { productId, isSample } = req.body;

      if (!productId || typeof isSample !== "boolean") {
          return res.status(400).json({ message: "Product ID and isSample flag are required" });
      }

      // Find the cart without population first
      let cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.status(404).json({ message: "Cart not found" });
      }

      const itemIndex = cart.items.findIndex(
          item => item.productId.toString() === productId && item.isSample === isSample
      );

      if (itemIndex === -1) {
          return res.status(404).json({ message: "Item not found in cart" });
      }

      const removedItem = cart.items[itemIndex];

      // Update totals
      if (removedItem.isSample && removedItem.quantity) {
          cart.totalQuantity -= removedItem.quantity;
      }

      cart.totalAmount -= removedItem.totalPrice || 0;

      // Remove item
      cart.items.splice(itemIndex, 1);

      // If cart is empty, delete it
      if (cart.items.length === 0) {
          await Cart.deleteOne({ _id: cart._id });
          return res.status(200).json({ 
              message: "Item removed and cart deleted (empty)",
              cart: {
                  items: [],
                  totalQuantity: 0,
                  totalAmount: 0
              }
          });
      }

      await cart.save();

      // Now fetch the updated cart with proper population for both models
      const updatedCart = await Cart.findOne({ userId });
      
      if (!updatedCart) {
          return res.status(200).json({
              message: "Item removed successfully",
              cart: {
                  items: [],
                  totalQuantity: 0,
                  totalAmount: 0
              }
          });
      }

      // Separate items by their productType
      const wallpaperItems = updatedCart.items.filter(item => item.productType === 'Wallpaper');
      const woodenFloorItems = updatedCart.items.filter(item => item.productType === 'WoodenFloor');

      // Function to populate items
      const populateItems = async (items, model) => {
          const productIds = items.map(item => item.productId);
          const products = await model.find({ _id: { $in: productIds } })
              .select('name images price dp sampleCost');
          
          return items.map(item => {
              const product = products.find(p => p._id.equals(item.productId));
              return {
                  ...item.toObject(),
                  productId: product // replace the ID with the populated product
              };
          });
      };

      // Populate both types of items
      const populatedWallpapers = wallpaperItems.length > 0 
          ? await populateItems(wallpaperItems, Wallpaper) 
          : [];
      
      const populatedWoodenFloors = woodenFloorItems.length > 0 
          ? await populateItems(woodenFloorItems, WoodenFloor) 
          : [];

      // Combine all items back together
      const allItems = [...populatedWallpapers, ...populatedWoodenFloors];

      // Reconstruct the cart object
      const populatedCart = {
          ...updatedCart.toObject(),
          items: allItems
      };

      return res.status(200).json({ 
          message: "Item removed successfully", 
          cart: populatedCart
      });

  } catch (error) {
      console.error("Error removing from cart:", error);
      return res.status(500).json({ message: "Server error" });
  }
};


const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, isSample = true, action } = req.body; // action can be 'increment' or 'decrement'

    if (!productId || typeof isSample !== 'boolean' || !action) {
      return res.status(400).json({ message: "Product ID, isSample flag, and action are required" });
    }

    // First find the cart without population
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.isSample === isSample
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const item = cart.items[itemIndex];

    // Update quantity and totals
    if (action === 'increment') {
      item.quantity += 1;
      cart.totalQuantity += 1;
      cart.totalAmount += item.pricePerUnit;
      item.totalPrice = item.pricePerUnit * item.quantity;
    } else if (action === 'decrement') {
      if (item.quantity <= 1) {
        return res.status(400).json({ message: "Quantity cannot be less than 1" });
      }
      item.quantity -= 1;
      cart.totalQuantity -= 1;
      cart.totalAmount -= item.pricePerUnit;
      item.totalPrice = item.pricePerUnit * item.quantity;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await cart.save();

    // Now fetch the updated cart with proper population for both models
    const updatedCart = await Cart.findOne({ userId });
    
    if (!updatedCart) {
      return res.status(200).json({
        message: "Cart item quantity updated",
        cart: {
          items: [],
          totalQuantity: 0,
          totalAmount: 0
        }
      });
    }

    // Separate items by their productType
    const wallpaperItems = updatedCart.items.filter(item => item.productType === 'Wallpaper');
    const woodenFloorItems = updatedCart.items.filter(item => item.productType === 'WoodenFloor');

    // Function to populate items
    const populateItems = async (items, model) => {
      const productIds = items.map(item => item.productId);
      const products = await model.find({ _id: { $in: productIds } })
        .select('name images price dp sampleCost');
      
      return items.map(item => {
        const product = products.find(p => p._id.equals(item.productId));
        return {
          ...item.toObject(),
          productId: product // replace the ID with the populated product
        };
      });
    };

    // Populate both types of items
    const populatedWallpapers = wallpaperItems.length > 0 
      ? await populateItems(wallpaperItems, Wallpaper) 
      : [];
    
    const populatedWoodenFloors = woodenFloorItems.length > 0 
      ? await populateItems(woodenFloorItems, WoodenFloor) 
      : [];

    // Combine all items back together
    const allItems = [...populatedWallpapers, ...populatedWoodenFloors];

    // Reconstruct the cart object
    const populatedCart = {
      ...updatedCart.toObject(),
      items: allItems
    };

    return res.status(200).json({
      message: "Cart item quantity updated",
      cart: populatedCart
    });

  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update the exports
module.exports = { addToCart, getCart, removeFromCart, updateCartItemQuantity ,getGuestCart};
