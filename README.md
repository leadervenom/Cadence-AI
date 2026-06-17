# Cadence AI Event Management System

An AI-assisted event management system designed to manage protocol events, VIP hierarchy, seating arrangements, running orders, traffic flow, and event operations.

---

# Project Structure

```text
Cadence/

├── frontend/
│   └── index.html

├── src/
│   ├── server.js
│
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── vipRoutes.js
│   │   ├── aiRoutes.js
│   │   └── seatingRoutes.js
│
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── EventController.js
│   │   ├── VIPController.js
│   │   ├── AIController.js
│   │   └── SeatingController.js
│
│   ├── repositories/
│   │   ├── EventRepository.js
│   │   ├── VIPProfileRepository.js
│   │   ├── EventExtractionRepository.js
│   │   └── SeatingRepository.js
│
│   └── database/
│       └── db.js
```

---

# Module to Frontend Mapping

<table style="border-collapse: collapse; width:100%;">

<tr>

<th style="border:1px solid black; padding:8px;">
Sprint
</th>

<th style="border:1px solid black; padding:8px;">
Module
</th>

<th style="border:1px solid black; padding:8px;">
Frontend
</th>

<th style="border:1px solid black; padding:8px;">
Backend
</th>

<th style="border:1px solid black; padding:8px;">
Database
</th>

</tr>


<tr>

<td style="border:1px solid black; padding:8px;">
1
</td>

<td style="border:1px solid black; padding:8px;">
User Authentication
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

Login Page

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/AuthController.js">

AuthController.js

</a>

</li>

<li>

<a href="src/routes/authRoutes.js">

authRoutes.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

User Table

</td>

</tr>



<tr>

<td style="border:1px solid black; padding:8px;">
1
</td>

<td style="border:1px solid black; padding:8px;">
Event Management
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

Events Module

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/EventController.js">

EventController.js

</a>

</li>

<li>

<a href="src/routes/eventRoutes.js">

eventRoutes.js

</a>

</li>

<li>

<a href="src/repositories/EventRepository.js">

EventRepository.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

events

</td>

</tr>



<tr>

<td style="border:1px solid black; padding:8px;">
2
</td>

<td style="border:1px solid black; padding:8px;">
VIP Management
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

VIP Module

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/VIPController.js">

VIPController.js

</a>

</li>

<li>

<a href="src/routes/vipRoutes.js">

vipRoutes.js

</a>

</li>

<li>

<a href="src/repositories/VIPProfileRepository.js">

VIPProfileRepository.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

vip_profiles

</td>

</tr>



<tr>

<td style="border:1px solid black; padding:8px;">
2
</td>

<td style="border:1px solid black; padding:8px;">
Seating Arrangement
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

Seating Layout

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/SeatingController.js">

SeatingController.js

</a>

</li>

<li>

<a href="src/routes/seatingRoutes.js">

seatingRoutes.js

</a>

</li>

<li>

<a href="src/repositories/SeatingRepository.js">

SeatingRepository.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

seating_tables

</td>

</tr>



<tr>

<td style="border:1px solid black; padding:8px;">
3
</td>

<td style="border:1px solid black; padding:8px;">
Running Order
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

Running Order Module

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/EventController.js">

EventController.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

running_orders

</td>

</tr>



<tr>

<td style="border:1px solid black; padding:8px;">
3
</td>

<td style="border:1px solid black; padding:8px;">
AI Event Extraction
</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="frontend/index.html">

AI Workspace

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

<ul>

<li>

<a href="src/controllers/AIController.js">

AIController.js

</a>

</li>

<li>

<a href="src/routes/aiRoutes.js">

aiRoutes.js

</a>

</li>

<li>

<a href="src/repositories/EventExtractionRepository.js">

EventExtractionRepository.js

</a>

</li>

</ul>

</td>

<td style="border:1px solid black; padding:8px;">

event_extractions

</td>

</tr>

</table>

---

# Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL

### AI Module

- AI Event Extraction Engine
- Event Information Parser
- Seating Recommendation Logic

---

# Features

- User Login and Authentication
- Event Creation and Management
- VIP Hierarchy Management
- Seating Arrangement Generator
- Running Order Management
- AI Event Extraction
- Traffic Flow Planning
- Emergency Override System

---

# Running The Project

### Install Dependencies

```bash
npm install
```

### Start Backend

```bash
node src/server.js
```

### Open Frontend

```text
http://localhost:3000/index.html
```

---

# Authors

**Cadence AI Event Management System**

Bachelor of Software Engineering (Honours)

Universiti Teknologi Malaysia