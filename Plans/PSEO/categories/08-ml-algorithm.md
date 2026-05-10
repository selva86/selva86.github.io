# Category 08: ML Algorithm PSEO

**Total:** 150 slugs (30 algorithms x 5 framings)
**Page template:** intuition → R code → diagnostic → tuning → interpretation
**Word count target:** 1000 to 1500
**Parent:** Machine-Learning parent posts (per algorithm family)

URL pattern: `/<Algorithm>-<Framing>-in-R.html`

---

## 5 framings per algorithm

- `Implementation`: How-to-Implement-X-in-R
- `Tuning`: X-Hyperparameter-Tuning-in-R
- `Interpretation`: X-Model-Interpretation-in-R
- `Visualization`: X-Visualization-in-R
- `Comparison`: X-vs-Y-in-R (paired with closest peer)

## 30 algorithms covered

Regression family (10):
- Linear-Regression
- Logistic-Regression
- Multinomial-Regression
- Poisson-Regression
- Negative-Binomial-Regression
- Beta-Regression
- Quantile-Regression
- Ridge-Regression
- Lasso-Regression
- Elastic-Net-Regression

Tree / boosting (5):
- Decision-Tree
- Random-Forest
- XGBoost
- LightGBM
- CatBoost

Other supervised (5):
- Support-Vector-Machine
- k-Nearest-Neighbors
- Naive-Bayes
- Neural-Network-MLP
- Multinomial-Naive-Bayes

Clustering (4):
- K-Means
- Hierarchical-Clustering
- DBSCAN
- Gaussian-Mixture-Model

Dimensionality reduction (4):
- PCA
- ICA
- t-SNE
- UMAP

Anomaly / specialized (2):
- Isolation-Forest
- One-Class-SVM

---

## Slug list (150)

For each algorithm in the list above, expand to 5 slugs by appending the framing tokens. Examples:

Linear-Regression:
- How-to-Implement-Linear-Regression-in-R
- Linear-Regression-Hyperparameter-Tuning-in-R
- Linear-Regression-Model-Interpretation-in-R
- Linear-Regression-Visualization-in-R
- Linear-Regression-vs-Logistic-Regression-in-R

Random-Forest:
- How-to-Implement-Random-Forest-in-R
- Random-Forest-Hyperparameter-Tuning-in-R
- Random-Forest-Model-Interpretation-in-R
- Random-Forest-Visualization-in-R
- Random-Forest-vs-XGBoost-in-R

XGBoost:
- How-to-Implement-XGBoost-in-R
- XGBoost-Hyperparameter-Tuning-in-R
- XGBoost-Model-Interpretation-in-R
- XGBoost-Visualization-in-R
- XGBoost-vs-LightGBM-in-R

K-Means:
- How-to-Implement-K-Means-in-R
- K-Means-Hyperparameter-Tuning-in-R
- K-Means-Model-Interpretation-in-R
- K-Means-Visualization-in-R
- K-Means-vs-Hierarchical-Clustering-in-R

Total: 30 algorithms x 5 framings = **150 slugs**.

---

## Comparison framing pairings

Each algorithm pairs with one peer for the comparison framing. Pairings:

| Algorithm | Compared with |
|---|---|
| Linear-Regression | Logistic-Regression |
| Logistic-Regression | Multinomial-Regression |
| Multinomial-Regression | Ordinal-Logistic-Regression |
| Poisson-Regression | Negative-Binomial-Regression |
| Negative-Binomial-Regression | Quasi-Poisson-Regression |
| Beta-Regression | Logistic-Regression |
| Quantile-Regression | OLS-Linear-Regression |
| Ridge-Regression | Lasso-Regression |
| Lasso-Regression | Elastic-Net-Regression |
| Elastic-Net-Regression | Ridge-Regression |
| Decision-Tree | Random-Forest |
| Random-Forest | XGBoost |
| XGBoost | LightGBM |
| LightGBM | CatBoost |
| CatBoost | XGBoost |
| Support-Vector-Machine | Logistic-Regression |
| k-Nearest-Neighbors | Naive-Bayes |
| Naive-Bayes | Logistic-Regression |
| Neural-Network-MLP | Random-Forest |
| Multinomial-Naive-Bayes | Logistic-Regression |
| K-Means | Hierarchical-Clustering |
| Hierarchical-Clustering | DBSCAN |
| DBSCAN | Gaussian-Mixture-Model |
| Gaussian-Mixture-Model | K-Means |
| PCA | Factor-Analysis |
| ICA | PCA |
| t-SNE | UMAP |
| UMAP | t-SNE |
| Isolation-Forest | One-Class-SVM |
| One-Class-SVM | Isolation-Forest |
