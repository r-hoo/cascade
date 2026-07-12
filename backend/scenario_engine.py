import json
import os


class ScenarioEngine:
    def __init__(self, scenario_path):
        with open(scenario_path, "r") as f:
            self.scenario = json.load(f)
        self.params = self.scenario["parameters"]
        self.nodes  = self.scenario["nodes"]
        self.extraction_options = self.scenario["extraction_options_mgd"]

    def get_node(self, index):
        if index >= len(self.nodes):
            return None
        return self.nodes[index]

    def num_nodes(self):
        return len(self.nodes)

    def initial_state(self):
        state = {
            "reservoir_mgd": self.params["reservoir_start_mgd"],
            "day": 0,
        }
        if self.scenario["id"] == "scenario_2":
            state["zone_b_demand_mgd"] = self.params["zone_b_demand_start_mgd"]
        return state

    # ── Dispatcher ──────────────────────────────────────────────────

    def apply_decision(self, state, node_index, extraction_mgd):
        if self.scenario["id"] == "scenario_2":
            return self._apply_s2(state, node_index, extraction_mgd)
        return self._apply_s1(state, node_index, extraction_mgd)

    # ── Scenario 1 ──────────────────────────────────────────────────

    def _apply_s1(self, state, node_index, extraction_mgd):
        node     = self.get_node(node_index)
        eta      = self.params["treatment_efficiency"]
        demand   = self.params["daily_demand_mgd"]
        r_min    = self.params["reservoir_min_mgd"]
        r_max    = self.params["reservoir_max_mgd"]
        rainfall = node["rainfall_mgd"]

        reservoir_before = state["reservoir_mgd"]
        treated_output   = extraction_mgd * eta
        supply_deficit   = max(0.0, demand - treated_output)
        reservoir_after  = max(0, min(r_max, reservoir_before + rainfall - extraction_mgd))
        breached_minimum = reservoir_after < r_min

        new_state = {
            "reservoir_mgd": round(reservoir_after, 2),
            "day": node["day"],
        }
        result = {
            "node_index":       node_index,
            "day":              node["day"],
            "rainfall_mgd":     rainfall,
            "extraction_mgd":   extraction_mgd,
            "reservoir_before": round(reservoir_before, 2),
            "reservoir_after":  round(reservoir_after, 2),
            "treated_output":   round(treated_output, 2),
            "supply_deficit":   round(supply_deficit, 2),
            "breached_minimum": breached_minimum,
        }
        return new_state, result

    # ── Scenario 2 ──────────────────────────────────────────────────

    def _apply_s2(self, state, node_index, extraction_mgd):
        node     = self.get_node(node_index)
        eta      = self.params["treatment_efficiency"]
        zone_a   = self.params["zone_a_demand_mgd"]
        zb_max   = self.params["zone_b_demand_max_mgd"]
        zb_grow  = self.params["zone_b_growth_per_step"]
        r_min    = self.params["reservoir_min_mgd"]
        r_max    = self.params["reservoir_max_mgd"]
        rainfall = node["rainfall_mgd"]

        reservoir_before  = state["reservoir_mgd"]
        zone_b_demand     = state.get("zone_b_demand_mgd",
                                      self.params["zone_b_demand_start_mgd"])
        total_demand      = zone_a + zone_b_demand

        treated_output    = extraction_mgd * eta
        # Zone A gets supply priority
        zone_b_treated    = max(0.0, treated_output - zone_a)
        zone_b_deficit    = max(0.0, zone_b_demand - zone_b_treated)
        total_deficit     = max(0.0, total_demand - treated_output)

        # Reinforcing loop: Zone B demand grows if fully supplied this step
        new_zone_b_demand = (
            min(zb_max, zone_b_demand + zb_grow)
            if zone_b_deficit == 0
            else zone_b_demand
        )

        reservoir_after  = max(0, min(r_max, reservoir_before + rainfall - extraction_mgd))
        breached_minimum = reservoir_after < r_min

        new_state = {
            "reservoir_mgd":    round(reservoir_after,   2),
            "zone_b_demand_mgd":round(new_zone_b_demand, 2),
            "day":              node["day"],
        }
        result = {
            "node_index":       node_index,
            "day":              node["day"],
            "rainfall_mgd":     rainfall,
            "extraction_mgd":   extraction_mgd,
            "reservoir_before": round(reservoir_before,  2),
            "reservoir_after":  round(reservoir_after,   2),
            "treated_output":   round(treated_output,    2),
            "zone_b_demand":    round(zone_b_demand,     2),
            "zone_b_deficit":   round(zone_b_deficit,    2),
            "new_zone_b_demand":round(new_zone_b_demand, 2),
            "supply_deficit":   round(total_deficit,     2),
            "breached_minimum": breached_minimum,
        }
        return new_state, result

    # ── ECD scoring ─────────────────────────────────────────────────

    def score_competencies(self, decisions):
        ecd      = self.scenario.get("ecd", {})
        elements = ecd.get("competency_elements", [])
        rules    = ecd.get("evidence_rules", [])
        scores   = {el: "unscored" for el in elements}
        by_node  = {d["node_index"]: d for d in decisions}

        for rule in rules:
            element   = rule["element"]
            rule_type = rule["rule"]
            if rule_type == "extraction_at_node_lte":
                d = by_node.get(rule["node_index"])
                if d is not None:
                    if d["extraction_mgd"] <= rule["threshold"]:
                        scores[element] = rule.get("score", "high")
                    elif scores.get(element) != "high":
                        scores[element] = "low"

        # Causal reasoning: causal panel viewed on ≥ 50% of nodes
        if "causal_reasoning" in elements:
            views = sum(1 for d in decisions if d.get("viewed_causal_panel"))
            scores["causal_reasoning"] = (
                "high" if views / max(1, len(decisions)) >= 0.5 else "low"
            )

        # Multi-variable synthesis
        if "multivariable_synthesis" in elements:
            # Scenario 2 requires reservoir + rainfall + zone_b_demand
            required = (
                {"reservoir", "rainfall", "zone_b_demand"}
                if self.scenario["id"] == "scenario_2"
                else {"reservoir", "rainfall"}
            )
            qualifying = sum(
                1 for d in decisions
                if required.issubset(set(d.get("stats_viewed", [])))
            )
            scores["multivariable_synthesis"] = (
                "high" if qualifying / max(1, len(decisions)) >= 0.5 else "low"
            )

        return scores

    # ── Causal map scoring ──────────────────────────────────────────

    def score_causal_map(self, submitted_edges):
        debrief      = self.scenario.get("debrief", {})
        target_edges = debrief.get("causal_map", {}).get("target_edges", [])

        def key(e):
            return (e["from"], e["to"], e["polarity"])

        target_set    = {key(e) for e in target_edges}
        submitted_set = {key(e) for e in submitted_edges}

        matched   = list(target_set & submitted_set)
        missing   = list(target_set - submitted_set)
        incorrect = list(submitted_set - target_set)

        return {
            "matched_edges":   [list(e) for e in matched],
            "missing_edges":   [list(e) for e in missing],
            "incorrect_edges": [list(e) for e in incorrect],
            "score_fraction":  round(len(matched) / max(1, len(target_set)), 2),
        }


# ── Loader / cache ───────────────────────────────────────────────────

_engine_cache = {}

def get_engine(scenario_id, scenarios_dir):
    if scenario_id not in _engine_cache:
        path = os.path.join(scenarios_dir, f"{scenario_id}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"No scenario file for {scenario_id}")
        _engine_cache[scenario_id] = ScenarioEngine(path)
    return _engine_cache[scenario_id]