WEIGHTS = {
    "trend_follower": {
        "residual_trend": 0.5,
        "autocorrelation": 0.2,
        "holding_period": 0.2,
        "reversal": -0.1,
    },
    "contrarian": {
        "reversal": 0.5,
        "turnover": 0.3,
        "residual_trend": -0.2,
    },
    "risk_manager": {
        "defensive_tilt": 0.4,
        "minus_downside_capture": 0.3,
        "minus_largest_weight": 0.2,
        "defensive_response_to_volatility": 0.1,
    },
    "speculator": {
        "lottery_tilt": 0.4,
        "concentration": 0.3,
        "largest_weight": 0.2,
        "upside_capture": 0.1,
    },
    "tactical_rotator": {
        "rotation": 0.5,
        "tilt_variance_across_regimes": 0.3,
        "tilt_variance_within_regime": -0.2,
    },
}

LEAD = 0.25


def score(name, coordinates):
    total = 0.0
    for key, weight in WEIGHTS[name].items():
        total += weight * float(coordinates[key])
    return total


def file_name(coordinates):
    ranked = sorted(
        ((name, score(name, coordinates)) for name in WEIGHTS),
        key=lambda item: item[1],
        reverse=True,
    )
    winner, best = ranked[0]
    runner, second = ranked[1]
    gap = best - second
    if gap < LEAD:
        return "generalist", winner, gap
    return winner, runner, gap
