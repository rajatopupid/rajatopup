const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const router = express.Router();

const DB = path.join(__dirname, "../database");
const ORDERS = path.join(DB, "orders.json");
const PAYMENTS = path.join(DB, "payments.json");

const { sendWA } = require("../services/fonnte");


async function read(file){
    try{
        return await fs.readJson(file);
    }catch{
        return [];
    }
}


async function write(file,data){
    await fs.writeJson(file,data,{spaces:2});
}


// =========================
// WEBHOOK FONNTE
// =========================

router.post("/fonnte", async(req,res)=>{

    try{

        const message = String(
            req.body.message || ""
        ).trim();

        const sender = req.body.sender;

        const orders = await read(ORDERS);

        // cari order terakhir milik nomor WA
        const order = orders
        .filter(o=>o.whatsapp == sender)
        .sort((a,b)=>
            new Date(b.createdAt)
            -
            new Date(a.createdAt)
        )[0];


        if(!order){
            return res.json({
                success:false,
                message:"Order tidak ditemukan"
            });
        }



        // =====================
        // PILIH DANA
        // =====================

        if(message === "1"){

            const payments = await read(PAYMENTS);

            const dana = payments.dana;


            await sendWA(
                sender,
`💙 *Pembayaran DANA*

Invoice : ${order.ref_id}

Game : ${order.game}

Produk : ${order.nama_produk}

Total Pembayaran :
Rp${order.harga}

Nomor : ${dana.nomor}
Nama : ${dana.nama}

Silakan transfer sesuai total pembayaran.

Setelah transfer kirim bukti pembayaran ya Kak 😊`
            );


            order.payment="DANA";
        }



        // =====================
        // PILIH QRIS
        // =====================

        if(message === "2"){

            const payments = await read(PAYMENTS);

            const fee =
            Math.round(
                order.harga *
                payments.qris.fee
            );


            const total =
            order.harga + fee;


            await sendWA(
                sender,
`📱 *Pembayaran QRIS*

Invoice : ${order.ref_id}

Game : ${order.game}

Produk : ${order.nama_produk}

Harga Produk :
Rp${order.harga}

Biaya QRIS :
Rp${fee}

*Total Pembayaran :*
Rp${total}


Silakan buka QRIS:

${payments.qris.url}

Setelah pembayaran berhasil kirim bukti pembayaran ya Kak 😊`
            );


            order.payment="QRIS";
            order.total=total;

        }



        // =====================
        // PILIH SEABANK
        // =====================

        if(message === "3"){

            const payments = await read(PAYMENTS);

            const bank = payments.seabank;


            await sendWA(
                sender,
`🏦 *Pembayaran SeaBank*

Invoice : ${order.ref_id}

Game : ${order.game}

Produk : ${order.nama_produk}

Total Pembayaran :
Rp${order.harga}

Nomor Rekening :
${bank.nomor}

Nama :
${bank.nama}

Silakan transfer sesuai total pembayaran.

Setelah transfer kirim bukti pembayaran ya Kak 😊`
            );


            order.payment="SEABANK";

        }


        await write(ORDERS,orders);


        res.json({
            success:true
        });



    }catch(err){

        console.log(err);

        res.json({
            success:false,
            error:err.message
        });

    }

});


module.exports = router;
