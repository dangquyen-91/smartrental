# So sánh model dự đoán giá thuê

Dữ liệu: 13065 dòng (sau tiền xử lý)

| Model | CV MAE (VND) | Test MAE (VND) | Test RMSE (VND) | Test R² |
|---|---|---|---|---|
| random_forest | 718,893 | 731,637 | 982,485 | 0.425 |
| xgboost **(chọn)** | 689,480 | 697,896 | 934,767 | 0.479 |
| lightgbm | 694,754 | 705,421 | 938,302 | 0.475 |