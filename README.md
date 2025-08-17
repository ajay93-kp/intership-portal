# Internship Management Portal

A simple yet effective internship management system built with Flask and basic Machine Learning features. Perfect for 3rd-year CSE students who want to build a practical project with ML integration.

## Features

### Core Features
- **User Authentication**: Students, Staff, and Super Admin roles
- **Internship Applications**: Students can apply with company details and proof documents
- **Approval System**: Staff can approve or reject internship applications
- **Progress Tracking**: Weekly progress updates with ML-powered sentiment analysis
- **Document Management**: Upload and manage certificates and proof documents
- **Dashboard**: Role-specific dashboards with visual analytics

### Machine Learning Features
- **Sentiment Analysis**: Analyzes student progress updates for emotional tone
- **Progress Classification**: Automatically categorizes progress quality
- **Keyword Extraction**: Identifies important terms in progress reports

## Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite (easy to set up)
- **Frontend**: HTML, CSS, JavaScript with Bootstrap
- **ML Libraries**: NLTK, scikit-learn
- **Authentication**: Flask-Login

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Setup Database
```bash
python setup_db.py
```

### 3. Run the Application
```bash
python app.py
```

### 4. Access the Application
Open your browser and go to: `http://localhost:5000`

## Login Credentials

After running `setup_db.py`, you can use these credentials:

### Students
- Username: `student1` | Password: `password123`
- Username: `student2` | Password: `password123`

### Staff
- Username: `staff1` | Password: `password123`
- Username: `staff2` | Password: `password123`

### Super Admin
- Username: `admin` | Password: `password123`

## How to Use

### For Students
1. Login with student credentials
2. Click "Apply Internship" to submit a new application
3. Upload proof documents (offer letter, etc.)
4. Once approved, submit weekly progress updates
5. Upload completion certificate when finished

### For Staff
1. Login with staff credentials
2. Review pending internship applications
3. Approve or reject applications
4. Evaluate weekly progress updates
5. Monitor student progress through dashboard

### For Super Admin
1. Login with admin credentials
2. Monitor all activities across the system
3. View comprehensive analytics
4. Manage users and system settings

## Machine Learning Features Explained

### 1. Sentiment Analysis
- Uses NLTK VADER sentiment analyzer
- Analyzes weekly progress updates
- Provides sentiment scores (-1 to +1)
- Helps staff identify students who might need support

### 2. Progress Classification
- Keyword-based classification system
- Categorizes updates as: 'good', 'satisfactory', 'needs_improvement'
- Uses simple word frequency analysis
- Easy to understand and modify

### 3. Keyword Extraction
- Identifies important terms in progress reports
- Removes common stop words
- Helps in quick content analysis

## Project Structure

```
internship-portal/
├── app.py                 # Main Flask application
├── ml_utils.py           # Machine learning utilities
├── setup_db.py           # Database setup script
├── requirements.txt      # Python dependencies
├── README.md            # This file
├── templates/           # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   └── ...
├── static/              # CSS, JS, images
└── uploads/             # File uploads directory
```

## Customization Ideas

### Easy Enhancements
1. **Email Notifications**: Add email alerts for approvals/rejections
2. **File Validation**: Add file type and size validation
3. **Search Functionality**: Add search for internships and users
4. **Export Reports**: Generate PDF/Excel reports

### Advanced ML Features
1. **Document Classification**: Automatically categorize uploaded documents
2. **Fraud Detection**: Identify potentially fake certificates
3. **Performance Prediction**: Predict internship success based on early indicators
4. **Recommendation System**: Suggest relevant internships to students

## Learning Outcomes

This project will help you learn:
- **Web Development**: Flask framework, HTML/CSS, JavaScript
- **Database Design**: SQLAlchemy ORM, database relationships
- **User Authentication**: Session management, role-based access
- **File Handling**: Upload, storage, and retrieval
- **Machine Learning**: Text analysis, sentiment analysis, classification
- **API Design**: RESTful routes and data handling

## Troubleshooting

### Common Issues
1. **Import Errors**: Make sure all dependencies are installed
2. **Database Errors**: Run `setup_db.py` to initialize the database
3. **File Upload Issues**: Ensure the `uploads` directory exists
4. **ML Library Errors**: Install NLTK data: `python -c "import nltk; nltk.download('vader_lexicon')"`

### Getting Help
- Check the Flask documentation: https://flask.palletsprojects.com/
- NLTK documentation: https://www.nltk.org/
- Bootstrap documentation: https://getbootstrap.com/

## Future Improvements

1. **Real-time Notifications**: WebSocket integration
2. **Mobile App**: React Native or Flutter app
3. **Advanced Analytics**: More sophisticated ML models
4. **Cloud Deployment**: Deploy to AWS, Google Cloud, or Heroku
5. **API Development**: RESTful API for mobile apps

---

**Note**: This is a learning project designed to be simple yet functional. It demonstrates basic web development concepts and introductory machine learning applications.