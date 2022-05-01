const {bot} = require("./bot");
const options = require("./options");
const Car = require('./models/Car')
const User = require('./models/User')
const helpers = require("./helpers");


async function finishAddingCars(msg, chatId) {
    try {
        await User.updateOne({chat_id: chatId}, {cars_approved: true})
        return bot.sendMessage(chatId, `Будь ласка ,поділіться вашим контактом`, options.shareContact)
    } catch (err) {
        console.log(err)
    }
}

async function addAuto(msg, chatId) {
    try {
        let user = await User.findOne({chat_id: chatId}).populate('cars').lean().exec()
        ids = user.cars.map(car => car._id)
        let cars = await Car.find().in("_id", [...ids])
        let str = ""
        cars.forEach((car, index) => str += `\n${index + 1}. ${car.model}`)

        return bot.sendMessage(chatId,`\nВи вже додали:<b>${str}</b>\nBведіть номер вашого транспортного засобу.`, {parse_mode: "HTML"})

    } catch (err) {
        console.log(err)
    }
}

async function setSubtype(msg, chatId) {
    try {
        const id = msg.data.split("_")[1]
        const subtype = msg.data.split("_")[2]
        const car = await Car.findOne({'_id': `${id}`}).lean().exec()
        if (!car.subtype) {
            await Car.updateOne({'_id': id}, {subtype: subtype})
            return bot.sendMessage(chatId, `\nВкажiть вантажопідйомність`, options.carryingCategories);
        }
    } catch (err) {
        console.log(err)
    }
}

async function setCarrying(msg, chatId) {
    try {
        const categories = {
            "A": "до 1000",
            "B": "от 1000 до 3000",
            "C": "от 3000 до 5000",
            "D": "свыше 5000"
        }
        const carryCategory = msg.data.split("_")[1]
        const user = await User.findOne({chat_id: chatId}).populate('cars').lean().exec()
        const car = user.cars.find(car => !car.carrying)
        if (car) {
            await Car.updateOne({"_id": car._id}, {carrying: categories[carryCategory]})
        }
        return bot.sendMessage(chatId, `\nЧи э у вас iншi авто?`, options.addAuto);
    } catch (err) {
        console.log(err)
    }
}

async function setRegion(msg, chatId) {
    try {
        const region = msg.data.split("_")[1]
        const user = await User.findOne({chat_id: chatId}).lean().exec()
        const choosedRegions = user.radius.regions
        const idx = choosedRegions.findIndex(item => item === helpers.regions[region])
        let updated = []
        if (region === 'continue') {
            if (!choosedRegions.length) {
                return bot.sendMessage(chatId, `<b>Будь ласка,оберiть район</b>`,{parse_mode: "HTML"})
            }
            await User.updateOne({chat_id: chatId}, {radius: {regions: choosedRegions, done: true}})
            return bot.sendMessage(chatId, `Коли ви маєте можливість нам допомогти?\n\nЩодня чи лише в середу з 12 до 17?`, options.schedule)
        }
        if (!choosedRegions.length) {
            updated.push(helpers.regions[region])
        } else {
            if (idx >= 0) {
                choosedRegions.splice(idx, 1)
                updated = choosedRegions
            }
            if (idx === -1) {
                updated = [...choosedRegions, helpers.regions[region]]
            }
        }

        await User.updateOne({chat_id: chatId}, {radius: {regions: updated, done: false}})
        const inline_keyboard = []
        for (let key in helpers.regions) {
            const text = `${updated.find(item => item === helpers.regions[key] && item !== 'continue') ? "✅" : "➖"} ${helpers.regions[key]}`
            inline_keyboard.push([{text, callback_data: `setRegion_${key}`}])
        }
        inline_keyboard.push([{text: 'Далi', callback_data: `setRegion_continue`}])
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `\nДе ви готові їздити?`, opt)
    } catch (err) {
        console.log(err)
    }
}

async function setSchedule(msg, chatId) {
    try {
        let schedule = msg.data.split("_")[1]
        schedule = schedule === "everyday" ? "Кожний день" :
            schedule === "wednesday" && "Що середи 12-17"

        await User.updateOne({chat_id: chatId}, {schedule})
        const inline_keyboard = []
        for (let [key, value] of Object.entries(helpers.districts)) {
            inline_keyboard.push([{text: value, callback_data: `setDistrict_${key}`}])
        }
        const opt ={parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Де ви мешкаєте?`, opt)
    } catch (err) {
        console.log(err)
    }
}

async function setDistrict(msg, chatId) {
    try {
        const category = msg.data.split("_")[1]
        await User.updateOne({chat_id: chatId}, {district: helpers.districts[category]})
        const microDistricts = helpers.microdistrics[category]
        const inline_keyboard = []
        for (let [i, value] of microDistricts.entries()) {
            inline_keyboard.push([{text: value, callback_data: `setMicroDistrict_${category}_${i}`}])
        }
        inline_keyboard.push([{text: 'Iнше', callback_data: `setMicroDistrict_Iнше`}])
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Оберiть мiкрорайон`, opt)

    } catch (err) {
        console.log(err)
    }
}

async function setMicroDistrict(msg, chatId) {
    try {
        const category = msg.data.split("_")[1]
        if (category === 'Iнше') await User.updateOne({chat_id: chatId}, {microdistrict: category})
        else {
            const index = msg.data.split("_")[2]
            const micro = helpers.microdistrics[category][index]
            await User.updateOne({chat_id: chatId}, {microdistrict: micro})
        }

        return bot.sendMessage(chatId, `<b>Якщо не важко, то введіть адресу</b>`, {parse_mode: "HTML"})
    } catch (err) {
        console.log(err)
    }
}

async function setCertification(msg, chatId) {
    try {
        const isVolunteer = msg.data.split("_")[1]
        if (isVolunteer === 'yes') await User.updateOne({chat_id: chatId}, {certification: "Yes"})
        else await User.updateOne({chat_id: chatId}, {certification: "No"})

        return bot.sendMessage(chatId,`<b>Дякуємо, ви завершили реєстрацію</b>`,{parse_mode: "HTML"})
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    addAuto,
    finishAddingCars,
    setSubtype,
    setCarrying,
    setRegion,
    setSchedule,
    setDistrict,
    setMicroDistrict,
    setCertification
}

