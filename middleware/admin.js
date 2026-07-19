function admin(req, res, next) {

    if (!req.session.admin) {

        return res.status(401).json({

            success: false,

            message: "Silakan login admin."

        });

    }

    next();

}

module.exports = admin;
