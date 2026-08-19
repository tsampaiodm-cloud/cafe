const express = require('express');
const catalogController = require('../controllers/catalogController');
const { validateBody, validateQuery } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { farmsQuerySchema, reviewSchema } = require('../utils/validators');

const router = express.Router();

// Todo o catálogo é público — não exige login pra navegar na loja
// ou conhecer as fazendas, só pra avaliar um produto.
router.get('/farms', validateQuery(farmsQuerySchema), catalogController.getFarms);
router.get('/farms/:id', catalogController.getFarmDetail);

router.get('/products', catalogController.getProducts);
router.get('/products/by-barcode/:codigo', catalogController.getProductByBarcode);
router.get('/products/:id', catalogController.getProductDetail);

router.post('/products/:id/reviews', requireAuth, validateBody(reviewSchema), catalogController.postReview);

module.exports = router;
