const axios = require("axios");

async function sendWA(target, message){
    return axios.post(
        "https://api.fonnte.com/send",
        {
            target,
            message
        },
        {
            headers:{
                Authorization: process.env.FONNTE_TOKEN
            }
        }
    );
}

module.exports = {
    sendWA
};
