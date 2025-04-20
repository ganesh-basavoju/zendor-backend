const WoodenFloor = require('../models/woodenFloorModel');

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
    try {
        const { 
            subCategory, 
            shade, 
            finish, 
            minPrice, 
            maxPrice,
            sort = '-createdAt',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { isActive: true };
        if (subCategory) query.subCategory = subCategory;
        if (shade) query.shade = shade;
        if (finish) query.finish = finish;
        if (minPrice || maxPrice) {
            query['price.dp'] = {};
            if (minPrice) query['price.dp'].$gte = Number(minPrice);
            if (maxPrice) query['price.dp'].$lte = Number(maxPrice);
        }

        // Execute query with pagination
        const products = await WoodenFloor
            .find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('-__v');

        // Get total count for pagination
        const total = await WoodenFloor.countDocuments(query);

        res.status(200).json({
            status: 'success',
            results: products.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: products
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
    try {
        const product = await WoodenFloor.findById(req.params.id).select('-__v');
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const newProduct = await WoodenFloor.create(req.body);
        res.status(201).json({
            status: 'success',
            data: newProduct
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await WoodenFloor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await WoodenFloor.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};