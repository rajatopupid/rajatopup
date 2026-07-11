require("dotenv").config();

const { checkStatus } = require("./services/apigames");
const {
    createTransaction,
    merchantInfo
} = require("./services/apigames");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs-extra");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// DATABASE
// =========================

const DB = path.join(__dirname, "database");

const USERS = path.join(DB, "users.json");
const ADMINS = path.join(DB, "admins.json");
const PRODUCTS = path.join(DB, "products.json");
const ORDERS = path.join(DB, "orders.json");
const TRANSACTIONS = path.join(DB, "transactions.json");
const SETTINGS = path.join(DB, "settings.json");
const GUEST = path.join(DB, "guest.json");


// =========================
// READ WRITE JSON
// =========================

async function read(file){

    await fs.ensureFile(file);

    try{

        return await fs.readJson(file);

    }catch{

        await fs.writeJson(file,[],{
            spaces:2
        });

        return [];

    }

}


async function write(file,data){

    await fs.writeJson(
        file,
        data,
        {
            spaces:2
        }
    );

}


// =========================
// MIDDLEWARE
// =========================

app.use(cors({

    origin:true,

    credentials:true

}));


app.use(helmet({

    contentSecurityPolicy:false

}));


app.use(morgan("dev"));


app.use(express.json());


app.use(express.urlencoded({

    extended:true

}));


app.use(session({

    secret:process.env.SESSION_SECRET,

    resave:false,

    saveUninitialized:false,

    cookie:{

        httpOnly:true,

        secure:false,

        sameSite:"lax",

        maxAge:
        1000*60*60*24*7

    }

}));


// =========================
// STATIC
// =========================

app.use(
    express.static(
        path.join(__dirname,"public")
    )
);


// =========================
// VIEW ENGINE
// =========================

app.set(
    "view engine",
    "ejs"
);

app.set(
    "views",
    path.join(__dirname,"views")
);

app.locals.process = process;

// =========================
// ADMIN MIDDLEWARE
// =========================

function isAdmin(req, res, next) {

    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }

    next();

}

// =========================
// ROUTES
// =========================

app.use("/", require("./routes/public"));

app.use("/api", require("./routes/api"));

app.use("/admin", require("./routes/admin"));


// =========================
// HOME
// =========================

app.get("/", async (req, res) => {

    const products = await read(PRODUCTS);

    let settings = {};

    try {

        settings = await fs.readJson(SETTINGS);

    } catch {

        settings = {
            website: process.env.WEBSITE_NAME
        };

    }

    res.render("home", {
        products,
        settings
    });

});


// =========================
// ADMIN LOGIN
// =========================

app.get("/admin/login", (req, res) => {

    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin/login");

});


// =========================
// ADMIN DASHBOARD
// =========================

app.get("/admin/dashboard", isAdmin, async (req, res) => {

    const products = await read(PRODUCTS);

    const orders = await read(ORDERS);

    const transactions = await read(TRANSACTIONS);

    res.render("admin/dashboard", {

        admin: req.session.admin,

        totalProduct: products.length,

        totalOrder: orders.length,

        totalTransaction: transactions.length

    });

});


// =========================
// ADMIN PRODUCTS
// =========================

app.get("/admin/products", isAdmin, async (req, res) => {

    const products = await read(PRODUCTS);

    res.render("admin/products", {
        admin: req.session.admin,
        products
    });

});



// =========================
// ADD PRODUCT
// =========================
app.get(
"/admin/product/add",
isAdmin,
(req,res)=>{

    res.render(
        "admin/add-product"
    );

});

app.post(
"/admin/product/add",
isAdmin,
async(req,res)=>{

    const products =
    await read(PRODUCTS);

    const product = {

        id: req.body.kode,

        game: req.body.game,

        nama: req.body.nama,

        kode: req.body.kode,

        harga_modal: Number(req.body.harga_modal),

        harga_jual: Number(req.body.harga_jual),

        status: req.body.status === "true",

        createdAt:
        new Date().toISOString()

    };

    products.push(product);

    await write(
        PRODUCTS,
        products
    );

    res.redirect(
        "/admin/products"
    );

});

// =========================
// EDIT PRODUCT
// =========================

app.get(
"/admin/product/edit/:id",
isAdmin,
async(req,res)=>{

    const products =
    await read(PRODUCTS);

    const product =
    products.find(
        p=>p.id===req.params.id
    );

    if(!product){

        return res.redirect(
            "/admin/products"
        );

    }

    res.render(
        "admin/edit-product",
        {
            product
        }
    );

});

app.post(
"/admin/product/edit/:id",
isAdmin,
async(req,res)=>{

    const products =
    await read(PRODUCTS);

    const index =
    products.findIndex(
        p=>p.id===req.params.id
    );

    if(index===-1){

        return res.redirect(
            "/admin/products"
        );

    }

    products[index] = {

        ...products[index],

        game:req.body.game,

        nama:req.body.nama,

        kode:req.body.kode,

        harga_modal:Number(req.body.harga_modal),

        harga_jual:Number(req.body.harga_jual),

        status:req.body.status==="true"

    };

    await write(
        PRODUCTS,
        products
    );

    res.redirect(
        "/admin/products"
    );

});

// =========================
// CREATE DEFAULT DATABASE
// =========================

async function ensureDatabase() {

    await fs.ensureDir(DB);

    const files = [
        USERS,
        ADMINS,
        PRODUCTS,
        ORDERS,
        TRANSACTIONS,
        SETTINGS,
        GUEST
    ];

    for (const file of files) {

        await fs.ensureFile(file);

        try {

            await fs.readJson(file);

        } catch {

            if (file === SETTINGS) {

                await fs.writeJson(file, {

                    website: process.env.WEBSITE_NAME,

                    description: process.env.WEBSITE_DESCRIPTION,

                    logo: process.env.WEBSITE_LOGO,

                    favicon: process.env.WEBSITE_FAVICON,

                    markup: Number(process.env.DEFAULT_MARKUP)

                }, {
                    spaces: 2
                });

            } else {

                await fs.writeJson(file, [], {
                    spaces: 2
                });

            }

        }

    }

}

// =========================
// ADMIN DELECT PRODUK
// =========================

app.get(
"/admin/product/delete/:id",
isAdmin,
async(req,res)=>{

    const products =
    await read(PRODUCTS);

    const result =
    products.filter(
        p=>p.id!==req.params.id
    );

    await write(
        PRODUCTS,
        result
    );

    res.redirect(
        "/admin/products"
    );

});

// =========================
// PRODUK KODE
// ======================
app.get(
"/product/:kode",
async(req,res)=>{

    const products =
    await read(PRODUCTS);

    const product =
    products.find(
        p=>p.kode===req.params.kode
    );

    if(!product){

        return res.redirect("/");

    }

    res.render(
        "product",
        {
            product
        }
    );

});

// =========================
// CREATE DEFAULT ADMIN
// =========================

async function createDefaultAdmin() {

    const admins = await read(ADMINS);

    if (admins.length > 0)
        return;

    const bcrypt = require("bcryptjs");

    const { nanoid } = require("nanoid");

    const password = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
    );

    admins.push({

        id: nanoid(),

        username: process.env.ADMIN_USERNAME,

        password,

        name: "Administrator",

        role: "superadmin",

        createdAt: new Date().toISOString()

    });

    await write(
        ADMINS,
        admins
    );

    console.log("✔ Default admin berhasil dibuat");

}


// =========================
// STATUS REF
// =========================

app.get("/status/:ref", async (req, res) => {

    const result = await checkStatus(req.params.ref);

    res.send(`
    <pre>${JSON.stringify(result, null, 2)}</pre>
    <br>
    <a href="/">Kembali</a>
    `);

});

// =========================
// 404
// =========================

app.use((req, res) => {

    res.status(404).send("404 - Halaman tidak ditemukan");

});


// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,

        message: err.message

    });

});

// =========================
// START SERVER
// =========================

async function start() {

    await ensureDatabase();

    await createDefaultAdmin();

console.log("=== TEST MERCHANT ===");

const info = await merchantInfo();

console.log(info);

console.log("=====================");

    app.listen(PORT, () => {

        console.log("");

        console.log("===================================");

        console.log(`🚀 ${process.env.APP_NAME}`);

        console.log(`🌐 http://localhost:${PORT}`);

        console.log("===================================");

        console.log("");

    });

}

start();
