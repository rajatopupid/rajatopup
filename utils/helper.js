function rupiah(number) {

    return new Intl.NumberFormat("id-ID", {

        style: "currency",

        currency: "IDR"

    }).format(number);

}

function generateRef() {

    return "RT" + Date.now();

}

module.exports = {

    rupiah,

    generateRef

};
