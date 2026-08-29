# GameCraft AI — Telegram Mini App

В этой версии GitHub Pages открывает ИГРУ сразу по корневому адресу:

https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/

То есть больше нет перехода через README и нет зависимости от `/miniapp/`.

## После распаковки

1. В `.env` замените только `PASTE_YOUR_NEW_TOKEN_HERE` на ваш новый токен.
2. Загрузите ВСЕ файлы из этой папки в корень репозитория `GameCraft-Telegram-MiniApp`, заменив старые.
3. Дождитесь публикации GitHub Pages.
4. Проверьте в обычном браузере:
   https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/
   — должна сразу открыться Memory-игра.
5. В VS Code:
   npm install
   npm run dev
6. В Telegram выберите Memory → ▶ Играть.

## Важно

Корневые файлы `index.html`, `styles.css`, `app.js` — это сама игра.
README больше не является стартовой страницей.
