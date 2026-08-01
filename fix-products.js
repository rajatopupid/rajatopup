const fs = require("fs");

const file = "database/products.json";

let products = JSON.parse(fs.readFileSync(file));

const map = {};

for (const p of products) {

    const key = p.nama.toLowerCase();

    if (
        !map[key] ||
        Number(p.harga_modal) < Number(map[key].harga_modal)
    ) {
        map[key] = p;
    }

}

fs.writeFileSync(
    file,
    JSON.stringify(Object.values(map), null, 2)
);

console.log("Produk dibersihkan:", Object.values(map).length);
