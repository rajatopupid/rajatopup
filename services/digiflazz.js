const axios = require("axios");
const md5 = require("md5");

const config = require("../config/digiflazz");

// ===============================
// SIGNATURE
// ===============================

const priceListSign = () =>
    md5(config.username + config.apiKey + "pricelist");

const depositSign = () =>
    md5(config.username + config.apiKey + "depo");

const transactionSign = (refId) =>
    md5(config.username + config.apiKey + refId);

// ===============================
// AXIOS
// ===============================

const api = axios.create({

    baseURL: config.baseURL,

    headers: {

        "Content-Type": "application/json"

    },

    timeout: 30000

});

// ===============================
// CEK SALDO
// ===============================

async function checkBalance() {

    const { data } = await api.post("/cek-saldo", {

        cmd: "deposit",

        username: config.username,

        sign: depositSign()

    });

    return data;

}

// ===============================
// PRICE LIST PREPAID
// ===============================

async function prepaidPriceList() {

    const { data } = await api.post("/price-list", {

        cmd: "prepaid",

        username: config.username,

        sign: priceListSign()

    });

    return data;

}

// ===============================
// PRICE LIST PASCA
// ===============================

async function pascabayarPriceList() {

    const { data } = await api.post("/price-list", {

        cmd: "pasca",

        username: config.username,

        sign: priceListSign()

    });

    return data;

}

// ===============================
// SYNC PRODUK
// ===============================

async function syncProducts() {

    return await prepaidPriceList();

}

// ===============================
// TRANSAKSI
// ===============================

async function createTransaction({

    refId,

    buyerSkuCode,

    customerNo

}) {

    const { data } = await api.post("/transaction", {

        username: config.username,

        buyer_sku_code: buyerSkuCode,

        customer_no: customerNo,

        ref_id: refId,

        sign: transactionSign(refId)

    });

    return data;

}

// ===============================
// CEK STATUS
// ===============================

async function checkStatus(refId) {

    const { data } = await api.post("/transaction", {

        cmd: "status",

        username: config.username,

        ref_id: refId,

        sign: transactionSign(refId)

    });

    return data;

}

module.exports = {

    checkBalance,

    prepaidPriceList,

    pascabayarPriceList,

    syncProducts,

    createTransaction,

    checkStatus

};
