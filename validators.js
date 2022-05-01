
function validatePhoneNumber(phone) {
    if (!phone.match(/^\+380\d{3}\d{2}\d{2}\d{2}$/)) return false
    return true
}

function validateCarNumber(number){
    if(!number.match(/^[ABCEHIKMOPTX]{2}\d{4}(?<!0{4})[ABCEHIKMOPTX]{2}$/)) return false
    return true
}

function validationFullname(fullname){
    if(fullname.trim().split(" ").length<3) return false
    return true
}
module.exports = {validatePhoneNumber,validateCarNumber,validationFullname}