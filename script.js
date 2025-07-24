document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    const listContainer = document.getElementById('account-list-container');
    const accountList = document.getElementById('account-list');
    const formContainer = document.getElementById('form-container');
    const accountForm = document.getElementById('account-form');
    const addAccountBtn = document.getElementById('add-account-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const formTitle = document.getElementById('form-title');

    const originalNameInput = document.getElementById('original-name');
    const emojiInput = document.getElementById('emoji');
    const nameInput = document.getElementById('name');
    const clientIdInput = document.getElementById('client_id');
    const clientSecretInput = document.getElementById('client_secret');
    const subDateInput = document.getElementById('sub_date');

    let accounts = [];

    function showList() {
        listContainer.classList.remove('hidden');
        addAccountBtn.classList.remove('hidden');
        formContainer.classList.add('hidden');
    }

    function showForm(mode = 'add', account = null) {
        listContainer.classList.add('hidden');
        addAccountBtn.classList.add('hidden');
        formContainer.classList.remove('hidden');
        accountForm.reset();

        if (mode === 'add') {
            formTitle.textContent = 'Добавить аккаунт';
            deleteBtn.classList.add('hidden');
            originalNameInput.value = '';
        } else if (mode === 'edit' && account) {
            formTitle.textContent = 'Редактировать аккаунт';
            deleteBtn.classList.remove('hidden');

            originalNameInput.value = account.name;
            emojiInput.value = account.emoji || '';
            nameInput.value = account.name || '';
            clientIdInput.value = account.client_id || '';
            // Секрет не показываем, но для отправки он нужен.
            // В реальном приложении его лучше получать с сервера по запросу.
            // Здесь для простоты мы его не будем отображать, но и не сможем редактировать.
            clientSecretInput.placeholder = "********";
            clientSecretInput.required = false; // Не требуем ввод секрета при редактировании
            subDateInput.value = account.next_subscription_payment_date || '';
        }
    }

    function renderAccounts(accountsData) {
        accountList.innerHTML = '';
        // Сортируем аккаунты так же, как в боте (упрощенно по имени)
        accountsData.sort((a, b) => a.name.localeCompare(b.name));
        accountsData.forEach(acc => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="account-name">${acc.emoji} ${acc.name}</span>`;
            li.addEventListener('click', () => {
                // Находим полный объект аккаунта, чтобы получить client_id
                const fullAccount = accounts.find(a => a.name === acc.name);
                showForm('edit', fullAccount);
            });
            accountList.appendChild(li);
        });
    }

    function sendDataToBot(action, payload, original_name = null) {
        const data = { action, payload };
        if (original_name) {
            data.original_name = original_name;
        }
        tg.sendData(JSON.stringify(data));
    }

    addAccountBtn.addEventListener('click', () => showForm('add'));
    cancelBtn.addEventListener('click', () => showList());

    accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            emoji: emojiInput.value,
            name: nameInput.value,
            client_id: clientIdInput.value,
            client_secret: clientSecretInput.value,
            next_subscription_payment_date: subDateInput.value
        };

        if (originalNameInput.value) { // Edit mode
            // Если поле секрета пустое, не отправляем его, чтобы бот не затер старое значение
            if (!payload.client_secret) {
                delete payload.client_secret;
            }
            sendDataToBot('edit_account', payload, originalNameInput.value);
        } else { // Add mode
            sendDataToBot('add_account', payload);
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (confirm(`Вы уверены, что хотите удалить аккаунт "${originalNameInput.value}"?`)) {
            sendDataToBot('delete_account', { name: originalNameInput.value });
        }
    });

    // --- Инициализация ---
    function initialize() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const accountsData = urlParams.get('accounts_data');

            if (accountsData) {
                // Декодируем и парсим JSON строку
                const decodedData = decodeURIComponent(accountsData);
                accounts = JSON.parse(decodedData);
            } else {
                // Если данные не переданы, показываем пустой список
                console.warn("Параметр 'accounts_data' не найден в URL.");
                accounts = [];
            }
        } catch (error) {
            console.error("Ошибка при инициализации данных из URL:", error);
            tg.showAlert("Не удалось загрузить данные аккаунтов. Попробуйте перезапустить Web App.");
            accounts = [];
        }
        renderAccounts(accounts);
        showList();
    }

    initialize();
});
