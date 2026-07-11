const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({

    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",

    serverKey: process.env.MIDTRANS_SERVER_KEY,

    clientKey: process.env.MIDTRANS_CLIENT_KEY

});

async function createPayment(order){

    const parameter = {

        transaction_details:{

            order_id: order.ref_id,

            gross_amount: order.harga

        },

        customer_details:{

            first_name: order.whatsapp || "Customer",

            email: order.email || "customer@rajatopup.id",

            phone: order.whatsapp || ""

        }

    };

    return await snap.createTransaction(parameter);

}

module.exports={

    createPayment

};
