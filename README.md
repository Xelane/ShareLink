# ShareLink 🔗

A full-stack secure file-sharing platform that lets users upload files, generate short links, protect downloads with passwords, set expiry times, and track download stats — all backed by AWS.


## ✨ Features

- 🔒 **Password-protected downloads**
- ⏳ **Expiring links** (1–168 hours)
- 🗂️ **Multi-file uploads** (auto-zipped)
- 📦 **30MB max upload, 5 files limit**
- 🧾 **Download stats + metadata**
- 👤 **User-authenticated dashboard**
- 📱 **QR code support for links**
- ⚡ **Fast, clean URLs like `domain.com/abc123`**
- ☁️ **AWS-backed** with S3 and DynamoDB
- 🐳 **Docker-ready**

## 🛠️ Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Heroicons

### Backend
- Spring Boot (Java 17)
- AWS SDK v2 (S3 + DynamoDB)
- Amazon Cognito (user auth)
- BCrypt (for secure passwords)
- ZXing (QR Code generation)

### Infrastructure
- AWS S3 — File storage
- AWS DynamoDB — Link metadata
- AWS Lambda — Periodic S3 cleanup
- Docker (optional)

## 🚀 Usage

### 1. Uploading Files
- Upload 1–5 files (max 30MB total)
- Set expiry duration (default: 24h)
- Optionally add a password
- Get a short link + QR code

### 2. Downloading
- Visit the short link (e.g., `/abc123`)
- Enter password (if required)
- Auto-download file or zip

### 3. Authenticated Users
- Log in with Cognito
- View and manage uploads
- Delete your own links

## 📦 Deployment

### Backend
```bash
./mvnw clean package
java -jar target/sharelink-backend.jar
```

Or using Docker:
```bash
docker build -t sharelink .
docker run -p 8080:8080 sharelink
```

### Frontend
```bash
npm install
npm run build
```
Copy `dist/` to Spring Boot’s `src/main/resources/static` or deploy via Netlify/Vercel.

## 📁 AWS Setup (Required)
Ensure these resources are configured:

- ✅ S3 Bucket (`sharelink-bucket`)
- ✅ DynamoDB Table (`ShareLinks`)
- ✅ Cognito User Pool + App Client
- ✅ Lambda cleanup function (optional but recommended)

Secrets like AWS credentials and pool IDs should be stored in `application.properties` (excluded via `.gitignore`).

## 📷 Screenshots (Pending)

## 📄 License

This project is released under the [MIT License](LICENSE).

## 🙌 Acknowledgements

- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
- [ZXing QR Generator](https://github.com/zxing)
- [AWS SDK for Java](https://docs.aws.amazon.com/sdk-for-java/)
