const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;

const BOT_TOKEN = '7734437654:AAGJnQTdte2BA_r0NykwMsodmq0uyscikK0';
const MAIN_ADMIN_ID = '6972232777';



const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Ma'lumotlarni faylga saqlash va yuklash
const dataFile = 'bot_data.json';
let userLangs = new Map();
let uploadedFiles = new Map();
let requiredChannels = new Map();
let admins = new Set([MAIN_ADMIN_ID]);

async function saveData() {
    const data = {
        userLangs: Array.from(userLangs.entries()),
        uploadedFiles: Array.from(uploadedFiles.entries()),
        requiredChannels: Array.from(requiredChannels.entries()),
        admins: Array.from(admins)
    };
    await fs.writeFile(dataFile, JSON.stringify(data));
}

async function loadData() {
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
        userLangs = new Map(data.userLangs || []);
        uploadedFiles = new Map(data.uploadedFiles || []);
        requiredChannels = new Map(data.requiredChannels || []);
        admins = new Set(data.admins || [MAIN_ADMIN_ID]);
    } catch (error) {
        console.log('Ma\'lumotlar fayli topilmadi yoki bo\'sh. Yangi fayl yaratiladi.');
    }
}

loadData();

// Foydalanuvchi holatlarini saqlash uchun Map
const userStates = new Map();
const tempFileMap = new Map();

// --- TILGA MOS MATN VA TUGMALAR ---
const texts = {
    'uz': {
        'welcome': "👋 Botga xush kelibsiz!\n\nMavjud fayllar ro'yxati:",
        'main_menu_text': "📋 Bosh menyu",
        'apps_list': "📂 Mavjud APK ro'yxati:",
        'admin_panel_title': "🤖 Admin paneli",
        'stats_text': "📊 Bot statistikasi:\n\n👥 Foydalanuvchilar: %s ta\n📁 Yuklangan fayllar: %s ta\n🔗 Ulanilgan kanallar: %s ta",
        'send_file_prompt': "📤 Istalgan turdagi APK yuboring.",
        'file_saved': "✅ Fayl muvaffaqiyatli saqlandi!",
        'not_admin': "⛔ Siz admin emassiz!",
        'channels_list': "🔗 Ulanilgan kanallar ro'yxati:",
        'add_channel_prompt_id': "📝 Kanal ID'sini yuboring.\nMisol: @kanaliningismi",
        'add_channel_prompt_link': "🔗 Kanalning taklif havolasini yuboring.\nMisol: https://t.me/kanaliningismi",
        'channel_added': "✅ Kanal muvaffaqiyatli qo'shildi!",
        'post_to_users_prompt': "📝 Foydalanuvchilarga yuborish uchun matn/fayl yuboring:",
        'post_to_users_sent': "✅ Xabar barcha foydalanuvchilarga yuborildi!",
        'join_channel_prompt': "🔒 Botdan foydalanish uchun quyidagi kanallarga obuna bo'ling:",
        'check_subscribe': "✅ Obunani tekshirish",
        'not_subscribed': "❌ Siz hali barcha kanallarga obuna bo'lmadingiz!",
        'choose_file_to_delete': "❌ O'chirish uchun faylni tanlang:",
        'no_files_found': "📁 Hozirda hech qanday APK mavjud emas.",
        'no_channels_found': "🔗 Hozirda hech qanday kanal ulanmagan.",
        'file_deleted': "🗑️ Fayl o'chirildi.",
        'channel_deleted_success': "🗑️ Kanal o'chirildi.",
        'channel_not_found': "❌ Kanal topilmadi yoki bot admin emas.",
        'file_upload_error': "❌ Faylni yuklashda xatolik. Qayta urinib ko'ring.",
        'change_lang_text': "🌐 Tilni tanlang:",
        'lang_changed': "✅ Til muvaffaqiyatli o'zgartirildi!",
        'add_admin_prompt': "👤 Yangi adminning user ID'sini yuboring:",
        'admin_added': "✅ Yangi admin qo'shildi!",
        'admin_already_exists': "❌ Bu foydalanuvchi allaqachon admin.",
        'remove_admin_prompt': "👤 O'chirish uchun adminni tanlang:",
        'admin_removed': "🗑️ Admin o'chirildi!",
        'no_other_admins': "👥 Boshqa adminlar mavjud emas."
    },
    'ru': {
        'welcome': "👋 Добро пожаловать в бот!\n\nСписок доступных файлов:",
        'main_menu_text': "📋 Главное меню",
        'apps_list': "📂 Список доступных файлов:",
        'admin_panel_title': "🤖 Панель администратора",
        'stats_text': "📊 Статистика бота:\n\n👥 Пользователи: %s\n📁 Загруженные файлы: %s\n🔗 Подключенные каналы: %s",
        'send_file_prompt': "📤 Отправьте файл любого типа.",
        'file_saved': "✅ Файл успешно сохранен!",
        'not_admin': "⛔ Вы не администратор!",
        'channels_list': "🔗 Список подключенных каналов:",
        'add_channel_prompt_id': "📝 Отправьте ID канала.\nПример: @имяканала",
        'add_channel_prompt_link': "🔗 Отправьте ссылку-приглашение канала.\nПример: https://t.me/имяканала",
        'channel_added': "✅ Канал успешно добавлен!",
        'post_to_users_prompt': "📝 Отправьте текст/файл для рассылки пользователям:",
        'post_to_users_sent': "✅ Сообщение отправлено всем пользователям!",
        'join_channel_prompt': "🔒 Для использования бота подпишитесь на следующие каналы:",
        'check_subscribe': "✅ Проверить подписку",
        'not_subscribed': "❌ Вы еще не подписались на все каналы!",
        'choose_file_to_delete': "❌ Выберите файл для удаления:",
        'no_files_found': "📁 В настоящее время файлов нет.",
        'no_channels_found': "🔗 В настоящее время каналов нет.",
        'file_deleted': "🗑️ Файл удален.",
        'channel_deleted_success': "🗑️ Канал удален.",
        'channel_not_found': "❌ Канал не найден или бот не администратор.",
        'file_upload_error': "❌ Ошибка при загрузке файла. Попробуйте еще раз.",
        'change_lang_text': "🌐 Выберите язык:",
        'lang_changed': "✅ Язык успешно изменен!",
        'add_admin_prompt': "👤 Отправьте ID нового администратора:",
        'admin_added': "✅ Новый администратор добавлен!",
        'admin_already_exists': "❌ Этот пользователь уже администратор.",
        'remove_admin_prompt': "👤 Выберите администратора для удаления:",
        'admin_removed': "🗑️ Администратор удален!",
        'no_other_admins': "👥 Других администраторов нет."
    },
    'en': {
        'welcome': "👋 Welcome to the bot!\n\nList of available files:",
        'main_menu_text': "📋 Main menu",
        'apps_list': "📂 List of available files:",
        'admin_panel_title': "🤖 Admin panel",
        'stats_text': "📊 Bot statistics:\n\n👥 Users: %s\n📁 Uploaded files: %s\n🔗 Connected channels: %s",
        'send_file_prompt': "📤 Send any type of file.",
        'file_saved': "✅ File saved successfully!",
        'not_admin': "⛔ You are not an admin!",
        'channels_list': "🔗 List of connected channels:",
        'add_channel_prompt_id': "📝 Send channel ID.\nExample: @channelname",
        'add_channel_prompt_link': "🔗 Send channel invite link.\nExample: https://t.me/channelname",
        'channel_added': "✅ Channel added successfully!",
        'post_to_users_prompt': "📝 Send text/file to broadcast to users:",
        'post_to_users_sent': "✅ Message sent to all users!",
        'join_channel_prompt': "🔒 To use the bot, subscribe to the following channels:",
        'check_subscribe': "✅ Check subscription",
        'not_subscribed': "❌ You haven't subscribed to all channels yet!",
        'choose_file_to_delete': "❌ Choose file to delete:",
        'no_files_found': "📁 No files available at the moment.",
        'no_channels_found': "🔗 No channels connected at the moment.",
        'file_deleted': "🗑️ File deleted.",
        'channel_deleted_success': "🗑️ Channel deleted.",
        'channel_not_found': "❌ Channel not found or bot is not admin.",
        'file_upload_error': "❌ Error uploading file. Please try again.",
        'change_lang_text': "🌐 Choose language:",
        'lang_changed': "✅ Language changed successfully!",
        'add_admin_prompt': "👤 Send new admin's user ID:",
        'admin_added': "✅ New admin added!",
        'admin_already_exists': "❌ This user is already an admin.",
        'remove_admin_prompt': "👤 Choose admin to remove:",
        'admin_removed': "🗑️ Admin removed!",
        'no_other_admins': "👥 No other admins available."
    }
};

// --- KLAVIATURALAR ---
function getMainMenuKeyboard(lang, userId) {
    const is_admin = admins.has(userId.toString());
    let keyboard = [
        [{ text: "📂 Apk ilovalar ios" }, { text: "🌐 Til" }]
    ];
    if (is_admin) {
        keyboard.push([{ text: "⚙️ Admin panel" }]);
    }
    return {
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getAdminPanelKeyboard(lang, userId) {
    let keyboard = [
        [{ text: "📊 Statistika" }, { text: "🔗 Kanallar" }],
        [{ text: "📤 APK yuklash" }, { text: "🗑️ APK o'chirish" }],
        [{ text: "📢 E'lon yuborish" }],
        [{ text: "🔙 Orqaga" }]
    ];

    if (userId.toString() === MAIN_ADMIN_ID.toString()) {
        keyboard.unshift([{ text: "➕ Admin qo'shish" }, { text: "➖ Admin o'chirish" }]);
    }

    return {
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getBackKeyboard(lang) {
    return {
        keyboard: [
            [{ text: "🔙 Orqaga" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getCancelKeyboard(lang) {
    return {
        keyboard: [
            [{ text: "❌ Bekor qilish" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getLanguageKeyboard(lang) {
    return {
        inline_keyboard: [
            [{ text: '🇺🇿 Oʻzbek', callback_data: 'set_lang_uz' }],
            [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }],
            [{ text: '🇬🇧 English', callback_data: 'set_lang_en' }]
        ]
    };
}

// --- YORDAMCHI FUNKSIYALAR ---
async function checkSubscription(userId) {
    if (requiredChannels.size === 0) return true;

    for (const [channelId, channelLink] of requiredChannels) {
        try {
            const member = await bot.getChatMember(channelId, userId);
            if (!['member', 'creator', 'administrator'].includes(member.status)) {
                return false;
            }
        } catch (error) {
            console.error(`Obunani tekshirishda xatolik: ${channelId}`, error.message);
            return false;
        }
    }
    return true;
}

async function sendAllFiles(chatId, lang) {
    const allFiles = [...uploadedFiles.values()];

    if (allFiles.length > 0) {
        await bot.sendMessage(chatId, texts[lang].apps_list);
        for (const file of allFiles) {
            try {
                await bot.sendDocument(chatId, file.fileId, {
                    caption: `📄 ${file.fileName}`
                });
            } catch (error) {
                console.error(`Fayl yuborishda xatolik (${file.fileName}):`, error);
                await bot.sendMessage(chatId, `❌ "${file.fileName}" faylini yuborishda xatolik.`);
            }
        }
    } else {
        await bot.sendMessage(chatId, texts[lang].no_files_found);
    }
}

// --- /START BUYRUG'I ---
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Agar foydalanuvchi yangi bo'lsa, default til o'zbekcha qo'yamiz
    if (!userLangs.has(userId)) {
        userLangs.set(userId, 'uz');
        await saveData();
    }

    const lang = userLangs.get(userId);
    const isSubscribed = await checkSubscription(userId);

    // Majburiy obunani tekshirish
    if (!isSubscribed && requiredChannels.size > 0) {
        const keyboard = { inline_keyboard: [] };

        for (const [channelId, channelLink] of requiredChannels) {
            keyboard.inline_keyboard.push([{
                text: `📢 ${channelId}`,
                url: channelLink
            }]);
        }

        keyboard.inline_keyboard.push([{
            text: texts[lang].check_subscribe,
            callback_data: 'check_subscribe'
        }]);

        return bot.sendMessage(chatId, texts[lang].join_channel_prompt, {
            reply_markup: keyboard
        });
    }

    // Fayllarni darhol yuborish va menyuni ko'rsatish
    await bot.sendMessage(chatId, texts[lang].welcome);
    await sendAllFiles(chatId, lang);
    await bot.sendMessage(chatId, texts[lang].main_menu_text, {
        reply_markup: getMainMenuKeyboard(lang, userId)
    });
});

// --- CALLBACK QUERY QAYTA ISHLASH ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    await bot.answerCallbackQuery(query.id);

    const lang = userLangs.get(userId) || 'uz';

    if (data.startsWith('set_lang_')) {
        const newLang = data.split('_')[2];
        userLangs.set(userId, newLang);
        await saveData();
        bot.deleteMessage(chatId, query.message.message_id);
        bot.sendMessage(chatId, texts[newLang].lang_changed, {
            reply_markup: getMainMenuKeyboard(newLang, userId)
        });
        return;
    }

    if (data === 'check_subscribe') {
        const isSubscribed = await checkSubscription(userId);
        if (isSubscribed) {
            bot.deleteMessage(chatId, query.message.message_id);
            await bot.sendMessage(chatId, texts[lang].welcome);
            await sendAllFiles(chatId, lang);
            bot.sendMessage(chatId, texts[lang].main_menu_text, {
                reply_markup: getMainMenuKeyboard(lang, userId)
            });
        } else {
            bot.answerCallbackQuery(query.id, {
                text: texts[lang].not_subscribed,
                show_alert: true
            });
        }
        return;
    }

    if (!admins.has(userId.toString())) return;

    // Admin callback querylar
    if (data.startsWith('delete_file_')) {
        const fileIndex = data.split('_')[2];
        const fileIdToDelete = tempFileMap.get(fileIndex);
        if (fileIdToDelete && uploadedFiles.has(fileIdToDelete)) {
            uploadedFiles.delete(fileIdToDelete);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].file_deleted, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
        }
        tempFileMap.clear();
    }

    if (data.startsWith('delete_channel_')) {
        const channelIdToDelete = data.split('_')[2];
        if (requiredChannels.has(channelIdToDelete)) {
            requiredChannels.delete(channelIdToDelete);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].channel_deleted_success, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
        }
    }

    if (data.startsWith('remove_admin_')) {
        const adminIdToRemove = data.split('_')[2];
        if (admins.has(adminIdToRemove)) {
            admins.delete(adminIdToRemove);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].admin_removed, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
        }
    }

    if (data === 'add_channel') {
        userStates.set(userId, 'awaiting_channel_id');
        bot.sendMessage(chatId, texts[lang].add_channel_prompt_id, {
            reply_markup: getCancelKeyboard(lang)
        });
    }
});

// --- MATNLI XABARLARGA JAVOB BERISH ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const lang = userLangs.get(userId) || 'uz';
    const state = userStates.get(userId);

    if (msg.text && msg.text.startsWith('/')) return;

    // Oddiy foydalanuvchilar uchun
    if (!admins.has(userId.toString())) {
        switch (text) {
            case "📂 APKLAR":
                await sendAllFiles(chatId, lang);
                bot.sendMessage(chatId, texts[lang].main_menu_text, {
                    reply_markup: getMainMenuKeyboard(lang, userId)
                });
                break;
            case "🌐 Til":
                bot.sendMessage(chatId, texts[lang].change_lang_text, {
                    reply_markup: getLanguageKeyboard(lang)
                });
                break;
            default:
                bot.sendMessage(chatId, texts[lang].main_menu_text, {
                    reply_markup: getMainMenuKeyboard(lang, userId)
                });
                break;
        }
        return;
    }

    // Admin xabarlari
    switch (text) {
        case "⚙️ Admin panel":
            userStates.delete(userId);
            bot.sendMessage(chatId, texts[lang].admin_panel_title, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
            break;

        case "🔙 Orqaga":
            userStates.delete(userId);
            bot.sendMessage(chatId, texts[lang].main_menu_text, {
                reply_markup: getMainMenuKeyboard(lang, userId)
            });
            break;

        case "❌ Bekor qilish":
            userStates.delete(userId);
            bot.sendMessage(chatId, texts[lang].admin_panel_title, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
            break;

        case "📊 Statistika":
            const userCount = userLangs.size;
            const fileCount = uploadedFiles.size;
            const channelCount = requiredChannels.size;
            const statsText = texts[lang].stats_text
                .replace('%s', userCount)
                .replace('%s', fileCount)
                .replace('%s', channelCount);
            bot.sendMessage(chatId, statsText, {
                reply_markup: getBackKeyboard(lang)
            });
            break;

        case "📤 APK yuklash":
            userStates.set(userId, 'awaiting_file');
            bot.sendMessage(chatId, texts[lang].send_file_prompt, {
                reply_markup: getCancelKeyboard(lang)
            });
            break;

        case "🗑️ APK o'chirish":
            userStates.delete(userId);
            if (uploadedFiles.size === 0) {
                return bot.sendMessage(chatId, texts[lang].no_files_found, {
                    reply_markup: getAdminPanelKeyboard(lang, userId)
                });
            }

            tempFileMap.clear();
            const deleteFileKeyboard = { inline_keyboard: [] };
            let index = 0;
            for (const [fileId, file] of uploadedFiles) {
                const callbackData = `delete_file_${index}`;
                tempFileMap.set(index.toString(), fileId);
                deleteFileKeyboard.inline_keyboard.push([{
                    text: `🗑️ ${file.fileName}`,
                    callback_data: callbackData
                }]);
                index++;
            }
            bot.sendMessage(chatId, texts[lang].choose_file_to_delete, {
                reply_markup: deleteFileKeyboard
            });
            break;

        case "🔗 Kanallar":
            userStates.delete(userId);
            const channelsKeyboard = { inline_keyboard: [] };

            if (requiredChannels.size === 0) {
                channelsKeyboard.inline_keyboard.push([{
                    text: "📢 Kanal qo'shish",
                    callback_data: 'add_channel'
                }]);
            } else {
                for (const [channelId, channelLink] of requiredChannels) {
                    channelsKeyboard.inline_keyboard.push([{
                        text: `🗑️ ${channelId}`,
                        callback_data: `delete_channel_${channelId}`
                    }]);
                }
                channelsKeyboard.inline_keyboard.push([{
                    text: "➕ Kanal qo'shish",
                    callback_data: 'add_channel'
                }]);
            }

            bot.sendMessage(chatId, texts[lang].channels_list, {
                reply_markup: channelsKeyboard
            });
            break;

        case "📢 E'lon yuborish":
            userStates.set(userId, 'awaiting_post_to_users');
            bot.sendMessage(chatId, texts[lang].post_to_users_prompt, {
                reply_markup: getCancelKeyboard(lang)
            });
            break;

        case "➕ Admin qo'shish":
            if (userId.toString() !== MAIN_ADMIN_ID.toString()) return;
            userStates.set(userId, 'awaiting_new_admin_id');
            bot.sendMessage(chatId, texts[lang].add_admin_prompt, {
                reply_markup: getCancelKeyboard(lang)
            });
            break;

        case "➖ Admin o'chirish":
            if (userId.toString() !== MAIN_ADMIN_ID.toString()) return;

            const otherAdmins = [...admins].filter(id => id !== MAIN_ADMIN_ID);
            if (otherAdmins.length === 0) {
                return bot.sendMessage(chatId, texts[lang].no_other_admins, {
                    reply_markup: getAdminPanelKeyboard(lang, userId)
                });
            }

            const removeAdminKeyboard = { inline_keyboard: [] };
            for (const adminId of otherAdmins) {
                removeAdminKeyboard.inline_keyboard.push([{
                    text: `🗑️ Admin ID: ${adminId}`,
                    callback_data: `remove_admin_${adminId}`
                }]);
            }
            bot.sendMessage(chatId, texts[lang].remove_admin_prompt, {
                reply_markup: removeAdminKeyboard
            });
            break;

        case "📂 Fayllar":
            await sendAllFiles(chatId, lang);
            bot.sendMessage(chatId, texts[lang].main_menu_text, {
                reply_markup: getMainMenuKeyboard(lang, userId)
            });
            break;

        case "🌐 Til":
            bot.sendMessage(chatId, texts[lang].change_lang_text, {
                reply_markup: getLanguageKeyboard(lang)
            });
            break;

        default:
            // State-based xabarlar
            if (state === 'awaiting_new_admin_id') {
                const newAdminId = text.trim();
                if (admins.has(newAdminId)) {
                    bot.sendMessage(chatId, texts[lang].admin_already_exists, {
                        reply_markup: getAdminPanelKeyboard(lang, userId)
                    });
                } else {
                    admins.add(newAdminId);
                    await saveData();
                    bot.sendMessage(chatId, texts[lang].admin_added, {
                        reply_markup: getAdminPanelKeyboard(lang, userId)
                    });
                }
                userStates.delete(userId);
            } else if (state === 'awaiting_channel_id') {
                const channelId = msg.text.trim();
                try {
                    const chat = await bot.getChat(channelId);
                    if (chat.type === 'channel') {
                        userStates.set(userId, 'awaiting_channel_link');
                        userStates.set(`${userId}_channel_id`, channelId);
                        bot.sendMessage(chatId, texts[lang].add_channel_prompt_link, {
                            reply_markup: getCancelKeyboard(lang)
                        });
                    } else {
                        bot.sendMessage(chatId, "❌ Bu kanal emas. Kanal username'ini kiriting.", {
                            reply_markup: getCancelKeyboard(lang)
                        });
                    }
                } catch (error) {
                    console.error(error);
                    bot.sendMessage(chatId, texts[lang].channel_not_found, {
                        reply_markup: getCancelKeyboard(lang)
                    });
                }
            } else if (state === 'awaiting_channel_link') {
                const channelId = userStates.get(`${userId}_channel_id`);
                const channelLink = msg.text.trim();
                if (channelLink.startsWith('https://t.me/')) {
                    requiredChannels.set(channelId, channelLink);
                    await saveData();
                    bot.sendMessage(chatId, texts[lang].channel_added, {
                        reply_markup: getAdminPanelKeyboard(lang, userId)
                    });
                    userStates.delete(userId);
                    userStates.delete(`${userId}_channel_id`);
                } else {
                    bot.sendMessage(chatId, "❌ Noto'g'ri havola. https://t.me/ bilan boshlash kerak.", {
                        reply_markup: getCancelKeyboard(lang)
                    });
                }
            } else if (state === 'awaiting_post_to_users') {
                let sentCount = 0;
                let errorCount = 0;

                for (const [user_id, lang_code] of userLangs) {
                    try {
                        await bot.sendMessage(user_id, text);
                        sentCount++;
                    } catch (error) {
                        errorCount++;
                        console.error(`Xabar yuborishda xatolik (ID: ${user_id}):`, error);
                    }
                }

                bot.sendMessage(chatId, `${texts[lang].post_to_users_sent}\n\n✅ Yuborildi: ${sentCount}\n❌ Xatolik: ${errorCount}`, {
                    reply_markup: getAdminPanelKeyboard(lang, userId)
                });
                userStates.delete(userId);
            } else {
                bot.sendMessage(chatId, texts[lang].main_menu_text, {
                    reply_markup: getMainMenuKeyboard(lang, userId)
                });
            }
            break;
    }
});

// --- FAYL QAYTA ISHLASH ---
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates.get(userId);

    if (!admins.has(userId.toString())) return;

    const lang = userLangs.get(userId) || 'uz';
    const document = msg.document;

    if (state === 'awaiting_file') {
        try {
            uploadedFiles.set(document.file_id, {
                fileName: document.file_name,
                fileId: document.file_id
            });
            await saveData();
            bot.sendMessage(chatId, texts[lang].file_saved, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
            userStates.delete(userId);
        } catch (error) {
            console.error('Faylni saqlashda xatolik:', error);
            bot.sendMessage(chatId, texts[lang].file_upload_error, {
                reply_markup: getAdminPanelKeyboard(lang, userId)
            });
        }
    } else if (state === 'awaiting_post_to_users') {
        let sentCount = 0;
        let errorCount = 0;

        for (const [user_id, lang_code] of userLangs) {
            try {
                await bot.sendDocument(user_id, document.file_id, {
                    caption: msg.caption || ''
                });
                sentCount++;
            } catch (error) {
                errorCount++;
                console.error(`Fayl yuborishda xatolik (ID: ${user_id}):`, error);
            }
        }

        bot.sendMessage(chatId, `${texts[lang].post_to_users_sent}\n\n✅ Yuborildi: ${sentCount}\n❌ Xatolik: ${errorCount}`, {
            reply_markup: getAdminPanelKeyboard(lang, userId)
        });
        userStates.delete(userId);
    }
});

// Rasm va video uchun ham
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates.get(userId);

    if (!admins.has(userId.toString()) || state !== 'awaiting_post_to_users') return;

    const lang = userLangs.get(userId) || 'uz';
    const photo = msg.photo[msg.photo.length - 1];

    let sentCount = 0;
    let errorCount = 0;

    for (const [user_id, lang_code] of userLangs) {
        try {
            await bot.sendPhoto(user_id, photo.file_id, {
                caption: msg.caption || ''
            });
            sentCount++;
        } catch (error) {
            errorCount++;
            console.error(`Rasm yuborishda xatolik (ID: ${user_id}):`, error);
        }
    }

    bot.sendMessage(chatId, `${texts[lang].post_to_users_sent}\n\n✅ Yuborildi: ${sentCount}\n❌ Xatolik: ${errorCount}`, {
        reply_markup: getAdminPanelKeyboard(lang, userId)
    });
    userStates.delete(userId);
});

bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates.get(userId);

    if (!admins.has(userId.toString()) || state !== 'awaiting_post_to_users') return;

    const lang = userLangs.get(userId) || 'uz';
    const video = msg.video;

    let sentCount = 0;
    let errorCount = 0;

    for (const [user_id, lang_code] of userLangs) {
        try {
            await bot.sendVideo(user_id, video.file_id, {
                caption: msg.caption || ''
            });
            sentCount++;
        } catch (error) {
            errorCount++;
            console.error(`Video yuborishda xatolik (ID: ${user_id}):`, error);
        }
    }

    bot.sendMessage(chatId, `${texts[lang].post_to_users_sent}\n\n✅ Yuborildi: ${sentCount}\n❌ Xatolik: ${errorCount}`, {
        reply_markup: getAdminPanelKeyboard(lang, userId)
    });
    userStates.delete(userId);
});

// Xatoliklarni qayta ishlash
bot.on('polling_error', (err) => {
    console.error('Polling xatosi:', err.code, err.response?.body);
});

bot.on('webhook_error', (err) => {
    console.error('Webhook xatosi:', err);
});

console.log('🤖 Bot ishga tushdi!');