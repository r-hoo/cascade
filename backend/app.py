from flask import Flask, request, jsonify, abort
from flask_cors import CORS

from config import Config
from models import db, Session, InteractionLog, Decision, Debrief
from scenario_engine import get_engine

import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(os.path.join(os.path.dirname(__file__), "instance"), exist_ok=True)

    db.init_app(app)
    CORS(app)  # tighten origins before any real deployment

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


def register_routes(app):

    # ---------------------------------------------------------------
    # Session lifecycle
    # ---------------------------------------------------------------

    @app.post("/api/sessions")
    def start_session():
        """
        Body: { "scenario_id": "scenario_1" }
        Creates a new play session and returns the first node.
        """
        data = request.get_json(force=True)
        scenario_id = data.get("scenario_id")
        if not scenario_id:
            abort(400, "scenario_id is required")

        try:
            engine = get_engine(scenario_id, app.config["SCENARIOS_DIR"])
        except FileNotFoundError:
            abort(404, f"Unknown scenario: {scenario_id}")

        session = Session(
            scenario_id=scenario_id,
            current_node_index=0,
            state_json=engine.initial_state(),
        )
        db.session.add(session)
        db.session.commit()

        node = engine.get_node(0)

        return jsonify({
            "session_id": session.id,
            "scenario": {
                "id": engine.scenario["id"],
                "title": engine.scenario["title"],
                "description": engine.scenario["description"],
                "extraction_options_mgd": engine.extraction_options,
            },
            "state": session.state_json,
            "node": node,
        }), 201

    @app.get("/api/debug/session/<session_id>")
    def debug_session(session_id):
        """
        Returns a full dump of all logs, decisions, and debrief
        for a session. Development only — remove before any public deployment.
        """
        session = Session.query.get_or_404(session_id)

        logs = (
            InteractionLog.query
            .filter_by(session_id=session_id)
            .order_by(InteractionLog.server_timestamp)
            .all()
        )

        decisions = (
            Decision.query
            .filter_by(session_id=session_id)
            .order_by(Decision.node_index)
            .all()
        )

        debrief = Debrief.query.filter_by(session_id=session_id).first()

        return jsonify({
            "session": {
                "id":                   session.id,
                "scenario_id":          session.scenario_id,
                "current_node_index":   session.current_node_index,
                "completed":            session.completed,
                "state":                session.state_json,
            },
            "interaction_log_count": len(logs),
            "interaction_logs": [
                {
                    "id":               l.id,
                    "node_index":       l.node_index,
                    "event_type":       l.event_type,
                    "payload":          l.payload_json,
                    "client_ts_ms":     l.client_timestamp_ms,
                    "server_ts":        l.server_timestamp.isoformat(),
                }
                for l in logs
            ],
            "decision_count": len(decisions),
            "decisions": [
                {
                    "node_index":           d.node_index,
                    "extraction_mgd":       d.extraction_mgd,
                    "time_to_confirm_ms":   d.time_to_confirm_ms,
                    "revision_count":       d.revision_count,
                    "viewed_causal_panel":  d.viewed_causal_panel,
                    "stats_viewed":         d.stats_viewed_json,
                    "reservoir_after":      d.reservoir_after,
                    "treated_output":       d.treated_output,
                    "supply_deficit":       d.supply_deficit,
                }
                for d in decisions
            ],
            "debrief": {
                "map_score":          debrief.map_score_json,
                "competency_profile": debrief.competency_profile_json,
                "reflection_responses": debrief.reflection_responses_json,
            } if debrief else None,
        })

    @app.get("/api/sessions/<session_id>")
    def get_session(session_id):
        session = Session.query.get_or_404(session_id)
        engine = get_engine(session.scenario_id, app.config["SCENARIOS_DIR"])
        node = engine.get_node(session.current_node_index)
        return jsonify({
            "session_id": session.id,
            "scenario_id": session.scenario_id,
            "current_node_index": session.current_node_index,
            "completed": session.completed,
            "state": session.state_json,
            "node": node,
        })

    # ---------------------------------------------------------------
    # Interaction logging (fired continuously from the frontend, e.g.
    # VIEW_STAT, VIEW_CAUSAL_PANEL, SET_EXTRACTION-with-revision)
    # ---------------------------------------------------------------

    @app.post("/api/sessions/<session_id>/log")
    def log_event(session_id):
        """
        Body: {
          "node_index": 3,
          "event_type": "VIEW_STAT" | "VIEW_CAUSAL_PANEL" | "SET_EXTRACTION" | ...,
          "payload": { ... },
          "client_timestamp_ms": 1700000000000
        }
        Fire-and-forget logging endpoint; the frontend calls this for
        every micro-interaction. Does not affect game state.
        """
        session = Session.query.get_or_404(session_id)
        data = request.get_json(force=True)

        log = InteractionLog(
            session_id=session.id,
            node_index=data.get("node_index", session.current_node_index),
            event_type=data["event_type"],
            payload_json=data.get("payload", {}),
            client_timestamp_ms=data.get("client_timestamp_ms"),
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({"status": "logged", "log_id": log.id}), 201

    # ---------------------------------------------------------------
    # Decisions — the core game loop step
    # ---------------------------------------------------------------

    @app.post("/api/sessions/<session_id>/decision")
    def submit_decision(session_id):
        """
        Body: {
          "extraction_mgd": 4,
          "time_to_confirm_ms": 12400,
          "revision_count": 1,
          "viewed_causal_panel": true,
          "stats_viewed": ["reservoir", "rainfall"]
        }

        Applies the decision to the current node, advances state,
        persists a Decision row, and returns the consequence summary
        plus the next node (or signals scenario completion).
        """
        session = Session.query.get_or_404(session_id)
        if session.completed:
            abort(400, "Session already completed")

        engine = get_engine(session.scenario_id, app.config["SCENARIOS_DIR"])
        data = request.get_json(force=True)

        extraction_mgd = data.get("extraction_mgd")
        if extraction_mgd not in engine.extraction_options:
            abort(400, f"extraction_mgd must be one of {engine.extraction_options}")

        node_index = session.current_node_index
        new_state, result = engine.apply_decision(
            session.state_json, node_index, extraction_mgd
        )

        decision = Decision(
            session_id=session.id,
            node_index=node_index,
            extraction_mgd=extraction_mgd,
            time_to_confirm_ms=data.get("time_to_confirm_ms"),
            revision_count=data.get("revision_count", 0),
            viewed_causal_panel=data.get("viewed_causal_panel", False),
            stats_viewed_json=data.get("stats_viewed", []),
            reservoir_after=result["reservoir_after"],
            treated_output=result["treated_output"],
            supply_deficit=result["supply_deficit"],
        )
        db.session.add(decision)

        session.state_json = new_state
        session.current_node_index = node_index + 1

        next_node = engine.get_node(session.current_node_index)
        if next_node is None:
            session.completed = True

        db.session.commit()

        return jsonify({
            "result": result,
            "new_state": new_state,
            "next_node": next_node,
            "completed": session.completed,
        })

    # ---------------------------------------------------------------
    # Debrief — causal map + reflection prompts + competency scoring
    # ---------------------------------------------------------------

    @app.get("/api/sessions/<session_id>/debrief-config")
    def get_debrief_config(session_id):
        """Returns the causal map template and reflection prompts."""
        session = Session.query.get_or_404(session_id)
        engine = get_engine(session.scenario_id, app.config["SCENARIOS_DIR"])
        return jsonify(engine.scenario.get("debrief", {}))

    @app.post("/api/sessions/<session_id>/debrief")
    def submit_debrief(session_id):
        """
        Body: {
          "causal_map": {
            "nodes_placed": [...],
            "edges_placed": [{"from": "...", "to": "...", "polarity": "+"}]
          },
          "reflection_responses": {
            "unexpected_outcome": "text...",
            "surprising_loop": "text...",
            "different_decision": "text..."
          }
        }

        Scores the causal map, computes the full ECD competency profile
        from all decisions in the session, and persists everything as
        the Debrief record. This is the terminal step of a play session.
        """
        session = Session.query.get_or_404(session_id)
        if not session.completed:
            abort(400, "Cannot debrief an incomplete session")

        engine = get_engine(session.scenario_id, app.config["SCENARIOS_DIR"])
        data = request.get_json(force=True)

        causal_map = data.get("causal_map", {})
        submitted_edges = causal_map.get("edges_placed", [])
        map_score = engine.score_causal_map(submitted_edges)

        decisions = (
            Decision.query
            .filter_by(session_id=session.id)
            .order_by(Decision.node_index)
            .all()
        )
        decision_dicts = [
            {
                "node_index": d.node_index,
                "extraction_mgd": d.extraction_mgd,
                "viewed_causal_panel": d.viewed_causal_panel,
                "stats_viewed": d.stats_viewed_json or [],
                "revision_count": d.revision_count,
            }
            for d in decisions
        ]
        competency_profile = engine.score_competencies(decision_dicts)

        existing = Debrief.query.filter_by(session_id=session.id).first()
        if existing:
            db.session.delete(existing)
            db.session.flush()

        debrief = Debrief(
            session_id=session.id,
            causal_map_json=causal_map,
            map_score_json=map_score,
            reflection_responses_json=data.get("reflection_responses", {}),
            competency_profile_json=competency_profile,
        )
        db.session.add(debrief)
        db.session.commit()

        return jsonify({
            "map_score": map_score,
            "competency_profile": competency_profile,
        }), 201

    @app.get("/api/sessions/<session_id>/debrief")
    def get_debrief(session_id):
        debrief = Debrief.query.filter_by(session_id=session_id).first_or_404()
        return jsonify({
            "causal_map": debrief.causal_map_json,
            "map_score": debrief.map_score_json,
            "reflection_responses": debrief.reflection_responses_json,
            "competency_profile": debrief.competency_profile_json,
        })

    # ---------------------------------------------------------------
    # Health check
    # ---------------------------------------------------------------

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)