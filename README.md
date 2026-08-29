# GameCraft AI — Telegram Bot + Mini App

Это рабочая связка:

Telegram-бот → выбор механики → кнопка «▶ Играть в Telegram» → Telegram Mini App.

## Что реально готово

- бот запускается локально через Node.js + Telegraf;
- анализирует свободный запрос;
- предлагает 23 игровые семьи;
- формирует Game DNA;
- после выбора создаёт кнопку запуска Mini App;
- **Memory** имеет полноценный интерактивный renderer:
  - 12 карточек / 6 смысловых пар;
  - случайное перемешивание;
  - проверка пары;
  - обратная связь;
  - очки;
  - ходы;
  - финал;
  - новая партия.
- остальные 22 семьи пока не выданы за готовые Mini Apps: оболочка честно сообщает, что renderer ещё не подключён.

## Почему нужен GitHub Pages

Telegram Mini App открывается по HTTPS URL. Локальный `C:\...` или `localhost` в кнопке Telegram использовать нельзя для обычного пользовательского запуска.

### Бесплатное размещение

1. Создайте репозиторий GitHub, например:
   `GameCraft-Telegram-MiniApp`
2. Загрузите содержимое этого проекта.
3. GitHub → Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main`, folder `/ (root)`.
6. После публикации адрес Mini App будет примерно:

`https://ВАШ_ЛОГИН.github.io/GameCraft-Telegram-MiniApp/miniapp/`

## Настройте `.env`

```env
TELEGRAM_BOT_TOKEN=ВАШ_НОВЫЙ_ТОКЕН
MINI_APP_URL=https://ВАШ_ЛОГИН.github.io/GameCraft-Telegram-MiniApp/miniapp/
```

## Запуск бота

```cmd
npm install
npm run dev
```

## BotFather

Для основной Mini App можно также включить приложение через:

`/mybots` → ваш бот → **Bot Settings** → **Configure Mini App** → **Enable Mini App**

и указать тот же HTTPS URL.

Для кнопки, которую отправляет текущий код бота, достаточно корректного `MINI_APP_URL` в `.env`.

## Тест

В Telegram:

`/start`

Запрос:

`Я учитель немецкого языка. 6 класс, A1. Тема Essen. Нужно закрепить лексику и аудирование за 20 минут. Не хочу обычный тест.`

Выберите **Memory**.

Должна появиться кнопка:

`▶️ Играть в Telegram`

Нажмите её — откроется игровое поле внутри Telegram.
