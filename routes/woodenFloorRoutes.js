const express = require('express');
const router = express.Router();
const woodenFloorController = require('../controllers/woodenFloorController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/products', woodenFloorController.getProducts); // Changed to GET method
router.get('/getCategories', woodenFloorController.getCategories);
router.get('/product/:id', woodenFloorController.getProduct);

// Protected routes (require authentication)
//router.use(authMiddleware);
router.post('/', woodenFloorController.createProduct);
router.put('/:id', woodenFloorController.updateProduct);
router.delete('/:id', woodenFloorController.deleteProduct);

//push all
router.post("/pushall", woodenFloorController.pushAll);

module.exports = router;