# todobot
A central message management for bot-task's notice

## Configuration

Create `.env` file with following content

```txt
ACCOUNT=<yourusername>
PASSWORD=<yourpassword>
SECRET=<yoursecret>
PORT=<yourport>
```

Note:

- ACCOUNT: Username to login admin page.
- PASSWORD: Password to login admin page.
- SECRET: A identity string to verify message is correct.
- PORT: Your server port

Sample enviroment config in file `.env.sample`.

## Usage

Clone this repository and run a terminal in project directory.

```bash
$ npm i
$ npm run dev
```

Or in production, you can run:

```bash
$ node app.js
```

## Make message log

Make a GET request to `http://yourserver/emit` or `http://yourserver/emit/<youragentname>` with query:

- `agent`: your agent name
- `message`: your message
- `secret`: your secret that was registered in `.env` file.

You can pass secret into header `Authorization`.

```
Authorization: <yoursecret>
```

## LICENSE

MIT