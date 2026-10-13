import numpy as np


def absolute_gap(weights):
    w = np.asarray(weights, dtype=np.float64).reshape(-1)
    base = 1.0 / w.size
    return float(np.abs(w - base).sum())


def active_share(weights):
    return 0.5 * absolute_gap(weights)


def name_withheld(weights):
    return absolute_gap(weights) < 0.25
