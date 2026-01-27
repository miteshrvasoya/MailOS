from typing import Any, Dict, List, Optional
from sqlmodel import Session, select
from app.models.user import User
from app.models.rule import Rule

class RuleEngine:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.rules = self._fetch_rules()

    def _fetch_rules(self) -> List[Rule]:
        """Fetch active rules for the user, ordered by priority (descending)."""
        statement = (
            select(Rule)
            .where(Rule.user_id == self.user.id)
            .where(Rule.is_active == True)
            .order_by(Rule.priority.desc())
        )
        return self.db.exec(statement).all()

    def evaluate(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the email against all rules.
        Returns a dictionary of accumulated actions/overrides.
        """
        applied_actions = {}

        for rule in self.rules:
            if self._matches_conditions(rule, email_data):
                # Merge actions. Higher priority rules (processed first) take precedence
                # if we treat applied_actions as 'final capabilities'. 
                # HOWEVER, usually priority means "first match wins" OR "apply all in order".
                # If we want higher priority to OVERRIDE lower, we should process low to high?
                # No, usually high priority runs first and sets the state.
                # If we want "Stop Processing", we check that.
                
                rule_actions = rule.actions
                
                # Update applied actions. 
                # Note: If a key already exists, we might want to keep the high-priority value.
                for key, value in rule_actions.items():
                    if key not in applied_actions:
                        applied_actions[key] = value
                
                # Check for "stop_processing" special action
                if rule_actions.get("stop_processing"):
                    break
        
        return applied_actions

    def _matches_conditions(self, rule: Rule, email_data: Dict[str, Any]) -> bool:
        """Check if email matches rule conditions."""
        conditions = rule.conditions
        
        # Determine if conditions is a Dict (one-level) or List of Dicts
        # Plan says: List structure `[ { "field": "sender", ... } ]`
        # But Model says Dict. Let's support both if possible, or assume it's stored under a key in Dict if it's complex.
        # Ideally, we standardize. Let's assume the frontend will send a list of conditions wrapped in a dict key "items" OR just a list if we change the model.
        # But since model is Dict, maybe we store: { "logic": "AND", "criteria": [...] }
        # For now, let's support a simple list of matching criteria inside the Dict under "conditions" key, or if the Dict ITSELF is the condition map (simple key-value).
        
        # Let's assume the robust structure: { "all": [ { "field": "sender", "operator": "contains", "value": "x" } ] }
        # This allows for AND logic. "any" for OR logic.
        
        # Default fallback to simple key-value for backward compat if any exist (none do yet).
        
        criteria_list = conditions.get("all", [])
        if not criteria_list and "any" in conditions:
            # Handle OR logic
            pass # TODO
        
        if not criteria_list:
            # If empty, maybe it's the simple format or no conditions?
            # If no conditions, usually we don't match.
            return False

        # AND Logic: All criteria must match
        for criteria in criteria_list:
            if not self._check_single_condition(criteria, email_data):
                return False
        
        return True

    def _check_single_condition(self, criteria: Dict[str, Any], email_data: Dict[str, Any]) -> bool:
        field = criteria.get("field")
        operator = criteria.get("operator")
        target_value = criteria.get("value")
        
        if not field or not operator:
             return False

        email_value = email_data.get(field, "")
        if email_value is None:
            email_value = ""
        
        # Case insensitive comparison usually
        if isinstance(email_value, str):
            email_value = email_value.lower()
        if isinstance(target_value, str):
            target_value = target_value.lower()

        if operator == "contains":
            return target_value in email_value
        elif operator == "not_contains":
            return target_value not in email_value
        elif operator == "equals":
            return email_value == target_value
        elif operator == "not_equals":
            return email_value != target_value
        elif operator == "starts_with":
            return email_value.startswith(target_value)
        elif operator == "ends_with":
            return email_value.endswith(target_value)
        
        return False
