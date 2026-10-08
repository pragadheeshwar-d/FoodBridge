"""
Initialize the FoodBridge database and seed the default admin account.
"""

from bcrypt import gensalt, hashpw

from app import create_app
from extensions import db
from models import User

app = create_app()


def _hash(password: str) -> str:
    return hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')


with app.app_context():
    db.create_all()

    admin = User.query.filter_by(email='admin@foodbridge.com').first()
    if not admin:
        admin = User(
            name='FoodBridge Admin',
            email='admin@foodbridge.com',
            password=_hash('Admin@123'),
            role='admin',
            organization='FoodBridge',
            verified=True,
            status='approved',
        )
        db.session.add(admin)
        db.session.commit()
        print('Admin user created: admin@foodbridge.com / Admin@123')
    else:
        print('Admin user already exists.')
