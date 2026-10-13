import numpy as np


def softmax(scores):
    z = np.asarray(scores, dtype=np.float64).reshape(-1)
    z = z - np.max(z)
    e = np.exp(z)
    return e / e.sum()


def sparsemax(scores):
    z = np.asarray(scores, dtype=np.float64).reshape(-1)
    n = z.size
    order = np.argsort(z)[::-1]
    sorted_z = z[order]
    cumsum = np.cumsum(sorted_z)
    k = np.arange(1, n + 1, dtype=np.float64)
    support = int(np.sum(1.0 + k * sorted_z > cumsum))
    support = max(support, 1)
    tau = (cumsum[support - 1] - 1.0) / support
    return np.maximum(z - tau, 0.0)


def bounded_tanh(scores):
    z = np.asarray(scores, dtype=np.float64).reshape(-1)
    clipped = np.clip(np.tanh(z), 0.0, None)
    total = float(clipped.sum())
    if total <= 0.0:
        return np.full(z.shape, 1.0 / z.size)
    return clipped / total
