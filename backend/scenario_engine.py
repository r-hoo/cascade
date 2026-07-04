import json
import os


class ScenarioEngine:
    def __init__(self, scenario_path):
        with open(scenario_path, "r") as f:
            self.scenario = json.load(f)

        self.params = self.scenario["parameters"]
        self.nodes = self.scenario["nodes"]
        self.extraction_options = self.scenario["extraction_options_mgd"]

    # ---------- Scenario data access ----------

    def get_node(self, index):
        if index >= len(self.nodes):
            return None
        return self.nodes[index]

    def num_nodes(self):
        return len(self.nodes)

    def initial_state(self):
        return {
            "reservoir_mgd": self.params["reservoir_start_mgd"],
            "day": 0,
        }

    # ---------- Core dynamics ----------

    def apply_decision(self, state, node_index, extraction_mgd):
        """
        Implements the state update equations from the design spec:

            Treated output  =  E * eta
            Supply deficit  =  max(0, D - Treated output)
            New reservoir   =  clamp(R + Rainfall - E, 0, 100)

        Returns the new state plus a result dict describing this step's
        outcome (used both for the frontend consequence summary and for
        persisting the Decision row).
        """
        node = self.get_node(node_index)
        if node is None:
            raise ValueError(f"No node at index {node_index}")

        eta = self.params["treatment_efficiency"]
        demand = self.params["daily_demand_mgd"]
        r_min = self.params["reservoir_min_mgd"]
        r_max = self.params["reservoir_max_mgd"]

        rainfall = node["rainfall_mgd"]
        reservoir_before = state["reservoir_mgd"]

        treated_output = extraction_mgd * eta
        supply_deficit = max(0.0, demand - treated_output)

        reservoir_after = reservoir_before + rainfall - extraction_mgd
        reservoir_after = max(r_min if False else 0, min(r_max, reservoir_after))
        # Note: reservoir is allowed to fall below r_min physically (that's
        # the crisis condition); r_min is a *threshold for alerts*, not a
        # hard floor. Hard floor is 0.

        breached_minimum = reservoir_after < r_min

        new_state = {
            "reservoir_mgd": round(reservoir_after, 2),
            "day": node["day"],
        }

        result = {
            "node_index": node_index,
            "day": node["day"],
            "rainfall_mgd": rainfall,
            "extraction_mgd": extraction_mgd,
            "reservoir_before": round(reservoir_before, 2),
            "reservoir_after": round(reservoir_after, 2),
            "treated_output": round(treated_output, 2),
            "supply_deficit": round(supply_deficit, 2),
            "breached_minimum": breached_minimum,
        }

        return new_state, result

    # ---------- ECD scoring ----------

    def score_competencies(self, decisions):
        """
        Applies the evidence_rules from the scenario's ecd block against
        the full list of Decision-like dicts for a session, producing a
        per-competency-element score.

        decisions: list of dicts with keys node_index, extraction_mgd,
                   viewed_causal_panel, stats_viewed, revision_count, etc.
                   (one per node, in order)
        """
        ecd = self.scenario.get("ecd", {})
        elements = ecd.get("competency_elements", [])
        rules = ecd.get("evidence_rules", [])

        # default neutral score for every element
        scores = {el: "unscored" for el in elements}

        by_node = {d["node_index"]: d for d in decisions}

        for rule in rules:
            element = rule["element"]
            rule_type = rule["rule"]

            if rule_type == "extraction_at_node_lte":
                node_index = rule["node_index"]
                threshold = rule["threshold"]
                d = by_node.get(node_index)
                if d is not None and d["extraction_mgd"] <= threshold:
                    scores[element] = rule.get("score", "high")
                elif d is not None:
                    # only downgrade if not already marked high by another rule
                    if scores.get(element) != "high":
                        scores[element] = "low"

        # Multi-variable synthesis: did the player consult both reservoir
        # and rainfall stats on at least half the nodes before deciding?
        if "multivariable_synthesis" in elements:
            qualifying = 0
            for d in decisions:
                viewed = set(d.get("stats_viewed", []))
                if {"reservoir", "rainfall"}.issubset(viewed):
                    qualifying += 1
            ratio = qualifying / max(1, len(decisions))
            scores["multivariable_synthesis"] = "high" if ratio >= 0.5 else "low"

        # Causal reasoning: did the player consult the causal panel on
        # at least half the nodes?
        if "causal_reasoning" in elements:
            panel_views = sum(1 for d in decisions if d.get("viewed_causal_panel"))
            ratio = panel_views / max(1, len(decisions))
            scores["causal_reasoning"] = "high" if ratio >= 0.5 else "low"

        return scores

    # ---------- Debrief / causal map scoring ----------

    def score_causal_map(self, submitted_edges):
        """
        Compares submitted edges (list of {from, to, polarity}) against
        the scenario's target_edges. Returns matched, missing, incorrect.
        """
        debrief = self.scenario.get("debrief", {})
        target_edges = debrief.get("causal_map", {}).get("target_edges", [])

        def edge_key(e):
            return (e["from"], e["to"], e["polarity"])

        target_set = {edge_key(e) for e in target_edges}
        submitted_set = {edge_key(e) for e in submitted_edges}

        matched = list(target_set & submitted_set)
        missing = list(target_set - submitted_set)
        incorrect = list(submitted_set - target_set)

        return {
            "matched_edges": [list(e) for e in matched],
            "missing_edges": [list(e) for e in missing],
            "incorrect_edges": [list(e) for e in incorrect],
            "score_fraction": round(len(matched) / max(1, len(target_set)), 2),
        }


# ---------- Loader / cache ----------

_engine_cache = {}


def get_engine(scenario_id, scenarios_dir):
    if scenario_id not in _engine_cache:
        path = os.path.join(scenarios_dir, f"{scenario_id}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"No scenario file for {scenario_id}")
        _engine_cache[scenario_id] = ScenarioEngine(path)
    return _engine_cache[scenario_id]