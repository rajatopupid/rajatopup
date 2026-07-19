const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const { read, write } = require("../services/database");
const app = require("../config/app");

// ==========================
// LOGIN ADMIN
// ==========================

async function adminLogin(req, res) {

    try {

        const { username, password } = req.body;

        const admins = await read("admins");

        const admin = admins.find(
            a => a.username === username
        );

        if (!admin) {

            return res.json({
                success: false,
                message: "Username tidak ditemukan."
            });

        }

        const valid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!valid) {

            return res.json({
                success: false,
                message: "Password salah."
            });

        }

        req.session.admin = {

            id: admin.id,
            username: admin.username,
            name: admin.name

        };

        res.json({

            success: true,

            message: "Login berhasil.",

            admin: req.session.admin

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ==========================
// LOGOUT ADMIN
// ==========================

function adminLogout(req, res) {

    req.session.destroy(() => {

        res.json({

            success: true,

            message: "Logout berhasil."

        });

    });

}

// ==========================
// DEFAULT ADMIN
// ==========================

async function createDefaultAdmin() {

    const admins = await read("admins");

    if (admins.length > 0) {

        return;

    }

    const password = await bcrypt.hash(

        app.admin.password,

        10

    );

    admins.push({

        id: nanoid(),

        username: app.admin.username,

        password,

        name: "Administrator",

        role: "superadmin",

        createdAt: new Date().toISOString()

    });

    await write("admins", admins);

    console.log("✔ Default admin berhasil dibuat");

}

// ==========================
// REGISTER USER
// ==========================

async function register(req, res) {

    try {

        const { username, email, password } = req.body;

        if (!username || !email || !password) {

            return res.json({
                success: false,
                message: "Semua data wajib diisi."
            });

        }

        const users = await read("users");

        const exist = users.find(
            u =>
                u.username === username ||
                u.email === email
        );

        if (exist) {

            return res.json({
                success: false,
                message: "Username atau Email sudah digunakan."
            });

        }

        const hash = await bcrypt.hash(password, 10);

        users.push({

            id: nanoid(),

            username,

            email,

            password: hash,

            role: "user",

            createdAt: new Date().toISOString()

        });

        await write("users", users);

        res.json({

            success: true,

            message: "Register berhasil."

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ==========================
// LOGIN USER
// ==========================

async function userLogin(req, res) {

    try {

        const { username, password } = req.body;

        const users = await read("users");

        const user = users.find(

            u => u.username === username

        );

        if (!user) {

            return res.json({

                success: false,

                message: "User tidak ditemukan."

            });

        }

        const valid = await bcrypt.compare(

            password,

            user.password

        );

        if (!valid) {

            return res.json({

                success: false,

                message: "Password salah."

            });

        }

        req.session.user = {

            id: user.id,

            username: user.username,

            email: user.email,

            role: user.role

        };

        res.json({

            success: true,

            message: "Login berhasil.",

            user: req.session.user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

// ==========================
// LOGOUT USER
// ==========================

function userLogout(req, res) {

    req.session.destroy(() => {

        res.json({

            success: true,

            message: "Logout berhasil."

        });

    });

}

module.exports = {

    adminLogin,
    adminLogout,
    createDefaultAdmin,

    register,
    userLogin,
    userLogout

};
