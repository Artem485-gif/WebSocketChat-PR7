
const WebSocket = require('ws');

// Створення WebSocket-сервера на порту 8080
const server = new WebSocket.Server({ port: 8080 });

// Масив для збереження повідомлень
const messages = [];

console.log('WebSocket-сервер запущено на ws://localhost:8080');

// Обробка підключення нового клієнта
server.on('connection', (socket) => {
    console.log('Новий клієнт підключився');

    // Надсилання актуального списку повідомлень
    socket.send(JSON.stringify({
        type: 'messages',
        data: messages
    }));

    // Отримання повідомлень від клієнта
    socket.on('message', (message) => {
        try {
            const request = JSON.parse(message.toString());

            // Додавання нового повідомлення
            if (request.action === 'addMessage') {
                if (
                    typeof request.username !== 'string' ||
                    typeof request.text !== 'string' ||
                    !request.username.trim() ||
                    !request.text.trim()
                ) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: 'Ім’я та текст повідомлення не можуть бути порожніми'
                    }));
                    return;
                }

                const newMessage = {
                    username: request.username.trim(),
                    text: request.text.trim(),
                    time: new Date().toLocaleTimeString('uk-UA')
                };

                messages.push(newMessage);

                console.log('Нове повідомлення:', newMessage);

                // Розсилка оновленого списку всім клієнтам
                broadcastMessages();
            }

            // Отримання списку повідомлень
            else if (request.action === 'getMessages') {
                socket.send(JSON.stringify({
                    type: 'messages',
                    data: messages
                }));
            }

            // Обробка невідомої операції
            else {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Невідома операція'
                }));
            }

        } catch (error) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Некоректний формат JSON'
            }));
        }
    });

    // Обробка закриття з'єднання
    socket.on('close', () => {
        console.log('Клієнт відключився');
    });

    // Обробка помилок
    socket.on('error', (error) => {
        console.error('Помилка WebSocket:', error.message);
    });
});

// Функція розсилання повідомлень усім клієнтам
function broadcastMessages() {
    const response = JSON.stringify({
        type: 'messages',
        data: messages
    });

    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(response);
        }
    });
}
