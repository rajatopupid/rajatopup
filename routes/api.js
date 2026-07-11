const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { nanoid } = require("nanoid");

const {
    createTransaction,
    checkStatus
} = require("../services/apigames");

const router = express.Router();

const DB = path.join(__dirname, "../database");

const PRODUCTS = path.join(DB, "products.json");
const ORDERS = path.join(DB, "orders.json");
const TRANSACTIONS = path.join(DB, "transactions.json");

async function read(file) {

    return await fs.readJson(file);

}

async function write(file, data) {

    await fs.writeJson(file, data, {
        spaces: 2
    });

}



// ============================
// LIST PRODUK
// ============================

router.get("/products", async (req, res) => {

    try {

        const products = await read(PRODUCTS);

        res.json({

            success: true,

            data: products.filter(
                p => p.status === true
            )

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



// ============================
// DETAIL PRODUK
// ============================

router.get("/products/:id", async (req, res) => {

    try {

        const products = await read(PRODUCTS);

        const product = products.find(

            p => p.id === req.params.id

        );

        if (!product) {

            return res.status(404).json({

                success: false,

                message: "Produk tidak ditemukan."

            });

        }

        res.json({

            success: true,

            data: product

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



// ============================
// BUAT ORDER
// ============================

router.post("/order", async (req, res) => {

    try {

        const {

            productId,

            tujuan,

            server_id,

            nickname,

            email,

            whatsapp

        } = req.body;

        const products = await read(PRODUCTS);

        const product = products.find(

            p => p.id === productId

        );

        if (!product) {

            return res.json({

                success: false,

                message: "Produk tidak ditemukan."

            });

        }

        const orders = await read(ORDERS);

        const transaksi = await read(TRANSACTIONS);

        const ref_id =
            process.env.ORDER_PREFIX +
            Date.now();

        const order = {

            id: nanoid(),

            ref_id,

            productId: product.id,

            produk: product.nama,

            kode: product.kode,

            game: product.game,

            tujuan,

            server_id,

            nickname,

            email,

            whatsapp,

            harga: product.harga_jual,

            status: "pending",

            createdAt: new Date().toISOString()

        };

        orders.push(order);

        await write(ORDERS, orders);

        const apiResult = await createTransaction({

            ref_id,

            produk: product.kode,

            tujuan,

            server_id

        });

        transaksi.push({

            id: nanoid(),

            ref_id,

            order_id: order.id,

            provider: "APIGames",

            provider_response: apiResult,

            status: apiResult.success
                ? "diproses"
                : "gagal",

            createdAt: new Date().toISOString()

        });

        await write(
            TRANSACTIONS,
            transaksi
        );

        res.json({

            success: apiResult.success,

            message: apiResult.message ||

                "Order berhasil dibuat.",

            data: {

                order,

                transaction: apiResult

            }

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



// ============================
// CEK STATUS
// ============================

router.get("/status/:ref_id", async (req, res) => {

    try {

        const result = await checkStatus(

            req.params.ref_id

        );

        res.json(result);

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



// ============================
// RIWAYAT TRANSAKSI
// ============================

router.get("/transactions", async (req, res) => {

    try {

        const transaksi = await read(
            TRANSACTIONS
        );

        transaksi.sort((a, b) =>

            new Date(b.createdAt) -
            new Date(a.createdAt)

        );

        res.json({

            success: true,

            total: transaksi.length,

            data: transaksi

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



// ============================
// DETAIL TRANSAKSI
// ============================

router.get("/transactions/:ref_id", async (req, res) => {

    try {

        const transaksi = await read(
            TRANSACTIONS
        );

        const data = transaksi.find(

            t => t.ref_id === req.params.ref_id

        );

        if (!data) {

            return res.status(404).json({

                success: false,

                message: "Transaksi tidak ditemukan."

            });

        }

        res.json({

            success: true,

            data

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



module.exports = router;
