# 🏔️ Raibar Homestay — RAG-Powered Hospitality & AI Concierge Platform

An end-to-end full-stack hospitality booking platform and **In-Browser Document RAG (Retrieval-Augmented Generation)** system built with **Angular 19 Standalone, TypeScript, and Google Gemini 1.5 Flash**.

Designed for **Raibar Homestay** in Nagar Panchayat Kainyur, Thalisain, Pauri Garhwal, Uttarakhand.

---

## 🧠 Proper Document RAG Architecture

```text
[ Admin Uploads PDF / DOCX / TXT ] ──► [ Semantic Text Splitter (Paragraphs, Overlap) ]
                                                        │
                                                        ▼
                                       [ Indexed Knowledge Chunks & Keywords ]
                                                        │
                                                        ▼
[ Guest Asks Question ] ────────────────────────────────┼─────────────────────────────────┐
       │                                                ▼                                 ▼
       ▼                                    [ Semantic Token Match ]             [ Exact Phrase Bonus ]
       │                                    (Title, Category, Body)              (Stopwords Filtered)
       │                                                │                                 │
       │                                                └────────────────┬────────────────┘
       │                                                                 ▼
       ▼                                                 [ Top-K Ranked Context Chunks ]
[ Conversational Persona & Guardrails ] ◄──────────────── [ + Live Room & Trip Inventory ]
("Answer warmly like a Pahadi host using facts")
       │
       ▼
[ Grounded Generation via Gemini 1.5 Flash ] ──► Natural Conversational Answer + Verifiable Citations
                                                  [📄 Raibar_Homestay_Policies.pdf · 95% match]
```

---

## ✨ Key System Features

### 1. 📄 Dedicated AI Knowledge Base & Document Uploader (`/admin/knowledge`)
* **Drag & Drop PDF Uploader**: Upload `.pdf`, `.txt`, `.md`, or `.doc` files directly from your computer.
* **Automatic Document Slicing**: Slices long policies, trek guidelines, and house rules into clean, overlapping knowledge chunks with ID tags (`CHK-DOC-1-1`, etc.).
* **Active Knowledge Library**: View all memorized files with file size, chunk count, and a **"View Chunks ▾"** accordion to inspect the exact text the AI learned.
* **1-Click Policy Loader**: Includes sample Garhwal winter bonfire and trekking policy documents for instant testing.
* **Live Retrieval Inspector**: Test customer queries in real-time to see which chunks are retrieved and their match confidence percentage.

### 2. 🤖 Conversational AI Receptionist (Customer Experience)
* **Warm Pahadi Host Persona**: Greets guests with authentic Garhwali hospitality, understanding English, Hindi, and Hinglish.
* **Smart Group & Tariff Calculator**: Automatically computes room requirements (max 2 guests per room) and total pricing across multiple nights for any group size.
* **100% Grounded in Uploaded Documents**: When answering about rules, meals, or trekking, it grounds its speech strictly in your uploaded PDFs.
* **Verifiable Source Citations**: Displays clickable source badges (e.g. `[📄 Garhwal_Temple_Trek_Guide.pdf · 94% match]`).
* **Direct Booking Actions**: Displays instant action buttons (*"Book a Room →"* or *"Explore Temple Packages →"*) guiding guests straight to checkout.
* **Google Gemini 1.5 Flash Integration**: Connected to Google's latest generative AI for dynamic, ChatGPT-level conversation.

### 3. 🏨 Complete Homestay Business Management (Admin Panel)
* **Dashboard (`/admin/dashboard`)**: Live occupancy stats, revenue tracking, pending booking alerts, and today's arrivals/departures.
* **Rooms & Inventory (`/admin/rooms`)**: Manage room descriptions, nightly tariffs, tags, and maintenance date blocking.
* **Bookings & Calendar (`/admin/bookings`)**: Accept/Reject booking requests, prevent double bookings, and generate automated WhatsApp confirmation links.
* **Temple Trips (`/admin/trips`)**: Manage 2-day, 5-day, and 7-day guided yatra packages (Deeba Mandir, Binsar Mahadev) with departure schedules.
* **Website Content & Reviews (`/admin/content`)**: Update homepage hero text, manage gallery photos, and approve/hide guest reviews.
* **Payments (`/admin/payments`)**: Record advance payments, generate customer UPI payment links, and track pending balances.

---

## ⚡ Quick Start

### 1. Install & Run Locally
```bash
git clone https://github.com/vivekrawat524/raibarhomestay.git
cd raibarhomestay
npm install
npm start
```
* **Customer Website & AI Concierge**: [http://localhost:4200](http://localhost:4200)
* **Admin Knowledge Base & Uploader**: [http://localhost:4200/admin/knowledge](http://localhost:4200/admin/knowledge)
  *(Default Login — Email: `admin@raibar.com` | Password: `admin`)*

---

## 🚀 Vercel Deployment

This project runs **100% client-side inside Angular 19** with zero external backend or database dependencies.

* **Vercel Build Command**: `npm run build`
* **Output Directory**: `dist/raibarhomestay/browser`
* **Route Rewrites**: Pre-configured in [`vercel.json`](./vercel.json) for seamless SPA navigation.

Push to your `main` branch to trigger an automatic deployment:
```bash
git add .
git commit -m "feat: update knowledge base and documentation"
git push origin main
```

---

## 🛠️ Tech Stack

* **Frontend Framework**: Angular 19 (Standalone Components, Signals, Reactive State)
* **Styling**: SCSS (Scoped modern CSS variables, responsive mobile-first layouts)
* **AI & RAG Engine**: Google Gemini 1.5 Flash + Custom In-Browser Document Chunker & Semantic Retriever
* **Routing & Hosting**: Angular Router + Vercel SPA Edge Network
