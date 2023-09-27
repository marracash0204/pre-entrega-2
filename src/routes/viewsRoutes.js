import { Router } from "express";
import { productsManager } from "../dao/dataBase/productsManager.js";
import { messageManager } from "../dao/dataBase/messageManager.js";
import { cartManager } from "../dao/dataBase/cartsManager.js";

const cartsManager = new cartManager();

const messagesManager = new messageManager();

const productManager = new productsManager();

const router = Router();

router.get("/", async (req, res) => {
  const products = await productManager.getAllproduct();
  res.render("home", { products });
});

router.get("/realtimeproducts", async (req, res) => {
  const products = await productManager.getAllproduct();
  res.render("realTimeProducts", { products });
});

router.get("/chat", async (req, res) => {
  const messages = await messagesManager.getAllMessage();
  res.render("chat", { messages });
});

router.get("/products", async (req, res) => {
  try {
    if (!req.session.cartId) {
      const newCart = await cartsManager.createCart();
      req.session.cartId = newCart._id;
    }

    const page = req.query.page || 1;
    const limit = 6;

    const productsResult = await productManager.getPaginatedProducts(
      page,
      limit
    );
    const products = productsResult.docs;
    const totalPages = productsResult.totalPages;

    res.render("products", { products, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error al obtener productos paginados:", error);
    res.status(500).send("Error al obtener productos");
  }
});

router.post("/add-to-cart/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const cartId = req.session.cartId;

    console.log(productId);
    await cartsManager.addProductToCart(cartId, productId);

    res.redirect("/products");
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    res.status(500).send("Error al agregar producto al carrito");
  }
});

router.get("/cart/:cartId", async (req, res) => {
  const cartId = req.params.cartId;

  const cart = await cartsManager.getCartById(cartId);

  res.render("cart", { cart });
});

export default router;
