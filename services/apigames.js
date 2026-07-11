const axios = require("axios");
const crypto = require("crypto");

const API_URL = process.env.API_URL;
const MERCHANT = process.env.API_MERCHANT;
const SECRET = process.env.API_SECRET;

function md5(text) {
    return crypto
        .createHash("md5")
        .update(text)
        .digest("hex");
}

// ==========================
// INFO MERCHANT
// ==========================

async function merchantInfo() {

    try {

        const signature = md5(`${MERCHANT}${SECRET}`);

        console.log("MERCHANT =", MERCHANT);
        console.log("SECRET LENGTH =", SECRET.length);

        const localSignature = md5(`${MERCHANT}${SECRET}`);

        console.log("LOCAL SIGNATURE =", localSignature);

        const response = await axios.get(
            `${API_URL}/merchant/${MERCHANT}`,
            {
                params: {
                    signature
                }
            }
        );

        return response.data;

    } catch (err) {

        return {
            success: false,
            message: err.response?.data?.message || err.message
        };

    }

}

// ==========================
// CREATE TRANSACTION
// ==========================

async function createTransaction(data) {

    try {

        const signature = md5(

            `${MERCHANT}:${SECRET}:${data.ref_id}`

        );

console.log("===== REQUEST APIGAMES =====");
console.log("MERCHANT =", MERCHANT);
console.log("REF_ID =", data.ref_id);
console.log("SIGNATURE =", signature);
console.log("============================");

        const response = await axios.get(

            `${API_URL}/v2/transaksi`,

            {

                params: {

                    ref_id: data.ref_id,

                    merchant_id: MERCHANT,

                    produk: data.produk,

                    tujuan: data.tujuan,

                    server_id: data.server_id || "",

                    signature

                }

            }

        );

console.log("========== API TRANSACTION ==========");
console.log(JSON.stringify(response.data, null, 2));
console.log("====================================");

        return response.data;

    } catch (err) {

        return {

            success: false,

            message:
                err.response?.data?.message ||
                err.message

        };

    }

}

// ==========================
// CEK STATUS
// ==========================

async function checkStatus(ref_id) {

    try {

        const response = await axios.get(

            `${API_URL}/v2/transaksi/status-get-text`,

            {

                params: {

                    merchant_id: MERCHANT,

                    ref_id

                }

            }

        );

        return response.data;

    } catch (err) {

        return {

            success: false,

            message:
                err.response?.data?.message ||
                err.message

        };

    }

}

module.exports = {

    merchantInfo,

    createTransaction,

    checkStatus

};
