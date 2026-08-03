const fs = require("fs-extra");
const path = require("path");

const USERS = path.join(__dirname, "../database/users.json");

async function generateUserId() {

    const users = await fs.readJson(USERS);

    let max = 0;

    for (const u of users) {

        if (!u.userId) continue;

        const num = parseInt(u.userId.replace("ID", ""));

        if (num > max) max = num;

    }

    return "ID" + String(max + 1).padStart(6, "0");

}

module.exports = {
    generateUserId
};
