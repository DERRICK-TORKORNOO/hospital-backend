### **📖 Hospital Backend API Documentation**

---

## **🏥 Overview**
The **Hospital Backend API** is a robust, scalable, and secure **microservice-based** system designed for managing patient-doctor interactions, medical notes, actionable treatment plans, and reminders. It integrates **Google Gemini AI** to generate **structured medical action plans**, ensuring **efficient treatment workflows**.

---

## **📌 Features**
✅ **User Management**  
- Signup/Login with role-based access control (**Patient/Doctor**).  
- Secure authentication using **JWT & Encrypted Password Storage**.  
- Profile Management & Role-based API Authorization.  

✅ **Doctor-Patient Management**  
- Patients can **select doctors** for consultation.  
- Doctors can **view their assigned patients**.  

✅ **Doctor Notes & AI-Generated Action Plans**  
- Doctors submit **encrypted** medical notes.  
- **Google Gemini AI** generates **Checklists & Treatment Plans**.  
- Plans include **medication schedules, lifestyle changes, & follow-up actions**.  

✅ **Reminders & Dynamic Scheduling**  
- Reminders for **daily medication, blood tests, lifestyle adjustments**.  
- **Automated scheduling** with flexible time gaps (e.g., **daily, weekly**).  
- Patients receive **checklist-based** and **plan-based** reminders.  

✅ **Logging & Monitoring**  
- Centralized **logging with Pino**.  
- Error handling for **AI failures, invalid data, & unauthorized access**.  

---

## **🚀 API Endpoints**
### **1️⃣ Authentication**
#### **🔹 User Signup**
`POST /api/auth/signup`  
Registers a new **Patient/Doctor**.  

**📥 Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword",
  "role": "patient"
}
```
**📤 Response:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "patient"
  }
}
```

#### **🔹 User Login**
`POST /api/auth/login`  
Logs in a user and returns a **JWT Token**.  

**📥 Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword"
}
```
**📤 Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "patient"
    }
  }
}
```

---

### **2️⃣ Doctor-Patient Management**
#### **🔹 Assign a Doctor to a Patient**
`POST /api/patient-doctor/assign`  

**📥 Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid"
}
```
**📤 Response:**
```json
{
  "success": true,
  "message": "Doctor assigned successfully."
}
```

#### **🔹 Get Patients Assigned to a Doctor**
`GET /api/patient-doctor/patients?doctorId=uuid`  

**📤 Response:**
```json
{
  "success": true,
  "message": "Patients retrieved successfully.",
  "data": [
    { "id": "uuid", "name": "Patient A", "email": "patientA@example.com" },
    { "id": "uuid", "name": "Patient B", "email": "patientB@example.com" }
  ],
  "meta": { "totalPatients": 2, "currentPage": 1, "nextPage": null }
}
```

---

### **3️⃣ Doctor Notes & Action Plans**
#### **🔹 Submit a Doctor Note**
`POST /api/doctor-notes/submit`  
Generates **AI-powered treatment plans** and **reminders**.  

**📥 Request Body:**
```json
{
  "doctorId": "uuid",
  "patientId": "uuid",
  "note": "Patient reports headaches and dizziness. BP: 150/95. Prescribed Amlodipine."
}
```
**📤 Response:**
```json
{
  "success": true,
  "message": "Doctor note submitted successfully.",
  "data": {
    "checklist": [
      "Start Atorvastatin (20mg daily)",
      "Buy blood pressure monitor"
    ],
    "plan": [
      "Reduce salt intake to less than 2g per day",
      "Increase physical activity (30 mins brisk walking daily)"
    ],
    "remindersScheduled": 4
  }
}
```

---

### **4️⃣ Reminders & Dynamic Scheduling**
#### **🔹 Get Patient Reminders**
`GET /api/reminders?patientId=uuid`  

**📤 Response:**
```json
{
  "success": true,
  "message": "Reminders retrieved successfully.",
  "data": [
    {
      "id": 1,
      "scheduleTime": "2025-02-15T06:35:34.708Z",
      "completed": false,
      "step": { "type": "plan", "description": "Reduce salt intake to less than 2g per day" }
    }
  ],
  "metadata": { "total": 10, "page": 1, "nextPage": 2 }
}
```

#### **🔹 Mark a Reminder as Completed**
`PATCH /api/reminders/complete`  

**📥 Request Body:**
```json
{
  "reminderId": 1,
  "patientId": "uuid"
}
```
**📤 Response:**
```json
{
  "success": true,
  "message": "Reminder completed successfully."
}
```

---

## **🔐 Security**
✅ **JWT Authentication**  
✅ **Encrypted Passwords (bcrypt)**  
✅ **End-to-End Encryption for Doctor Notes**  
✅ **Role-Based Access Control (RBAC)**  

---

## **🛠️ Tech Stack**
- **Backend:** Node.js, TypeScript, uWebSockets.js  
- **Database:** PostgreSQL (TypeORM ORM)  
- **Authentication:** JWT & bcrypt  
- **AI Processing:** Google Gemini Flash API  
- **Logging:** Pino Logger  

---

## **📌 How to Run Locally**
### **1️⃣ Clone Repository**
```bash
git clone https://github.com/your-repo/hospital-backend.git
cd hospital-backend
```

### **2️⃣ Setup Environment Variables**
Create a `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=hospital_db
JWT_SECRET=your_secret
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
ENCRYPTION_SECRET=your_encryption_secret
```

### **3️⃣ Install Dependencies**
```bash
yarn install
```

### **4️⃣ Run Migrations**
```bash
yarn build && yarn generate-migration && yarn apply-migration
```

### **5️⃣ Start Server**
```bash
yarn serve
```

---

## **🔍 API Testing**
### **Using cURL**
#### **🔹 Submit a Doctor Note**
```bash
curl -X POST http://localhost:3000/api/doctor-notes/submit \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "uuid",
    "patientId": "uuid",
    "note": "Patient reports high BP. Prescribed Amlodipine."
  }'
```

#### **🔹 Get Reminders**
```bash
curl -X GET "http://localhost:3000/api/reminders?patientId=uuid"
```

---

## **📜 License**
This project is **open-source** and licensed under **MIT**.

---

## **🤝 Contributing**
1. Fork the repository  
2. Create a feature branch (`git checkout -b feature-new`)  
3. Commit changes (`git commit -m "Added feature"`)  
4. Push (`git push origin feature-new`)  
5. Open a PR  

---

🚀 **Built for efficiency, security, and scalability!**  
🔥 **Start using the API today!**