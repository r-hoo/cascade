import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "instance", "cascade.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SCENARIOS_DIR = os.path.join(BASE_DIR, "scenarios")
    JSON_SORT_KEYS = False