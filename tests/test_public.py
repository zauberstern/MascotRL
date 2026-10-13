import importlib.util
from pathlib import Path

import numpy as np

def _load(name):
    path = Path(__file__).resolve().parents[1] / "src" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"mascot_{name}", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

charge = _load("cost").charge
absolute_gap = _load("gate").absolute_gap
active_share = _load("gate").active_share
name_withheld = _load("gate").name_withheld
bounded_tanh = _load("heads").bounded_tanh
softmax = _load("heads").softmax
sparsemax = _load("heads").sparsemax
file_name = _load("scorecard").file_name
state = _load("state").state


def test_heads_sum_to_one():
    scores = np.array([0.2, -1.0, 3.0, 0.0])
    for fn in (softmax, sparsemax, bounded_tanh):
        weights = fn(scores)
        assert weights.shape == (4,)
        assert np.all(weights >= -1e-12)
        assert abs(float(weights.sum()) - 1.0) < 1e-10


def test_sparsemax_can_zero_a_name():
    weights = sparsemax(np.array([5.0, 0.0, 0.0]))
    assert weights[0] > 0.9
    assert weights[1] == 0.0 or weights[2] == 0.0


def test_gate_withholds_below_one_quarter():
    equal = np.full(4, 0.25)
    assert absolute_gap(equal) == 0.0
    assert name_withheld(equal)
    tilted = np.array([0.7, 0.1, 0.1, 0.1])
    assert absolute_gap(tilted) >= 0.25
    assert not name_withheld(tilted)
    assert abs(active_share(tilted) - 0.5 * absolute_gap(tilted)) < 1e-12


def test_lead_files_generalist():
    flat = {
        "residual_trend": 0.0,
        "autocorrelation": 0.0,
        "holding_period": 0.0,
        "reversal": 0.0,
        "turnover": 0.0,
        "defensive_tilt": 0.0,
        "minus_downside_capture": 0.0,
        "minus_largest_weight": 0.0,
        "defensive_response_to_volatility": 0.0,
        "lottery_tilt": 0.0,
        "concentration": 0.0,
        "largest_weight": 0.0,
        "upside_capture": 0.0,
        "rotation": 0.0,
        "tilt_variance_across_regimes": 0.0,
        "tilt_variance_within_regime": 0.0,
    }
    name, _runner, gap = file_name(flat)
    assert name == "generalist"
    assert gap < 0.25
    peaked = dict(flat)
    peaked["residual_trend"] = 4.0
    peaked["autocorrelation"] = 4.0
    peaked["holding_period"] = 4.0
    name, runner, gap = file_name(peaked)
    assert name == "trend_follower"
    assert gap >= 0.25
    assert runner != name


def test_charge_and_state():
    assert charge([0.5, 0.5], [0.5, 0.5]) == 0.0
    assert abs(charge([1.0, 0.0], [0.0, 1.0]) - 0.001) < 1e-12
    assert state([1.0, 2.0], [0.5, 0.5]) == ((1.0, 2.0), (0.5, 0.5))
