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
<table style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th style="border: 1px solid #dddddd; padding: 12px; text-align: left;">Sprint</th>
      <th style="border: 1px solid #dddddd; padding: 12px; text-align: left;">Module</th>
      <th style="border: 1px solid #dddddd; padding: 12px; text-align: left;">Frontend</th>
      <th style="border: 1px solid #dddddd; padding: 12px; text-align: left;">Backend</th>
      <th style="border: 1px solid #dddddd; padding: 12px; text-align: left;">Database</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">1</td>
      <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">User Authentication</td>
      <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><a href="frontend/index.html">Login Page</a></li>
        </ul>
      </td>
      <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><a href="src/controllers/AuthController.js">AuthController.js</a></li>
          <li><a href="src/routes/authRoutes.js">authRoutes.js</a></li>
        </ul>
      </td>
      <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">user_table</td>
    </tr>

  <tr>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">1</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">Event Management</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="frontend/index.html">Events Module</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="src/controllers/EventController.js">EventController.js</a></li>
        <li><a href="src/routes/eventRoutes.js">eventRoutes.js</a></li>
        <li><a href="src/repositories/EventRepository.js">EventRepository.js</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">events</td>
  </tr>

  <tr>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">2</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">VIP Management</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="frontend/index.html">VIP Module</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="src/controllers/VIPController.js">VIPController.js</a></li>
        <li><a href="src/routes/vipRoutes.js">vipRoutes.js</a></li>
        <li><a href="src/repositories/VIPProfileRepository.js">VIPProfileRepository.js</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">vip_profiles</td>
  </tr>

  <tr>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">2</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">Seating Arrangement</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="frontend/index.html">Seating Layout</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="src/controllers/SeatingController.js">SeatingController.js</a></li>
        <li><a href="src/routes/seatingRoutes.js">seatingRoutes.js</a></li>
        <li><a href="src/repositories/SeatingRepository.js">SeatingRepository.js</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">seating_tables</td>
  </tr>

  <tr>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">3</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">Running Order</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="frontend/index.html">Running Order Module</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="src/controllers/EventController.js">EventController.js</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">running_orders</td>
  </tr>

  <tr>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">3</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-weight: bold;">AI Event Extraction</td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="frontend/index.html">AI Workspace</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top;">
      <ul style="margin: 0; padding-left: 20px;">
        <li><a href="src/controllers/AIController.js">AIController.js</a></li>
        <li><a href="src/routes/aiRoutes.js">aiRoutes.js</a></li>
        <li><a href="src/repositories/EventExtractionRepository.js">EventExtractionRepository.js</a></li>
      </ul>
    </td>
    <td style="border: 1px solid #dddddd; padding: 12px; vertical-align: top; font-family: monospace;">event_extractions</td>
  </tr>
  </tbody>
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