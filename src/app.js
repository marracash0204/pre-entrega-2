import express from "express";
import handlebars from "express-handlebars";
import handlebarsHelpers from "handlebars-helpers";
import productsRouter from "./routes/productsRoutes.js";
import cartRouter from "./routes/cartsRoutes.js";
import viewsrouter from "./routes/viewsRoutes.js";
import { Server } from "socket.io";
import session from "express-session";
import { messageManager } from "./dao/dataBase/messageManager.js";
import mongoose from "mongoose";
import { productsManager } from "./dao/dataBase/productsManager.js";

mongoose.connect(
  "mongodb+srv://marracash0204:ecommerce1@cluster0.9zzteuy.mongodb.net/?retryWrites=true&w=majority"
);

const productManager = new productsManager();
const messagesManager = new messageManager();

const app = express();
const httpServer = app.listen(3001, () => console.log("puerto 3001"));
const socketServer = new Server(httpServer);

app.use(
  session({
    secret: "usuario.Activo",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hbs = handlebars.create({
  helpers: {
    ...handlebarsHelpers(),
  },
});

app.engine("handlebars", hbs.engine);
app.set("views", "./src/views");
app.set("view engine", "handlebars");
app.use(express.static("./src/public"));

app.use("/api/products", productsRouter, (req, res) => res.send());
app.use("/api/carts", cartRouter, (req, res) => res.send());
app.use("/", viewsrouter, (req, res) => res.send());

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Error interno del servidor");
});

socketServer.on("connection", async (socket) => {
  console.log("connection");

  const messages = await messagesManager.getAllMessage();
  const filteredMessages = messages.filter(
    (message) => message.message.trim() !== ""
  );
  socket.emit("historicalMessages", filteredMessages);

  socket.on("newMessage", async ({ user, message }) => {
    try {
      const newMessage = await messagesManager.newMessage(user, message);
      socketServer.emit("messageReceived", newMessage);
    } catch (error) {
      console.error("Error al crear un mensaje:", error);
    }
  });

  socket.on(
    "addProduct",
    async ({ title, price, description, code, stock }) => {
      await productManager.addProduct(title, description, price, code, stock);
      let products = await productManager.getAllproduct();
      socketServer.emit("productosActualizados", products);
    }
  );

  socket.on("productDeleted", async (id) => {
    await productManager.deleteProduct(id);
    let products = await productManager.getAllproduct();
    socketServer.emit("productosActualizados", products);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
});
