const express = require('express');
const router = express.Router();
const woodenFloorController = require('../controllers/woodenFloorController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', woodenFloorController.getProducts);
router.get('/:id', woodenFloorController.getProduct);

// Protected routes (require authentication)
router.use(authMiddleware);
router.post('/', woodenFloorController.createProduct);
router.put('/:id', woodenFloorController.updateProduct);
router.delete('/:id', woodenFloorController.deleteProduct);

module.exports = router;