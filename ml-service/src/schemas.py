from typing import Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    area: float = Field(..., gt=0, le=500, description="Diện tích (m2)")
    city: str = Field(..., description="Thành phố, vd: Hồ Chí Minh")
    district: str = Field(..., description="Quận/huyện, vd: Quận 7")
    bedrooms: int = Field(1, ge=0, le=10)
    furniture: Literal["full", "basic", "unknown"] = "unknown"
    condition: Literal["newly_built", "unknown"] = "unknown"
    amenities: list[str] = Field(default_factory=list)


class PriceRange(BaseModel):
    min: int
    max: int


class ModelMetrics(BaseModel):
    mae: float
    r2: float


class PredictResponse(BaseModel):
    predictedPrice: int
    priceRange: PriceRange
    currency: Literal["VND"] = "VND"
    model: str
    modelMetrics: ModelMetrics


class HealthResponse(BaseModel):
    status: Literal["ok", "model_not_loaded"]
    model: str | None = None
    trainedAt: str | None = None


class PredictBatchRequest(BaseModel):
    items: list[PredictRequest]


class PredictBatchResponse(BaseModel):
    results: list[PredictResponse]
