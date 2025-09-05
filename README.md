# **MyFuel Transaction Processing Service**

This project is a NestJS implementation of the **MyFuel Transaction Processing Service**, developed as part of a technical assessment. It exposes a secure and reliable webhook endpoint to process fuel card transactions from petrol stations in real time.  
The implementation is based on a detailed [**System Design Document**](./MyFuelTransactionProcessingService.pdf), which includes the system architecture, ERD, and data flow diagrams.

## **✨ Features**

* **Idempotent Webhook Endpoint**: Prevents duplicate transaction processing using an Idempotency-Key.  
* **Atomic Transactions**: Ensures data integrity by processing all database updates (balance deduction, limit counter updates) in a single, atomic transaction.  
* **Timezone-Aware Limits**: Correctly calculates and resets daily/monthly card spending limits based on each organization's specific timezone.  
* **Secure by Design**: Validates incoming requests using an HMAC-SHA256 signature to ensure authenticity and prevent tampering.  
* **Automated API Documentation**: Interactive API documentation is available via Swagger (OpenAPI) at the /api-docs endpoint.  
* **Unit Tested**: Core business logic is covered by unit tests to ensure reliability and prevent regressions.  
* **Configuration Driven**: All sensitive information and environment-specific settings are managed via environment variables.

## **Prerequisites**

Before you begin, ensure you have the following installed on your local machine:

* [Node.js](https://nodejs.org/) (v18 or later recommended)  
* [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)  
* [PostgreSQL](https://www.postgresql.org/) (v14 or later recommended)  
* A database client like [pgAdmin](https://www.pgadmin.org/) or [DBeaver](https://dbeaver.io/)

## **🚀 Getting Started**

Follow these steps to get the project up and running locally.

### **1\. Clone the Repository**

git clone \[https://github.com/ashrafipoor/myfuel.git\](https://github.com/ashrafipoor/myfuel.git)  
cd myfuel

### **2\. Install Dependencies**

npm install

### **3\. Set Up the Database**

You must create the PostgreSQL database manually before starting the application.  
\-- Connect to your PostgreSQL instance and run:  
CREATE DATABASE myfuel\_db;

### **4\. Configure Environment Variables**

Create a .env file in the root of the project by copying the example file.  
cp .env.example .env

Now, open the .env file and fill in your specific database credentials and a secure webhook secret.  
\# PostgreSQL Configuration  
DB\_HOST=localhost  
DB\_PORT=5432  
DB\_USERNAME=postgres  
DB\_PASSWORD=your\_secret\_db\_password  
DB\_DATABASE=myfuel\_db

\# Webhook Security  
WEBHOOK\_SECRET\_KEY=your-super-secret-key-shared-with-petrol-stations

## **🏃‍♂️ Running the Application**

### **Development Mode**

To run the application in watch mode (restarts on file changes):  
npm run start:dev

The application will be available at http://localhost:3000.

### **Production Mode**

To build and run the application for production:  
npm run build  
npm run start:prod

## **🧪 Running Tests**

To run the unit tests:  
npm run test

## **📖 API Documentation**

Once the application is running, you can access the interactive Swagger UI documentation at:  
[**http://localhost:3000/api-docs**](https://www.google.com/search?q=http://localhost:3000/api-docs)  
From this page, you can view detailed information about the webhook endpoint and even send test requests.

### **Example API Request (cURL)**

Here is an example of how to call the webhook endpoint using cURL.  
**Note:** You must generate a valid signature for each request.  
\# 1\. Set variables  
TIMESTAMP=$(date \+%s%3N)  
BODY='{"cardNumber":"4111222233334444","amount":47.50,"txnAtUtc":"2025-09-05T10:00:00Z","stationId":"ST-92810"}'  
SECRET="your-super-secret-key-shared-with-petrol-stations"

\# 2\. Generate HMAC-SHA256 signature  
PAYLOAD="${TIMESTAMP}.${BODY}"  
SIGNATURE=$(echo \-n "$PAYLOAD" | openssl dgst \-sha256 \-hmac "$SECRET" \-binary | xxd \-p \-c 256\)

\# 3\. Make the request  
curl \-X POST http://localhost:3000/v1/transactions/webhook/fuel-transactions \\  
\-H "Content-Type: application/json" \\  
\-H "Idempotency-Key: $(uuidgen)" \\  
\-H "X-Signature-Timestamp: $TIMESTAMP" \\  
\-H "X-Signature: $SIGNATURE" \\  
\-d "$BODY"

## **🏗️ Project Structure**

The project follows a standard NestJS modular architecture:

* src/  
  * main.ts: The application entry point.  
  * app.module.ts: The root module of the application.  
  * transactions/: Contains all logic for processing transactions (controller, service, entities).  
  * cards/: Contains the Card entity and its related logic.  
  * organizations/: Contains entities for Organization, OrgBalance, etc.  
  * shared/: Contains reusable components like guards.