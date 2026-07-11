const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs-extra");
const path = require("path");
const { nanoid } = require("nanoid");

const router = express.Router();

const DB = path.join(__dirname, "../database");

const ADMINS = path.join(DB, "admins.json");
const PRODUCTS = path.join(DB, "products.json");
const SETTINGS = path.join(DB, "settings.json");

async function read(file) {
    return await fs.readJson(file);
}

async function write(file, data) {
    await fs.writeJson(file, data, {
        spaces: 2
    });
}


// ==========================
// LOGIN ADMIN
// ==========================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({
                success: false,
                message: "Username dan password wajib diisi."
            });
        }

        const admins = await read(ADMINS);

        const admin = admins.find(
            a => a.username === username
        );

        if (!admin) {
            return res.json({
                success: false,
                message: "Username tidak ditemukan."
            });
        }

        const valid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!valid) {
            return res.json({
                success: false,
                message: "Password salah."
            });
        }

        req.session.admin = {

            id: admin.id,

            username: admin.username,

            name: admin.name,

            role: admin.role

        };

        res.json({

            success: true,

            message: "Login berhasil.",

            admin: req.session.admin

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});


// ==========================
// LOGOUT
// ==========================

router.post("/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({

            success: true,

            message: "Logout berhasil."

        });

    });

});


// ==========================
// PROFILE ADMIN
// ==========================

router.get("/me", (req, res) => {

    if (!req.session.admin) {

        return res.status(401).json({

            success: false,

            message: "Belum login."

        });

    }

    res.json({

        success: true,

        admin: req.session.admin

    });

});


// ==========================
// TAMBAH PRODUK
// ==========================

router.post("/product/add", async (req, res) => {

    try {

        const products = await read(PRODUCTS);

        products.push({

            id: nanoid(),

            game: req.body.game,

            nama: req.body.nama,

            kode: req.body.kode.toUpperCase(),

            harga_modal: Number(req.body.harga_modal),

            harga_jual: Number(req.body.harga_jual),

            status: true,

            createdAt: new Date().toISOString()

        });

        await write(PRODUCTS, products);

        res.redirect("/admin/products");

    } catch (err) {

        res.send(err.message);

    }

});


// ==========================
// UPDATE PRODUK
// ==========================

router.post("/product/edit/:id", async (req, res) => {

    const products = await read(PRODUCTS);

    const index = products.findIndex(

        p => p.id === req.params.id

    );

    if (index < 0) {

        return res.redirect("/admin/products");

    }

    products[index].game = req.body.game;

    products[index].nama = req.body.nama;

    products[index].kode = req.body.kode.toUpperCase();

    products[index].harga_modal = Number(req.body.harga_modal);

    products[index].harga_jual = Number(req.body.harga_jual);

    products[index].status = req.body.status === "true";

    await write(PRODUCTS, products);

    res.redirect("/admin/products");

});


// ==========================
// HAPUS PRODUK
// ==========================

router.get("/product/delete/:id", async (req, res) => {

    let products = await read(PRODUCTS);

    products = products.filter(

        p => p.id !== req.params.id

    );

    await write(PRODUCTS, products);

    res.redirect("/admin/products");

});


// ==========================
// UPDATE WEBSITE
// ==========================

router.post("/settings", async (req, res) => {

    await write(SETTINGS, {

        website: req.body.website,

        description: req.body.description,

        logo: req.body.logo,

        favicon: req.body.favicon,

        markup: Number(req.body.markup)

    });

    res.redirect("/admin/dashboard");

});

module.exports = router;
