# Setup Guide - Internship Management Portal (React.js)

## 🚀 Quick Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Step 1: Database Setup

1. **Open MySQL Workbench** or your preferred MySQL client
2. **Create the database**:
   ```sql
   CREATE DATABASE internship_portal;
   ```
3. **Run the schema**:
   - Copy the contents of `server/database.sql`
   - Execute it in your MySQL client

### Step 2: Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env` file and update with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=internship_portal
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   JWT_EXPIRE=24h
   PORT=5000
   NODE_ENV=development
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=16777216
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

### Step 3: Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the React app**:
   ```bash
   npm start
   ```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Demo Credentials

```
Student:  student1 / password123
Staff:    staff1 / password123
Admin:    admin / password123
```

## 📁 Project Structure

```
internship-portal-react/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── database.sql       # Database schema
│   ├── server.js          # Main server file
│   └── package.json
└── setup.md              # This file
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Port Already in Use**
   - Change port in `.env` file
   - Kill existing processes

3. **CORS Errors**
   - Check CORS configuration in `server.js`
   - Verify frontend URL

4. **File Upload Issues**
   - Check `uploads` directory permissions
   - Verify file size limits

## 🎯 Next Steps

1. **Explore the application** with demo credentials
2. **Customize the code** to match your requirements
3. **Add new features** as needed
4. **Deploy to production** when ready

## 📚 Learning Resources

- [React.js Documentation](https://reactjs.org/)
- [Material-UI Documentation](https://mui.com/)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

**Happy coding! 🚀**