"""Membership tier rules (会员等级)."""

# (threshold_points, level_name) ordered ascending.
LEVELS = [
    (0, "普通会员"),
    (100, "银卡会员"),
    (500, "金卡会员"),
    (2000, "钻石会员"),
]


def level_for(points: int) -> str:
    level = LEVELS[0][1]
    for threshold, name in LEVELS:
        if points >= threshold:
            level = name
        else:
            break
    return level


def next_level(points: int):
    """Return (next_level_name, points_needed) or (None, 0) if已是最高等级."""
    for threshold, name in LEVELS:
        if points < threshold:
            return name, threshold - points
    return None, 0
