import os
import joblib
import logging
import pandas as pd
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.model_registry import ModelRegistry
from app.models.model_comparison import ModelComparisonLog

logger = logging.getLogger(__name__)

class ShadowEvaluator:
    _cached_models = {}

    @classmethod
    async def evaluate_shadow(
        cls,
        tx_id,
        production_version: str,
        production_score: float,
        features: dict,
        db: AsyncSession
    ):
        """Scores candidate models in the background and logs the comparison details."""
        if db is None:
            return

        try:
            # Query candidate models
            stmt = select(ModelRegistry).where(ModelRegistry.status == "candidate")
            res = await db.execute(stmt)
            candidates = res.scalars().all()
            
            if not candidates:
                return

            # Resolve scaler and engineer paths
            ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml')
            scaler_path = os.path.join(ml_dir, 'models', 'feature_scaler.joblib')
            eng_path = os.path.join(ml_dir, 'models', 'feature_engineer_v1.joblib')

            if not (os.path.exists(scaler_path) and os.path.exists(eng_path)):
                logger.warning("Scaler or Feature Engineer model files missing — skipping shadow evaluation.")
                return

            scaler = joblib.load(scaler_path)
            engineer = joblib.load(eng_path)
            
            feat_df = pd.DataFrame([features])
            for col in engineer.BASE_FEATURES:
                if col not in feat_df.columns:
                    feat_df[col] = 0
                    
            feat_eng = engineer.build_training_matrix(feat_df.to_dict(orient='records'))

            for candidate in candidates:
                # Load candidate model binary
                model = cls._cached_models.get(candidate.file_path)
                if not model:
                    full_path = candidate.file_path
                    if not os.path.isabs(full_path):
                        full_path = os.path.join(ml_dir, full_path)
                        
                    if os.path.exists(full_path):
                        try:
                            model = joblib.load(full_path)
                            cls._cached_models[candidate.file_path] = model
                            logger.info(f"Loaded candidate model {candidate.version} from {full_path}")
                        except Exception as e:
                            logger.error(f"Failed to load candidate model {candidate.version} from {full_path}: {e}")
                            continue
                    else:
                        logger.warning(f"Candidate model path not found: {full_path}")
                        continue
                
                # Predict
                try:
                    if hasattr(model, "predict_proba"):
                        candidate_score = float(model.predict_proba(feat_eng.values)[0, 1])
                    else:
                        feat_scaled = scaler.transform(feat_eng.values)
                        if hasattr(model, "anomaly_score"):
                            candidate_score = float(model.anomaly_score(feat_scaled)[0])
                        else:
                            candidate_score = -float(model.score_samples(feat_scaled)[0])
                            # Normalize score to 0-1 range
                            candidate_score = (candidate_score - 0.5) * 2
                            candidate_score = max(0.0, min(1.0, candidate_score))
                            
                    # Record the comparison log
                    comparison = ModelComparisonLog(
                        transaction_id=tx_id,
                        production_model_version=production_version,
                        production_score=Decimal(str(production_score)),
                        candidate_model_version=candidate.version,
                        candidate_score=Decimal(str(candidate_score))
                    )
                    db.add(comparison)
                    await db.commit()
                    logger.info(f"Logged shadow prediction for {candidate.version}: candidate={candidate_score:.4f}, production={production_score:.4f}")
                except Exception as e:
                    logger.error(f"Error scoring shadow model {candidate.version}: {e}")
        except Exception as e:
            logger.error(f"Error in evaluate_shadow: {e}")
