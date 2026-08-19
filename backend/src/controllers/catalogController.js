const catalogService = require('../services/catalogService');

async function getFarms(req, res, next) {
  try {
    const { regiao, busca, notaMinima } = req.query;
    const [farms, regioes] = await Promise.all([
      catalogService.listFarms({ regiao, busca, notaMinima }),
      catalogService.listRegions()
    ]);
    return res.json({ farms, regioesDisponiveis: regioes });
  } catch (err) {
    next(err);
  }
}

async function getFarmDetail(req, res, next) {
  try {
    const farm = await catalogService.getFarmById(req.params.id);
    if (!farm) {
      return res.status(404).json({ error: 'not_found', message: 'Fazenda não encontrada.' });
    }
    return res.json({ farm });
  } catch (err) {
    next(err);
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await catalogService.listProducts();
    return res.json({ products });
  } catch (err) {
    next(err);
  }
}

async function getProductDetail(req, res, next) {
  try {
    const product = await catalogService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'not_found', message: 'Produto não encontrado.' });
    }
    return res.json({ product });
  } catch (err) {
    next(err);
  }
}

async function getProductByBarcode(req, res, next) {
  try {
    const product = await catalogService.findProductByBarcode(req.params.codigo);
    if (!product) {
      return res.status(404).json({ error: 'not_found', message: 'Nenhum produto encontrado para esse código.' });
    }
    return res.json({ product });
  } catch (err) {
    next(err);
  }
}

async function postReview(req, res, next) {
  try {
    const review = await catalogService.createReview(req.user.id, req.params.id, req.body);
    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFarms,
  getFarmDetail,
  getProducts,
  getProductDetail,
  getProductByBarcode,
  postReview
};
