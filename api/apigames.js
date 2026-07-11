const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = process.env.API_URL;
const MERCHANT = process.env.API_MERCHANT;
const SECRET = process.env.API_SECRET;

const PRODUCTS = path.join(__dirname, "../database/products.json");
const PRICES = path.join(__dirname, "../database/prices.json");

function signature() {
    return crypto
        .createHash("md5")
        .update(`${MERCHANT}:${SECRET}`)
        .digest("hex");
}

async function syncProducts() {

    const result = await axios.get(`${BASE_URL}/v2/price-list`, {
        params: {
            merchant_id: MERCHANT,
            signature: signature()
        }
    });

    const data = result.data.data || [];

    await fs.writeJson(PRODUCTS, data, {
        spaces: 2
    });

    const prices = data.map(item => ({
        kode: item.kode,
        nama: item.nama,
        modal: Number(item.harga),
        markup: 0,
        jual: Number(item.harga)
    }));

    await fs.writeJson(PRICES, prices, {
        spaces: 2
    });

    return data.length;
}

module.exports = {
    syncProducts
};
