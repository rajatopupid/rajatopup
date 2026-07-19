const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const router = express.Router();

const DB = path.join(__dirname, "../database");

const PRODUCTS = path.join(DB, "products.json");
const SETTINGS = path.join(DB, "settings.json");

async function read(file) {

    try {

        return await fs.readJson(file);

    } catch {

        return [];

    }

}

const ORDERS = path.join(DB, "orders.json");
const TRANSACTIONS = path.join(DB, "transactions.json");

const { nanoid } = require("nanoid");
const { createTransaction } = require("../services/apigames");
const { createPayment } = require("../services/midtrans");

async function write(file, data) {
    await fs.writeJson(file, data, { spaces: 2 });
}

// =========================
// HOME
// =========================

router.get("/", async (req, res) => {

    const products = await read(PRODUCTS);

    let settings = {};

    try {

        settings = await read(SETTINGS);

    } catch {

        settings = {};

    }

    res.render("home", {

        products,

        settings,

        admin: req.session.admin || null

    });

});

// =========================
// DETAIL PRODUK
// =========================

router.get("/product/:id", async (req, res) => {

    const products = await read(PRODUCTS);

    const product = products.find(

        p => p.id === req.params.id

    );

    if (!product) {

        return res.redirect("/");

    }

    res.render("product", {

        product,

        admin: req.session.admin || null

    });

});

// =========================
// SEARCH
// =========================

router.get("/search", async (req, res) => {

    const keyword = String(
        req.query.q || ""
    ).toLowerCase();

    const products = await read(PRODUCTS);

    const result = products.filter(p =>

        (p.nama || "").toLowerCase().includes(keyword) ||

        (p.game || "").toLowerCase().includes(keyword)

    );

    res.json({

        success: true,

        total: result.length,

        data: result

    });

});

// =========================
// ABOUT
// =========================

router.get("/about", (req, res) => {

    res.send("RajaTopUp V1");

});

// =========================
// CONTACT
// =========================

router.get("/contact", (req, res) => {

    res.send("Hubungi Admin RajaTopUp");

});

// =========================
// FAQ
// =========================

router.get("/faq", (req, res) => {

    res.send("FAQ RajaTopUp");

});

router.get("/privacy", (req, res) => {
    res.render("privacy");
});

router.get("/terms", (req, res) => {
    res.render("terms");
});

router.get("/contact", (req, res) => {
    res.render("contact");
});

router.get("/about", (req, res) => {
    res.render("about");
});

// =========================
// CHECKOUT
// =========================

router.post("/checkout", async (req, res) => {

    const products = await read(PRODUCTS);
    const orders = await read(ORDERS);
    const transactions = await read(TRANSACTIONS);

    const product = products.find(
        p => p.kode === req.body.kode
    );

    if (!product) {
        return res.send("Produk tidak ditemukan");
    }

    const ref_id = "RTU" + Date.now();

    const order = {

        id: nanoid(),

        ref_id,

        payment: req.body.payment,

        produk: product.kode,

        nama_produk: product.nama,

        game: product.game,

        tujuan: req.body.tujuan,

        server_id: req.body.server_id || "",

        email: req.body.email || "",

        whatsapp: req.body.whatsapp || "",

        harga: product.harga_jual,

        status: "PENDING",

        createdAt: new Date().toISOString()

    };

    orders.push(order);

    await write(ORDERS, orders);

    try {

const payment = await createPayment(order);

res.render("payment",{

    order,

    payment

});

   return;

    } catch (err) {

        res.send(err.message);

    }

});

module.exports = router;
