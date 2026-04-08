from sqlalchemy.orm import Session
from app.models.system_parameter import SystemParameter
from typing import Dict

def get_all_parameters(db: Session) -> Dict[str, str]:
    params = db.query(SystemParameter).all()

    return {param.param_key: param.param_value for param in params if param.param_value is not None}

def upsert_parameters(db: Session, params_data: Dict[str, str]):
    for key, value in params_data.items():
        param_obj = db.query(SystemParameter).filter(SystemParameter.param_key == key).first()
        
        str_value = str(value) 

        if param_obj:
            param_obj.param_value = str_value
        else:
            new_param = SystemParameter(param_key=key, param_value=str_value)
            db.add(new_param)
            
    db.commit()
    return get_all_parameters(db)