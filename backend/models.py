import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def gen_uuid():
    return str(uuid.uuid4())


class Session(db.Model):
    """A single play-through of one scenario."""
    __tablename__ = "sessions"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    scenario_id = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    current_node_index = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)

    # Live system state, persisted as JSON so the engine can resume
    # a session without recomputing from the full history each time.
    state_json = db.Column(db.JSON, default=dict)

    logs = db.relationship("InteractionLog", backref="session", lazy=True)
    decisions = db.relationship("Decision", backref="session", lazy=True)
    debrief = db.relationship("Debrief", backref="session", uselist=False)


class InteractionLog(db.Model):
    """
    Raw event stream. Every VIEW_STAT, VIEW_CAUSAL_PANEL, SET_EXTRACTION,
    etc. event from the frontend lands here, schema matching the
    scenario design doc's xAPI-aligned event format.
    """
    __tablename__ = "interaction_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False)
    node_index = db.Column(db.Integer, nullable=False)
    event_type = db.Column(db.String(64), nullable=False)
    payload_json = db.Column(db.JSON, default=dict)
    client_timestamp_ms = db.Column(db.BigInteger, nullable=True)
    server_timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Decision(db.Model):
    """
    One CONFIRM_DECISION per node — denormalized out of the raw log
    stream because the scoring pipeline reads these far more often
    than it replays raw logs.
    """
    __tablename__ = "decisions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False)
    node_index = db.Column(db.Integer, nullable=False)
    extraction_mgd = db.Column(db.Float, nullable=False)
    time_to_confirm_ms = db.Column(db.Integer, nullable=True)
    revision_count = db.Column(db.Integer, default=0)
    viewed_causal_panel = db.Column(db.Boolean, default=False)
    stats_viewed_json = db.Column(db.JSON, default=list)  # ["reservoir", "rainfall", ...]

    # Resulting state snapshot AFTER this decision is applied
    reservoir_after = db.Column(db.Float, nullable=True)
    treated_output = db.Column(db.Float, nullable=True)
    supply_deficit = db.Column(db.Float, nullable=True)


class Debrief(db.Model):
    """Causal map submission and reflection responses for a session."""
    __tablename__ = "debriefs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False, unique=True)
    causal_map_json = db.Column(db.JSON, default=dict)   # nodes_placed, edges_placed
    map_score_json = db.Column(db.JSON, default=dict)    # computed against reference model
    reflection_responses_json = db.Column(db.JSON, default=dict)  # prompt_id -> response_text
    competency_profile_json = db.Column(db.JSON, default=dict)    # final ECD scoring output
    created_at = db.Column(db.DateTime, default=datetime.utcnow)