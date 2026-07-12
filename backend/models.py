import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def gen_uuid():
    return str(uuid.uuid4())


class Session(db.Model):
    __tablename__ = "sessions"

    id                  = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    scenario_id         = db.Column(db.String(64), nullable=False)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)
    current_node_index  = db.Column(db.Integer, default=0)
    completed           = db.Column(db.Boolean, default=False)
    state_json          = db.Column(db.JSON, default=dict)

    logs        = db.relationship("InteractionLog",  backref="session", lazy=True)
    decisions   = db.relationship("Decision",        backref="session", lazy=True)
    debrief     = db.relationship("Debrief",         backref="session", uselist=False)
    kc_checks   = db.relationship("KnowledgeCheck",  backref="session", lazy=True)


class InteractionLog(db.Model):
    __tablename__ = "interaction_logs"

    id                  = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    session_id          = db.Column(db.String(36),  db.ForeignKey("sessions.id"), nullable=False)
    node_index          = db.Column(db.Integer,     nullable=False)
    event_type          = db.Column(db.String(64),  nullable=False)
    payload_json        = db.Column(db.JSON,        default=dict)
    client_timestamp_ms = db.Column(db.BigInteger,  nullable=True)
    server_timestamp    = db.Column(db.DateTime,    default=datetime.utcnow)


class Decision(db.Model):
    __tablename__ = "decisions"

    id                  = db.Column(db.Integer,    primary_key=True, autoincrement=True)
    session_id          = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False)
    node_index          = db.Column(db.Integer,    nullable=False)
    extraction_mgd      = db.Column(db.Float,      nullable=False)
    time_to_confirm_ms  = db.Column(db.Integer,    nullable=True)
    revision_count      = db.Column(db.Integer,    default=0)
    viewed_causal_panel = db.Column(db.Boolean,    default=False)
    stats_viewed_json   = db.Column(db.JSON,       default=list)
    reservoir_after     = db.Column(db.Float,      nullable=True)
    treated_output      = db.Column(db.Float,      nullable=True)
    supply_deficit      = db.Column(db.Float,      nullable=True)


class Debrief(db.Model):
    __tablename__ = "debriefs"

    id                       = db.Column(db.Integer,    primary_key=True, autoincrement=True)
    session_id               = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False, unique=True)
    causal_map_json          = db.Column(db.JSON,       default=dict)
    map_score_json           = db.Column(db.JSON,       default=dict)
    reflection_responses_json= db.Column(db.JSON,       default=dict)
    competency_profile_json  = db.Column(db.JSON,       default=dict)
    created_at               = db.Column(db.DateTime,   default=datetime.utcnow)


class KnowledgeCheck(db.Model):
    __tablename__ = "knowledge_checks"

    id             = db.Column(db.Integer,    primary_key=True, autoincrement=True)
    session_id     = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False)
    timing         = db.Column(db.String(4),  nullable=False)   # 'pre' | 'post'
    responses_json = db.Column(db.JSON,       default=dict)
    mc_score_json  = db.Column(db.JSON,       default=dict)
    mc_total       = db.Column(db.Integer,    default=0)
    created_at     = db.Column(db.DateTime,   default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("session_id", "timing", name="uq_session_timing"),
    )