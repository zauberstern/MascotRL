import numpy as np

KAPPA = 5e-4


def charge(weights, previous):
    w = np.asarray(weights, dtype=np.float64).reshape(-1)
    prev = np.asarray(previous, dtype=np.float64).reshape(-1)
    return float(KAPPA * np.abs(w - prev).sum())
