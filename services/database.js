const fs = require("fs-extra");
const path = require("path");

const DB = path.join(__dirname, "..", "database");

async function ensure(name, defaultData = []) {

    const file = path.join(DB, `${name}.json`);

    await fs.ensureFile(file);

    try {

        await fs.readJson(file);

    } catch {

        await fs.writeJson(file, defaultData, {
            spaces: 2
        });

    }

    return file;

}

async function read(name) {

    const file = await ensure(name);

    return await fs.readJson(file);

}

async function write(name, data) {

    const file = await ensure(name);

    await fs.writeJson(file, data, {
        spaces: 2
    });

}

module.exports = {

    ensure,

    read,

    write

};
