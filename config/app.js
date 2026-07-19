module.exports = {

    appName: process.env.APP_NAME,

    port: Number(process.env.PORT),

    website: {

        name: process.env.WEBSITE_NAME,

        url: process.env.WEBSITE_URL,

        description: process.env.WEBSITE_DESCRIPTION

    },

    admin: {

        username: process.env.ADMIN_USERNAME,

        password: process.env.ADMIN_PASSWORD

    },

    markup: Number(process.env.DEFAULT_MARKUP)

};
