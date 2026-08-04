const fs = require("fs-extra");
const { nanoid } = require("nanoid");
const path = require("path");

const DB = path.join(__dirname, "..", "database");

const USERS = path.join(DB, "users.json");

// ===========================
// Tambah Saldo + History + Level
// ===========================
async function addSaldo(userId, amount, description = "") {

    const users = await fs.readJson(USERS);

    const user = users.find(u => u.userId === userId);

    if (!user) return null;

    if (!user.wallet) {
        user.wallet = {
            saldo: 0,
            level: "REGULAR",
            history: []
        };
    }

    amount = Number(amount);

    user.wallet.saldo += amount;

    // Simpan riwayat
    user.wallet.history.unshift({
        id: nanoid(),
        type: "MASUK",
        amount,
        description,
        createdAt: new Date().toISOString()
    });

    // Upgrade level
    if (amount >= 1000000) {

        user.wallet.level = "VIP";

    } else if (
        amount >= 200000 &&
        user.wallet.level !== "VIP"
    ) {

        user.wallet.level = "MEMBER";
    }

    await fs.writeJson(USERS, users, {
        spaces: 2
    });

    return user.wallet;
}

// ===========================
// Kurangi Saldo
// ===========================
async function cutSaldo(userId, amount, description = "") {

    const users = await fs.readJson(USERS);

    const user = users.find(u => u.userId === userId);

    if (!user) return null;

    if (!user.wallet) {
        user.wallet = {
            saldo: 0,
            level: "REGULAR",
            history: []
        };
    }

    amount = Number(amount);

    if (user.wallet.saldo < amount) {
        return false;
    }

    user.wallet.saldo -= amount;

    user.wallet.history.unshift({
        id: nanoid(),
        type: "KELUAR",
        amount,
        description,
        createdAt: new Date().toISOString()
    });

    await fs.writeJson(USERS, users, {
        spaces: 2
    });

    return user.wallet;
}

// ===========================
// Ambil Wallet
// ===========================
async function getWallet(userId) {

    const users = await fs.readJson(USERS);

    const user = users.find(u => u.userId === userId);

    if (!user) return null;

    if (!user.wallet) {
        user.wallet = {
            saldo: 0,
            level: "REGULAR",
            history: []
        };
    }

    return user.wallet;
}

module.exports = {
    getWallet,
    addSaldo,
    cutSaldo
};

