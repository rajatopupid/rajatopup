const { prepaidPriceList } = require("./services/digiflazz");
require("dotenv").config();

(async () => {
    try {
        const res = await prepaidPriceList();

        console.log("Total:", res.data.length);

        const ff = res.data.filter(p => p.brand === "FREE FIRE");

        console.log("FF:", ff.length);

        console.log(ff.map(p => ({
            nama: p.product_name,
            kode: p.buyer_sku_code
        })));
    } catch (err) {
        console.error(err);
    }
})();
