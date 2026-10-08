from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_cors import CORS
try:
    from flask_migrate import Migrate
except ImportError:
    class Migrate:  # type: ignore[no-redef]
        def init_app(self, *args, **kwargs):
            return None

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*")
migrate = Migrate()
