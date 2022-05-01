const {connectToDb} = require('./init_db')
const User = require('./models/User')
const options = require('./options')
const {bot} = require('./bot')
const {verifyUser, createCar, savePhone, setAdress} = require('./functions')
const validators = require('./validators.js')
const callbacks = require('./callbacks')
const helpers = require('./helpers')
require('dotenv').config()


connectToDb()

bot.setMyCommands([
    {command: '/start', description: 'Начало'},
])
bot.on('message', async (msg) => {
    const msgText = msg.text
    const chatId = msg.chat.id;
    const isExist = await User.exists({chat_id: chatId})
    let user = isExist ? await User.findOne({chat_id: chatId}).populate('cars').lean().exec() : null
    let inline_keyboard = []

    try {
        if (msgText === '/start') {
            if (!isExist) return bot.sendMessage(chatId, "Мы команда Свои(https://svoi.com) , добро пожаловать в наше сообщество ,если хотите <b>Bступить</b> - нажмите кнопку ниже", options.enter);
            else return verifyUser(user, chatId)
        }
        if (msgText === 'Присоедениться') {
            if (!isExist) {
                const newUser = new User({chat_id: chatId})
                await newUser.save()
                return bot.sendMessage(chatId, `\nДякуємо за бажання доєднатися до СВОІх.\nДля початку нам потрібно познайомитися.\nВведіть ваше прізвище, ім’я та по батькові`,  {parse_mode: "HTML"});
            } else {
                return verifyUser(user, chatId)
            }
        } else {
            if (!isExist) return bot.sendMessage(chatId, `Если хотите <b>Bступить</b> - нажмите кнопку ниже`, options.enter);
        }

        if (isExist && !user.name) {
            await User.updateOne({chat_id: chatId}, {name: msgText});
            return bot.sendMessage(chatId, `Добре <b>${msgText}</b>,введіть номер вашого транспортного засобу.`, {parse_mode : "HTML"})
        }
        if (!user.cars_approved) {

            if (!user.cars.length) return createCar(msgText, chatId)

            const subtypeCheck = user.cars.find(car => (car.type === 'Легковий' || car.type === 'Автобус') && !car.subtype)
            if (subtypeCheck) {
                return subtypeCheck(car, chatId)
            }

            const carryingCheck = user.cars.find(car => !car.carrying)
            if (carryingCheck) {
                return bot.sendMessage(chatId, `\nВкажiть вантажопідйомність`, options.carryingCategories);
            }
            return createCar(msgText, chatId)
        }

        if (!user.tel_number) {
            if (msg.contact || validators.validatePhoneNumber(msgText)) return savePhone(msg.contact ? msg.contact.phone_number : msgText, chatId)
            else {
                const str = "Не вiрний формат, вiдправьте номер телефона у форматi: <b>+380xxxxxxxxx</b>\nАбо подiлiться контактом"
                return bot.sendMessage(chatId, str, options.shareContact);
            }
        }
        if (!user.radius.done) {
            for (let key in helpers.regions) {
                const text = `${user.radius.regions.find(region => region === key) ? "✅" : "➖"} ${helpers.regions[key]}`
                inline_keyboard.push([{text, callback_data: `setRegion_${key}`}])
            }
            inline_keyboard.push([{text: 'Далi', callback_data: `setRegion_continue`}])
            const opt =  {parse_mode: "HTML"}
            opt.reply_markup = JSON.stringify({inline_keyboard})
            return bot.sendMessage(chatId, `\nДе ви готові їздити?`, opt)
        }

        if (!user.schedule) {
            return bot.sendMessage(chatId, `Оберiть зручнi часи для допомоги `, options.schedule)
        }

        if (!user.district) {
            const inline_keyboard = []
            for (let [key, value] of Object.entries(helpers.districts)) {
                inline_keyboard.push([{text: value, callback_data: `setDistrict_${key}`}])
            }
            const opt =  {parse_mode: "HTML"}
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
            const opt =  {parse_mode: "HTML"}
            opt.reply_markup = JSON.stringify({inline_keyboard})
            return bot.sendMessage(chatId, `Оберiть мiкрорайон`, opt)
        }

        if (!user.adress) {
           return  setAdress(msgText, chatId)
        }

        if (!user.certification) {
            inline_keyboard = [
                [{text: "Taк", callback_data: `setCertification_yes`}],
                [{text: "Hi", callback_data: `setCertification_no`}]
            ]
            const opt =  {parse_mode: "HTML"}
            opt.reply_markup = JSON.stringify({inline_keyboard})
            return bot.sendMessage(chatId, `Чи є у вас посвідчення волонтера?`, opt)
        }
        return bot.sendMessage(chatId, `<b>Дякуємо, ви завершили реєстрацію</b>`,  {parse_mode: "HTML"})
    } catch (err) {
        console.log(err)
    }
});


bot.on('callback_query', async function (msg) {
    const chatId = msg.message.chat.id;

    const entry = msg.data.split("_")[0]
    const func = callbacks[entry]
    await func(msg, chatId)

});
