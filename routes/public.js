const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { getWallet } = require("../services/wallet");

const router = express.Router();

const DB = path.join(__dirname, "../database");

const USERS = path.join(__dirname, "../database/users.json");
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
const { sendWA } = require("../services/fonnte");

async function write(file, data) {
    await fs.writeJson(file, data, { spaces: 2 });
}

// =========================
// HOME
// =========================

router.get("/", async (req, res) => {

let products = (await read(PRODUCTS))
.filter(p => p.status !== false);

products = products.filter(p =>
[
"Pulsa",
"Data",
"Games",
"Voucher",
"PLN"
].includes(p.category)
);

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
// WALLET KOIN
// =========================

router.get("/wallet", async (req, res) => {

console.log(req.session.user);

    const phone = (req.query.phone || "").replace(/\D/g, "");

    if (!phone) {
        return res.render("wallet", {
            wallet: null,
            history: []
        });
    }

const wallet = await getWallet(req.body.tujuan);

    res.render("wallet", {
        wallet,
        history: []
    });

});

// =========================
// DETAIL PRODUK
// =========================

router.get("/product/:id", async (req, res) => {

const products = (await read(PRODUCTS))
.filter(p => p.status !== false);

const product = products.find(
    p => p.id === req.params.id ||
         p.kode === req.params.id
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

const products = (await read(PRODUCTS))
.filter(p => p.status !== false);

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
// CATEGORY
// =========================

router.get("/category/:category", async (req, res) => {

const products = (await read(PRODUCTS))
.filter(p => p.status !== false);

    const category = req.params.category.toUpperCase();

    const brands = [...new Set(
        products
            .filter(p => (p.category || "").toUpperCase() === category)
            .map(p => p.brand)
    )];

    res.render("category", {
        category,
        brands
    });

});


// =========================
// CATEGORY BRAND
// =========================

router.get("/category/:category/:brand", async (req, res) => {

const products = (await read(PRODUCTS))
.filter(p => p.status !== false);

    const data = products.filter(p =>

        (p.category || "").toUpperCase() === req.params.category.toUpperCase()

        &&

        (p.brand || "").toUpperCase() === req.params.brand.toUpperCase()

    );

// =========================
// SORT PRODUK GAME
// =========================

if (req.params.category.toUpperCase() === "GAMES") {

    data.sort((a,b)=>{

        const da = parseInt(a.nama.match(/\d+/)?.[0] || "999999");
        const db = parseInt(b.nama.match(/\d+/)?.[0] || "999999");

        return da - db;

    });

}


res.render("kategori", {
    game: req.params.brand,
    products: data
});

});

// =========================
// ABOUT
// =========================

router.get("/about", (req, res) => {

    res.render("about");

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

    res.render("faq");

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

console.log("WA:", req.body.whatsapp);

    const products = await read(PRODUCTS);
    const orders = await read(ORDERS);
    const transactions = await read(TRANSACTIONS);

console.log("Kode:", req.body.kode);
console.log("Body:", req.body);

    const product = products.find(
        p => p.kode === req.body.kode
    );

    if (!product) {
        return res.send("Produk tidak ditemukan");
    }

let hargaProduk = product.harga_jual;
let biayaAdmin = 0;

switch (req.body.payment) {

    case "QRIS":
        biayaAdmin = Math.ceil(hargaProduk * 0.007); // 0,7%
        break;

    case "DANA":
    case "SeaBank":
    case "TOKEN":
        biayaAdmin = 0;
        break;

}

const totalBayar = hargaProduk + biayaAdmin;

const ref_id = "RTU" + Date.now();

const isToken = product.isToken === true;

const users = await read(USERS);

if (isToken) {

    const tujuanUser = users.find(
        u => u.userId === req.body.tujuan
    );

    if (!tujuanUser) {
        return res.send("❌ ID RajaTopUp tidak ditemukan.");
    }

}

const order = {

    id: nanoid(),

    ref_id,

    payment: req.body.payment,

    produk: product.kode,

    nama_produk: product.nama,

    isToken,

    game: product.game || product.brand || "Free Fire",

    tujuan: req.body.tujuan,

    server_id: req.body.server_id || "",

    email: req.body.email || "",

    whatsapp: req.body.whatsapp || "",

    harga_produk: hargaProduk,

    biaya_admin: biayaAdmin,

    harga: totalBayar,

    status: "PENDING",

    createdAt: new Date().toISOString()

};

let wa = (order.whatsapp || "").replace(/\D/g, "");

if (wa.startsWith("08")) {
    wa = "62" + wa.slice(1);
} else if (!wa.startsWith("62")) {
    wa = "";
}

if (wa.length < 10) {
    return res.send("Nomor WhatsApp tidak valid.");
}

order.whatsapp = wa;

    orders.push(order);

if (req.body.payment === "TOKEN") {

    const wallet = await getWallet(
        (req.body.whatsapp || "").replace(/\D/g, "")
    );

    if (wallet.saldo < totalBayar) {

        return res.send(`
        <script>
        alert("Saldo Token RajaTopUp tidak mencukupi.");
        history.back();
        </script>
        `);

    }

}

    await write(ORDERS, orders);

await sendWA(
    process.env.ADMIN_ACC_WA,
`🛒 ORDER BARU MASUK

━━━━━━━━━━━━━━
📄 Invoice : ${order.ref_id}
🎮 Game : ${order.game}
📦 Produk : ${order.nama_produk}
🆔 User ID : ${order.tujuan}
📱 WhatsApp : ${order.whatsapp}

💳 Metode : ${order.payment}
💰 Total : Rp ${Number(order.harga).toLocaleString("id-ID")}
━━━━━━━━━━━━━━

⏳ Status : MENUNGGU PEMBAYARAN

Customer akan mengirim bukti pembayaran melalui WhatsApp setelah transfer.

━━━━━━━━━━━━━━
🛠 Perintah Admin

✅ ACC ${order.ref_id}
❌ TOLAK ${order.ref_id}`
);

// =========================
// NOTIF WHATSAPP CUSTOMER
// =========================

let paymentInfo = "";

if (order.payment === "DANA") {
  paymentInfo = `
💙 *Pembayaran DANA*
Nomor : 083172927610
Atas Nama : Rahmad Rizki`;
} else if (order.payment === "QRIS") {
  paymentInfo = `
📷 *Pembayaran QRIS*
Silakan scan QRIS berikut:
https://rajatopup-production-d6e4.up.railway.app/images/payment/qris.jpg`;
} else if (order.payment === "SeaBank") {
  paymentInfo = `
🏦 *Pembayaran SeaBank*
No. Rekening : 901719133159
Atas Nama : NURAINI`;
}

await sendWA(
  order.whatsapp,
`👋 Halo Kak,

Pesanan *RajaTopUp* berhasil dibuat ✅

━━━━━━━━━━━━━━
📄 Invoice : ${order.ref_id}
🎮 Game : ${order.game}
📦 Produk : ${order.nama_produk}
🆔 User ID : ${order.tujuan}
${order.server_id ? `🌐 Zone ID : ${order.server_id}` : ""}
💰 Harga Produk : Rp ${Number(order.harga_produk).toLocaleString("id-ID")}
${order.biaya_admin > 0 ? `💳 Biaya Admin : Rp ${Number(order.biaya_admin).toLocaleString("id-ID")}` : ""}
━━━━━━━━━━━━━━
💵 Total Bayar : Rp ${Number(order.harga).toLocaleString("id-ID")}
━━━━━━━━━━━━━━

💳 Metode Pembayaran
${paymentInfo}

⏳ Segera lakukan pembayaran agar pesanan dapat diproses.

📌 Setelah berhasil melakukan pembayaran,

📷 Kirim bukti transfer (screenshot) ke WhatsApp Admin agar pesanan segera diproses.

📞 Admin:
https://wa.me/6283153030363

Terima kasih telah mempercayai RajaTopUp ❤️
https://rajatopup-production-d6e4.up.railway.app

👑 RajaTopUp
⚡ Fast • Secure • Trusted`
);

return res.render("success", {
  order
});

});

module.exports = router;

