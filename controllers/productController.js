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

return res.json(response);

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

// Ambil hanya produk aktif
const aktif = response.data.filter(item =>
    item.buyer_product_status &&
    item.seller_product_status
);

// Pilih harga termurah untuk setiap buyer_sku_code
const cheapest = {};

for (const item of aktif) {
     const key = item.product_name.toLowerCase();

    if (
        !cheapest[key] ||
        Number(item.price) < Number(cheapest[key].price)
    ) {
        cheapest[key] = item;
    }
}

const products = Object.values(cheapest).map(item => ({
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

return res.redirect("/admin?sync=success");

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ===============================
// TAMBAH PRODUK BARU
// ===============================

async function addNewProducts(req, res) {

console.log("=== MASUK addNewProducts ===");

    try {

        const settings = await read("settings");

        const markup = Number(settings.markup || 1000);

const response = await syncProducts();

const data = response.data || [];

const aktif = data.filter(item =>
    item.buyer_product_status &&
    item.seller_product_status
);

const cheapest = {};

for (const item of aktif) {

    const key = item.product_name.toLowerCase();

    if (
        !cheapest[key] ||
        Number(item.price) < Number(cheapest[key].price)
    ) {
        cheapest[key] = item;
    }
}

const productsData = Object.values(cheapest);

        let products = await read("products");

        let tambah = 0;

for (const item of productsData) {

            if (
                !item.buyer_product_status ||
                !item.seller_product_status
            ) continue;

const sudahAda = products.find(
    p => p.kode === item.buyer_sku_code
);

if (sudahAda) {

    if (Number(item.price) < Number(sudahAda.harga_modal)) {

        sudahAda.harga_modal = Number(item.price);
        sudahAda.harga_jual = Number(item.price) + markup;
        sudahAda.seller = item.seller_name;

    }

    continue;
}

            products.push({

                id: item.buyer_sku_code,

                kode: item.buyer_sku_code,

                nama: item.product_name,

                brand: item.brand,

                category: item.category,

                type: item.type,

                seller: item.seller_name,

                harga_modal: Number(item.price),

                harga_jual: Number(item.price) + markup,

                status: true,

                seller_status: true,

                unlimited_stock: item.unlimited_stock,

                stock: item.stock,

                multi: item.multi,

                desc: item.desc || "",

                updated_at: new Date().toISOString()

            });

            tambah++;

        }

        await write("products", products);

        return res.redirect(
            "/admin/products?new=" + tambah
        );

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ===============================
// UPDATE HARGA MODAL
// ===============================

async function updatePrice(req, res){

    try{

        const response = await syncProducts();

        if(!response.data || !Array.isArray(response.data)){

            return res.status(500).json({
                success:false,
                message:"Produk Digiflazz tidak ditemukan."
            });

        }

        let products = await read("products");

        let update = 0;

        for(const item of response.data){

            const index = products.findIndex(
                p => p.kode === item.buyer_sku_code
            );

            if(index === -1) continue;

            products[index].harga_modal = Number(item.price);

            products[index].updated_at = new Date().toISOString();

            update++;

        }

        await write("products", products);

        return res.redirect(
            "/admin/products?update="+update
        );

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

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

    addNewProducts,

    updatePrice,

    list,

    detail

};
