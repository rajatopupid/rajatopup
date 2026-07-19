const { nanoid } = require("nanoid");
const { createTransaction } = require("../services/digiflazz");
const { read, write } = require("../services/database");

// ===============================
// BUAT TRANSAKSI
// ===============================

async function create(req, res) {

    try {

        const {

            buyerSkuCode,

            customerNo

        } = req.body;

        if (!buyerSkuCode || !customerNo) {

            return res.status(400).json({

                success: false,

                message: "Data tidak lengkap."

            });

        }

        const products = await read("products");

        const product = products.find(

            p => p.kode === buyerSkuCode

        );

        if (!product) {

            return res.status(404).json({

                success: false,

                message: "Produk tidak ditemukan."

            });

        }

        const refId = "RT" + Date.now();

        const result = await createTransaction({

            refId,

            buyerSkuCode,

            customerNo

        });

        const orders = await read("orders");

        orders.push({

            id: nanoid(),

            refId,

            buyerSkuCode,

            customerNo,

            product: product.nama,

            harga: product.harga_jual,

            provider: "Digiflazz",

            response: result,

            createdAt: new Date().toISOString()

        });

        await write("orders", orders);

        res.json({

            success: true,

            data: result

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ===============================
// RIWAYAT ORDER
// ===============================

async function history(req, res) {

    try {

        const orders = await read("orders");

        res.json({

            success: true,

            total: orders.length,

            data: orders

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

module.exports = {

    create,

    history

};
