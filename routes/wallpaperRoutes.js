const express = require('express');
const router = express.Router();
const wallpaperController = require('../controllers/wallpaperController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/products', wallpaperController.getProducts); // Changed to GET method
router.get('/getCategories', wallpaperController.getCategories);
router.get('/product/:id', wallpaperController.getProduct);

// Protected routes (require authentication)
//router.use(authMiddleware);
router.post('/', wallpaperController.createProduct);
router.put('/:id', wallpaperController.updateProduct);
router.delete('/:id', wallpaperController.deleteProduct);

//push all
router.post("/pushall", wallpaperController.pushAll);

module.exports = router;