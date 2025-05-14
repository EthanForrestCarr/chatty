# 💬 Chatty

**Chatty** is a simple, real-time chat application built with **Next.js**, **Socket.IO**, and **PostgreSQL**. It supports one-on-one conversations and lays the foundation for scalable, modern communication features.

---

## 🚀 Features

- ⚡ Real-time messaging via Socket.IO
- 🔒 Auth with NextAuth.js
- 🗃️ PostgreSQL + Prisma ORM
- 🧪 Unit testing with Jest
- 🌱 Seeded development environment
- 🔧 Scalable architecture for future growth

---

## 🛠️ Setup & Onboarding

### 1. Clone & Install

```bash
git clone https://github.com/your-org/chatty.git
cd chatty
npm install
```

### 2. Environment Variables

Copy the example environment config and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
# SOCKET_URL= (optional if different from NEXTAUTH_URL)
# Add any other required variables
```

> ✅ Ensure `.env` is included in `.gitignore`.

---

### 3. Database Setup

Run the following to initialize your development database:

```bash
npm run migrate:dev     # Apply new Prisma migrations
npm run migrate:reset   # Reset the database (WARNING: deletes all data)
npm run seed            # Seed the database with demo data
```

---

### 4. Run the App

Start the local development server:

```bash
npm run dev
```

Open your browser at: [http://localhost:3000](http://localhost:3000)

---

### 5. Run Tests

Execute all available tests:

```bash
npm test
```

Jest will run any available API route or utility tests.

---

## 🧾 NPM Scripts

| Script          | Description                      |
| --------------- | -------------------------------- |
| `dev`           | Start Next.js development server |
| `build`         | Create a production build        |
| `start`         | Run the production build         |
| `migrate:dev`   | Run Prisma migrations            |
| `migrate:reset` | Reset the database               |
| `seed`          | Seed the database                |
| `test`          | Run Jest tests                   |

---

## 🧭 Future Development

### UX / UI

- ✅ Message reactions & emoji picker
- ✅ Edit messages & undo delete grace period
- ✅ Attachment support (S3 or custom backend)
- ✅ Fully responsive mobile UI

### Features & Scaling

- ✅ Group chats & channels
- ✅ Read receipts & "last seen" timestamps
- ✅ Web push notifications
- ✅ Redis adapter for horizontal scaling

### DevOps & Quality

- ✅ E2E tests with Playwright
- ✅ CI/CD (GitHub Actions + Vercel)
- ✅ Monitoring with Sentry / Logflare

### Long-Term Roadmap

- 🔐 End-to-end encryption (E2EE)
- 🎥 Voice & video calling (WebRTC)
- 🧠 AI-powered features (summaries, moderation, etc.)

---

## 📄 License

[MIT](./LICENSE)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

## 🧑‍💻 Built With

- [Next.js](https://nextjs.org/)
- [Socket.IO](https://socket.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma](https://www.prisma.io/)
- [Jest](https://jestjs.io/)
