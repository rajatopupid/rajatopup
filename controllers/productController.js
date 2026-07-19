const { syncProducts } = require("../services/digiflazz");
const { read, write } = require("../services/database");

// ===============================
// SYNC PRODUK DIGIFLAZZ
// ===============================

async function sync(req, res) {

    try {

        const settings = await read("settings");

        const markup = Number(settings.markup || 1000);

        const response = await syncProducts();

console.log("Keys:", Object.keys(response));
console.log("Total:", response.data?.length);
console.log(response.data?.slice(0, 10));

        if (!response.data || !Array.isArray(response.data)) {

            return res.status(500).json({

                success: false,

                message: "Produk Digiflazz tidak ditemukan.",

                response

            });

        }

        const products = response.data.map(item => ({

            id: item.buyer_sku_code,

            kode: item.buyer_sku_code,

            nama: item.product_name,

            brand: item.brand,

            category: item.category,

            type: item.type,

            seller: item.seller_name,

            harga_modal: Number(item.price),

            harga_jual: Number(item.price) + markup,

            status: item.buyer_product_status,

            seller_status: item.seller_product_status,

            unlimited_stock: item.unlimited_stock,

            stock: item.stock,

            multi: item.multi,

            desc: item.desc || "",

            updated_at: new Date().toISOString()

        }));

        await write("products", products);

        return res.json({

            success: true,

            total: products.length,

            message: "Sinkron produk berhasil.",

            data: products

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ===============================
// LIST PRODUK
// ===============================

async function list(req, res) {

    const products = await read("products");

    res.json({

        success: true,

        total: products.length,

        data: products

    });

}

// ===============================
// DETAIL PRODUK
// ===============================

async function detail(req, res) {

    const products = await read("products");

    const product = products.find(

        p => p.kode === req.params.kode

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

}

module.exports = {

    sync,

    list,

    detail

};
