import os
import configparser
from dotenv import load_dotenv
from celery.schedules import crontab

PROJECT_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(PROJECT_DIR, '.env'))

class Config(object):
    TESTING = False
    DB_SERVER = 'mzk-postgres'
    DB_NAME = 'mzkdata' #Production ready
    
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}/{self.DB_NAME}"
    
class ProductionConfig(Config):
    MZK_IP = os.environ.get('MZK_IP', '10.223.1.8')
    SRC_FOLDER = os.environ.get('SRC_FOLDER')
    DST_FOLDER = os.environ.get('DST_FOLDER') 
    DB_USER = 'postgres' #Production ready
    DB_SERVER = 'mzk-postgres'
    DB_PASSWORD = 'password' #Production ready
    SMB_USER = os.environ.get('SMB_USER') #Production ready
    SMB_PASSWORD = os.environ.get('SMB_PASSWORD') #Production ready

    CELERY = dict(
        broker_url = "redis://mzk-redis:6379/0",
        result_backend = f"db+postgresql://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/mzkdata",
        task_track_started = True,
        timezone = "Europe/Prague",
        worker_concurrency = 8,
        beat_schedule = {
            'add-every-minute': {
            'task': 'app.main.views.flask_task',
            'schedule': crontab(minute=0, hour=20, day_of_week='friday'),
            }
        }
    )

class TestProductionConfig(Config):
    MZK_IP = os.environ.get('MZK_IP', '10.223.1.8')
    SRC_FOLDER = os.environ.get('SRC_FOLDER')
    DST_FOLDER = os.environ.get('DST_FOLDER') 
    DB_USER = 'postgres' #Production ready
    DB_SERVER = 'mzk-postgres-test'
    DB_PASSWORD = 'password' #Production ready
    SMB_USER = os.environ.get('SMB_USER') #Production ready
    SMB_PASSWORD = os.environ.get('SMB_PASSWORD') #Production ready

    CELERY = dict(
        broker_url = "redis://mzk-redis-test:6379/0",
        result_backend = f"db+postgresql://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/mzkdata",
        task_track_started = True,
        timezone = "Europe/Prague",
        worker_concurrency = 8,
        beat_schedule = {
            'add-every-minute': {
            'task': 'app.main.views.flask_task',
            'schedule': crontab(minute=0, hour=19, day_of_week='tuesday'),
            }
        }
    )


class DevelopmentConfig(Config):
    MZK_IP = os.environ.get('MZK_IP', '10.2.0.8')
    SRC_FOLDER = os.environ.get('SRC_FOLDER') or ''
    DST_FOLDER = os.environ.get('DST_FOLDER') or '' # ADD MZK
    SMB_USER = os.environ.get('SMB_USER')
    SMB_PASSWORD = os.environ.get('SMB_PASSWORD')
    DB_USER = 'postgres'
    DB_PASSWORD = 'password'
    


class LocalDevelopmentConfig(DevelopmentConfig):
    DB_SERVER = 'localhost:5432'
    SRC_FOLDER = '/home/tran/Desktop/git/github/MichaelTran262/image-preparator/data'
    DST_FOLDER = '/MUO/test_tran/'

    CELERY = dict(
        broker_url = "redis://localhost:6379/0",
        result_backend = f"db+postgresql://{DevelopmentConfig.DB_USER}:{DevelopmentConfig.DB_PASSWORD}@{DB_SERVER}/mzkdata",
        task_track_started = True,
        timezone = "Europe/Prague",
        worker_concurrency = 8,
        beat_schedule = {
            'add-every-minute': {
            'task': 'app.main.views.flask_task',
            'schedule': crontab(minute='*/1'),
            }
        }
    )

config = {
    'development': LocalDevelopmentConfig(),
    'testing': TestProductionConfig(),
    'production': ProductionConfig()
}