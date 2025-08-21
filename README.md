# Luxoft Board Collab

A collaborative real-time board and chat application built with **MERN Stack + Socket.IO + Quill**.

---

## 🚀 Features
- Real-time chat with rooms
- Collaborative whiteboard (Quill editor)
- User list with avatars
- Instant room joining
- Persistent storage with MongoDB

---

## 📂 Project Structure
```
Luxoft-Board-collab/
├── client/    # Frontend (React + TailwindCSS)
├── server/    # Backend (Node.js + Express + MongoDB)
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
**_`git clone git@github.com:beereshbc/Luxoft-Board-collab.git`_**

### 2️⃣ Install dependencies  
Go inside both folders (`client` and `server`) and install:

**_`npm install`_**

### 3️⃣ Run the project (both frontend & backend)
**_`npm run dev`_**

This runs:
- React frontend on **http://localhost:3000/**
- Node.js backend on **http://localhost:4000/** (or configured port)

---

## 🛠️ Tech Stack
- **Frontend:** React, TailwindCSS, Socket.IO Client, React Router, Quill  
- **Backend:** Node.js, Express.js, Socket.IO, MongoDB, Mongoose  
- **Other Tools:** Context API, REST APIs  

---

## 👨‍💻 Usage
1. Enter your **Room ID** and **Username** on the homepage.  
2. Join the room and collaborate in **real-time**.  
3. Open `/users` to see the **active user list** instantly.  
4. Chat + Whiteboard sync live.  

---

## 💡 Commands Reference

- **Install dependencies** → **_`npm install`_**  
- **Run development server** → **_`npm run dev`_**  
- **Start backend only** → **_`npm start`_** inside `server/`  
- **Start frontend only** → **_`npm start`_** inside `client/`  

---

## 📜 License
MIT License © 2025 [Beeresh Kumar](https://github.com/beereshbc)
