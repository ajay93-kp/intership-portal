from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import json
from ml_utils import ml_utils

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///internship.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # student, staff, superadmin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Internship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, completed
    proof_file = db.Column(db.String(200))
    certificate_file = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationship
    student = db.relationship('User', foreign_keys=[student_id], backref='internships')

class ProgressUpdate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    internship_id = db.Column(db.Integer, db.ForeignKey('internship.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=False)
    sentiment_score = db.Column(db.Float)  # ML sentiment analysis score
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    evaluated_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    evaluation = db.Column(db.String(20))  # good, satisfactory, needs_improvement

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'student':
        internships = Internship.query.filter_by(student_id=current_user.id).all()
        return render_template('student_dashboard.html', internships=internships)
    elif current_user.role == 'staff':
        pending_internships = Internship.query.filter_by(status='pending').all()
        return render_template('staff_dashboard.html', pending_internships=pending_internships)
    else:  # superadmin
        all_internships = Internship.query.all()
        return render_template('admin_dashboard.html', all_internships=all_internships)

@app.route('/apply_internship', methods=['GET', 'POST'])
@login_required
def apply_internship():
    if current_user.role != 'student':
        flash('Only students can apply for internships')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        company_name = request.form['company_name']
        position = request.form['position']
        start_date = datetime.strptime(request.form['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(request.form['end_date'], '%Y-%m-%d').date()
        
        # Handle file upload
        proof_file = request.files['proof_file']
        if proof_file:
            filename = secure_filename(proof_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            proof_file.save(filepath)
        else:
            filename = None
        
        internship = Internship(
            student_id=current_user.id,
            company_name=company_name,
            position=position,
            start_date=start_date,
            end_date=end_date,
            proof_file=filename
        )
        
        db.session.add(internship)
        db.session.commit()
        flash('Internship application submitted successfully!')
        return redirect(url_for('dashboard'))
    
    return render_template('apply_internship.html')

@app.route('/approve_internship/<int:internship_id>')
@login_required
def approve_internship(internship_id):
    if current_user.role not in ['staff', 'superadmin']:
        flash('Unauthorized access')
        return redirect(url_for('dashboard'))
    
    internship = Internship.query.get_or_404(internship_id)
    internship.status = 'approved'
    internship.approved_by = current_user.id
    db.session.commit()
    flash('Internship approved!')
    return redirect(url_for('dashboard'))

@app.route('/reject_internship/<int:internship_id>')
@login_required
def reject_internship(internship_id):
    if current_user.role not in ['staff', 'superadmin']:
        flash('Unauthorized access')
        return redirect(url_for('dashboard'))
    
    internship = Internship.query.get_or_404(internship_id)
    internship.status = 'rejected'
    internship.approved_by = current_user.id
    db.session.commit()
    flash('Internship rejected!')
    return redirect(url_for('dashboard'))

@app.route('/update_progress/<int:internship_id>', methods=['GET', 'POST'])
@login_required
def update_progress(internship_id):
    internship = Internship.query.get_or_404(internship_id)
    
    if current_user.id != internship.student_id:
        flash('Unauthorized access')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        week_number = request.form['week_number']
        description = request.form['description']
        
        # ML-powered sentiment analysis
        sentiment_score = ml_utils.analyze_sentiment(description)
        
        progress = ProgressUpdate(
            internship_id=internship_id,
            week_number=week_number,
            description=description,
            sentiment_score=sentiment_score
        )
        
        db.session.add(progress)
        db.session.commit()
        flash('Progress update submitted!')
        return redirect(url_for('dashboard'))
    
    return render_template('update_progress.html', internship=internship)

@app.route('/evaluate_progress/<int:progress_id>', methods=['POST'])
@login_required
def evaluate_progress(progress_id):
    if current_user.role not in ['staff', 'superadmin']:
        flash('Unauthorized access')
        return redirect(url_for('dashboard'))
    
    progress = ProgressUpdate.query.get_or_404(progress_id)
    evaluation = request.form['evaluation']
    
    progress.evaluation = evaluation
    progress.evaluated_by = current_user.id
    db.session.commit()
    
    flash('Progress evaluated!')
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)