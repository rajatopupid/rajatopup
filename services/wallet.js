const fs = require("fs-extra");
const { nanoid } = require("nanoid");
const path = require("path");

const DB = path.join(__dirname, "..", "database");

const WALLET = path.join(DB, "wallet.json");
const WALLET_HISTORY = path.join(DB, "wallet_history.json");

// Ambil semua wallet
async function getWallets() {
    return await fs.readJson(WALLET);
}

// Simpan wallet
async function saveWallets(data) {
    await fs.writeJson(WALLET, data, { spaces: 2 });
}

// Cari / buat wallet
async function getWallet(phone) {

    const wallets = await getWallets();

    let wallet = wallets.find(x => x.phone === phone);

    if (!wallet) {

        wallet = {
            id: nanoid(),
            phone,
            saldo: 0,
            level: "regular",
            createdAt: new Date().toISOString()
        };

        wallets.push(wallet);

        await saveWallets(wallets);
    }

    return wallet;
}

// Tambah saldo
async function addSaldo(phone, amount) {

console.log("PHONE :", phone);
console.log("AMOUNT :", amount);

    const wallets = await getWallets();

    let wallet = wallets.find(x => x.phone === phone);

    if (!wallet) {

        wallet = {
            id: nanoid(),
            phone,
            saldo: 0,
            level: "regular",
            createdAt: new Date().toISOString()
        };

        wallets.push(wallet);
    }

    wallet.saldo += Number(amount);

console.log("SALDO BARU :", wallet.saldo);

    await saveWallets(wallets);

    return wallet;
}

// Kurangi saldo
async function cutSaldo(phone, amount) {

    const wallets = await getWallets();

    const wallet = wallets.find(x => x.phone === phone);

    if (!wallet)
        return null;

    if (wallet.saldo < amount)
        return false;

    wallet.saldo -= Number(amount);

    await saveWallets(wallets);

    return wallet;
}

// Simpan riwayat wallet
async function addHistory(phone, type, amount, description = "") {

    const history = await fs.readJson(WALLET_HISTORY);

    history.unshift({
        id: nanoid(),
        phone,
        type,
        amount: Number(amount),
        description,
        createdAt: new Date().toISOString()
    });

    await fs.writeJson(WALLET_HISTORY, history, {
        spaces: 2
    });
}

// Upgrade level member / VIP
async function upgradeLevel(phone, amount) {

    const wallets = await getWallets();

    const wallet = wallets.find(x => x.phone === phone);

    if (!wallet) return null;

    amount = Number(amount);

    if (amount >= 1000000) {

        wallet.level = "vip";

    } else if (amount >= 200000) {

        if (wallet.level !== "vip") {
            wallet.level = "member";
        }

    }

    await saveWallets(wallets);

    return wallet;
}

module.exports = {
    getWallet,
    addSaldo,
    cutSaldo,
    addHistory,
    upgradeLevel
};
