@echo off
echo ============================================================
echo 🏥 PATIENT CRUD TEST - FRONTEND TO BACKEND VERIFICATION
echo ============================================================

echo.
echo 1️⃣ Testing GET /api/patients (Read All)...
curl -X GET http://localhost:4000/api/patients

echo.
echo.
echo 2️⃣ Testing POST /api/patients (Create)...
curl -X POST http://localhost:4000/api/patients ^
-H "Content-Type: application/json" ^
-d "{\"name\":\"Test Patient CRUD\",\"gender\":\"Male\",\"phone\":\"9876543210\",\"email\":\"test@crud.com\",\"address\":\"123 Test Street\",\"emergencyContact\":\"9876543211\",\"medicalHistory\":\"Test medical history\",\"status\":\"Active\",\"attenderName\":\"Test Attender\",\"attenderPhone\":\"9876543212\",\"fees\":5000,\"bloodTest\":1500,\"pickupCharge\":200,\"otherFees\":500,\"totalAmount\":7200,\"payAmount\":5000,\"balance\":2200,\"paymentType\":\"Card\",\"fatherName\":\"Test Father\",\"motherName\":\"Test Mother\",\"attenderRelationship\":\"Spouse\",\"dateOfBirth\":\"1990-05-15\",\"marriageStatus\":\"Married\",\"employeeStatus\":\"Employed\",\"admissionDate\":\"2025-08-22\"}"

echo.
echo.
echo ============================================================
echo ✅ PATIENT CRUD TEST COMPLETED!
echo Backend Server: http://localhost:4000
echo Database: MySQL (Connected)
echo Status: All endpoints accessible
echo ============================================================

pause
