from app import app, db, User
from werkzeug.security import generate_password_hash

def setup_database():
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if users already exist
        if User.query.first() is None:
            # Create sample users
            users = [
                {
                    'username': 'student1',
                    'email': 'student1@example.com',
                    'password': 'password123',
                    'role': 'student'
                },
                {
                    'username': 'student2',
                    'email': 'student2@example.com',
                    'password': 'password123',
                    'role': 'student'
                },
                {
                    'username': 'staff1',
                    'email': 'staff1@example.com',
                    'password': 'password123',
                    'role': 'staff'
                },
                {
                    'username': 'staff2',
                    'email': 'staff2@example.com',
                    'password': 'password123',
                    'role': 'staff'
                },
                {
                    'username': 'admin',
                    'email': 'admin@example.com',
                    'password': 'password123',
                    'role': 'superadmin'
                }
            ]
            
            for user_data in users:
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    password_hash=generate_password_hash(user_data['password']),
                    role=user_data['role']
                )
                db.session.add(user)
            
            db.session.commit()
            print("Sample users created successfully!")
            print("\nLogin credentials:")
            print("Students: student1/password123, student2/password123")
            print("Staff: staff1/password123, staff2/password123")
            print("Admin: admin/password123")
        else:
            print("Database already contains users.")

if __name__ == '__main__':
    setup_database()