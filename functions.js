const options = require("./options");
const {bot} = require('./bot')
const helpers = require("./helpers");
const axios = require("axios");
const Car = require("./models/Car");
const User = require("./models/User");
require('dotenv').config()


async function verifyUser(user, chatId) {
    let inline_keyboard = []
    if (!user.name) return bot.sendMessage(chatId, `\nВведіть ваше прізвище, ім’я та по батькові`,{parse_mode: "HTML"});
    if (!user.cars_approved) {
        if (!user.cars.length) {
            return bot.sendMessage(chatId, `\nBведіть номер вашого транспортного засобу`,{parse_mode: "HTML"});
        } else {

            const subtypeCheck = user.cars.find(car => (car.type === 'Легковий' || car.type === 'Автобус') && !car.subtype)
            if (subtypeCheck) {
                return subtypeCheck(car, chatId)
            }

            const carryingCheck = user.cars.find(car => !car.carrying)
            if (carryingCheck) {
                return bot.sendMessage(chatId, `\nВкажiть вантажопідйомність`, options.carryingCategories);
            }
            return bot.sendMessage(chatId, `\nЧи э у вас iншi авто?`, options.addAuto);
        }
    }
    if (!user.tel_number) {
        return bot.sendMessage(chatId, `Будь ласка ,поділіться вашим контактом`, options.shareContact)
    }

    if (!user.radius.done) {
        for (let key in helpers.regions) {
            const text = `${user.radius.regions.find(region => region === key) ? "✅" : "➖"} ${helpers.regions[key]}`
            inline_keyboard.push([{text, callback_data: `setRegion_${key}`}])
        }
        inline_keyboard.push([{text: 'Далi', callback_data: `setRegion_continue`}])
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `\nДе ви готові їздити?`, opt)
    }

    if (!user.schedule) {
        return bot.sendMessage(chatId, `Оберiть зручний час для допомоги `, options.schedule)
    }

    if (!user.district) {
        for (let [key, value] of Object.entries(helpers.districts)) {
            inline_keyboard.push([{text: value, callback_data: `setDistrict_${key}`}])
        }
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Де ви мешкаєте?`, opt)
    }

    if (!user.microdistrict) {
        const district = user.district
        let category = null
        Object.entries(helpers.districts).forEach(item => {
            key = item[0]
            value = item[1]
            if (district === value) category = key
        })
        const microDistricts = helpers.microdistrics[category]
        for (let [index, value] of microDistricts.entries()) {
            inline_keyboard.push([{text: value, callback_data: `setMicroDistrict_${category}_${index}`}])
        }
        inline_keyboard.push([{text: 'Iнше', callback_data: `setMicroDistrict_Iнше`}])
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Оберiть мiкрорайон`, opt)
    }

    if (!user.adress) {
        return bot.sendMessage(chatId, `<b>Якщо не важко, то введіть адресу</b>`,{parse_mode: "HTML"})
    }

    if (!user.certification) {
        inline_keyboard = [
            [{text: "Taк", callback_data: `setCertification_yes`}],
            [{text: "Hi", callback_data: `setCertification_no`}]
        ]
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Чи є у вас посвідчення волонтера?`, opt)
    }
    return bot.sendMessage(chatId,`<b>Дякуємо, ви завершили реєстрацію</b>`,{parse_mode: "HTML"})

}

async function createCar(msgText, chatId) {
    try {
        let url = "https://baza-gai.com.ua/nomer/" + helpers.toENG(msgText);
        const response = await axios.get(url, {
            headers: {
                "Accept": "application/json",
                "X-Api-Key": process.env.CARS_DATABASE_KEY
            }
        })
        if (response.status === 200 && response.data) {
            const {
                digits,
                model,
                model_year,
                vendor,
                operations: [{color: {ua: color}, kind: {ua: kind}}]
            } = response.data
            const newCar = new Car({model: `${vendor} ${model} ${model_year}`, digits, color, type: kind})
            const car = await newCar.save()
            await User.updateOne({chat_id: chatId}, {$push: {cars: car._doc._id}})

            const inline_keyboard = []
            if (kind === 'Легковий' || kind === 'Автобус') {
                const categories = kind === 'Легковий' ? ['Седан', 'Купе', 'Универсал', 'Комбi', 'Хэчбэк', 'Всюдихід'] :
                    kind === 'Автобус' && ['Пасажирський', 'Вантажний']
                categories.forEach(category => {
                    inline_keyboard.push([{
                        text: `${category}`,
                        callback_data: `setSubtype_${car._id}_${category}`
                    }])
                })
                const opt = {
                    parse_mode: "HTML",
                    reply_markup: JSON.stringify({inline_keyboard})
                }
                const str = `\nВаш транспорт: <b>${vendor} ${model} ${model_year}</b>\nОберiть тип транспортного засобу:`

                return bot.sendMessage(chatId, str, opt);

            }
            const str = `\nВаш транспорт: <b>${vendor} ${model} ${model_year}</b> було успiшно додано\nЧи э у вас iншi авто?`
            return bot.sendMessage(chatId, str, options.addAuto);
        }
    } catch (err) {
        return bot.sendMessage(chatId, `Нет такого тс в базе`, {parse_mode: "HTML"})
    }
}

async function subtypeCheck(car, chatId) {
    const inline_keyboard = []
    const categories = car.type === 'Легковий' ? ['Седан', 'Купе', 'Универсал', 'Комбi', 'Хэчбэк', 'Всюдихід'] :
        car.type === 'Автобус' && ['Пасажирський', 'Вантажний']
    categories.forEach(category => {
        inline_keyboard.push([{text: `${category}`, callback_data: `setSubtype_${car._id}_${category}`}])
    })
    const opt = {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({inline_keyboard})
    }
    const str = `\nВаш транспорт: <b>${car.model}</b>\nОберiть тип транспортного засобу:`
    return bot.sendMessage(chatId, str, opt);
}

async function savePhone(phoneNumber, chatId) {
    try {
        await User.updateOne({chat_id: chatId}, {tel_number: phoneNumber})
        const user = await User.findOne({chat_id: chatId})
        const inline_keyboard = []
        for (let key in helpers.regions) {
            const text = `${user.radius.regions.find(region => region === key) ? "✅" : "➖"} ${helpers.regions[key]}`
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

async function setAdress(adress, chatId) {
    try {
        await User.updateOne({chat_id: chatId}, {adress})
        const inline_keyboard = [
            [{text: "Taк", callback_data: `setCertification_yes`}],
            [{text: "Hi", callback_data: `setCertification_no`}]
        ]
        const opt = {parse_mode: "HTML"}
        opt.reply_markup = JSON.stringify({inline_keyboard})
        return bot.sendMessage(chatId, `Чи є у вас посвідчення волонтера?`, opt)
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    subtypeCheck,
    verifyUser,
    createCar,
    savePhone,
    setAdress
}