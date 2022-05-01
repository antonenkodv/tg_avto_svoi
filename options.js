module.exports = {
    enter: {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            one_time_keyboard: true,
            remove_keyboard : true,
            keyboard: [
                [{
                    text: "Присоедениться",
                }]
            ]
        })
    },
    addAuto: {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            one_time_keyboard: true,
            inline_keyboard: [
                [{text: 'Так ', callback_data: 'addAuto_'},
                    {text: 'Hi', callback_data: 'finishAddingCars_'}],
            ]
        })
    },
    carryingCategories: {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            one_time_keyboard: true,
            inline_keyboard: [
                [{text: 'меньше 1000 кг ', callback_data: 'setCarrying_A'},
                    {text: 'от 1000кг до 3000кг', callback_data: 'setCarrying_B'}],
                [{text: 'от 3000кг до 5000кг', callback_data: 'setCarrying_C'},
                    {text: 'свыше  5000кг', callback_data: 'setCarrying_D'}]
            ]
        })
    },
    shareContact: {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            one_time_keyboard: true,
            remove_keyboard: true,
            keyboard: [
                [{
                    text: "Поделиться контактом",
                    request_contact: true
                }]
            ]
        })
    },
    schedule: {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            one_time_keyboard: true,
            inline_keyboard: [
                [{
                    text: "Щодня",
                    callback_data: `setSchedule_everyday`
                }],
                [{
                    text: "Сeреда 12-17",
                    callback_data: `setSchedule_wednesday`
                }],
            ]
        })
    }
}