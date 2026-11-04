const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.post('/banners', categoryController.createBanner);
router.put('/banners/:id', categoryController.updateBanner);
router.delete('/banners/:id', categoryController.deleteBanner);

router.post('/services', categoryController.createService);
router.put('/services/:id', categoryController.updateService);
router.delete('/services/:id', categoryController.deleteService);

router.get('/categories', categoryController.getCategories);
router.post('/subcategories', categoryController.createSubcategory);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/subcategories', categoryController.getSubcategories);
router.get('/categories/:category/subcategories', categoryController.getCategorySubcategories);
router.get('/banners', categoryController.getBanners);

module.exports = router;
