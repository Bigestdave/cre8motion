from app.models.system import BudgetLedger, BudgetEntry

# Internal budget units are intentionally normalized for the 100-unit MVP budget.
# Provider-specific currency/token reporting belongs in a separate billing adapter.
COST_TABLE = {
    'reasoning_tokens_per_1k': 1,
    'vision_review': 1,
    'storyboard_image': 1,
    'keyframe_image': 2,
    'video_generation_per_sec': 1,
    'audio_generation': 2,
    'retry_multiplier': 1.5,
}

def create_ledger(db, production_id, max_units=100):
    ledger = BudgetLedger(production_run_id=production_id, maximum_units=max_units, available_units=max_units-16)
    db.add(ledger)
    db.commit()
    return ledger

def debit(db, production_id, stage, operation, units, shot_id=None, attempt_id=None):
    ledger = db.query(BudgetLedger).filter(BudgetLedger.production_run_id == production_id).first()
    if not ledger: return None
    
    entry = BudgetEntry(
        budget_ledger_id=ledger.id,
        stage=stage,
        operation=operation,
        units=units,
        shot_id=shot_id,
        attempt_id=attempt_id
    )
    db.add(entry)
    ledger.used_units += units
    ledger.available_units -= units
    db.commit()
    return entry

def check_budget(db, production_id, required_units):
    ledger = db.query(BudgetLedger).filter(BudgetLedger.production_run_id == production_id).first()
    return ledger and ledger.available_units >= required_units

def get_summary(db, production_id):
    ledger = db.query(BudgetLedger).filter(BudgetLedger.production_run_id == production_id).first()
    if not ledger: return None
    return {
        "maximum_units": ledger.maximum_units,
        "used_units": ledger.used_units,
        "reserved_units": ledger.reserved_units,
        "available_units": ledger.available_units,
        "saved_units": ledger.saved_units
    }
