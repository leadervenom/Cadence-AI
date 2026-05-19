from dataclasses import dataclass
from backend.database import get_connection


# Simulated extracted VIP names from uploaded document.
# Later this will come from AI document extraction.
EXTRACTED_ATTENDING_VIP_NAMES = [
    "ONN HAFIZ",
    "MOHAMMED RIDHA",
    "MOHD PUAD",
    "ZAHARI",
    "MOHD JAFNI",
    "RAVEN KUMAR",
    "KHAIRIN-NISA"
]


@dataclass
class VIP:
    rank_number: int
    honorific_title: str
    full_name: str
    position_title: str


@dataclass
class SeatingAssignment:
    protocol_position: int
    side: str
    distance_from_center: int
    vip: VIP


def fetch_vip_from_database(cursor, search_name: str) -> VIP | None:
    cursor.execute(
        """
        SELECT
            rank_number,
            honorific_title,
            full_name,
            position_title
        FROM current_vip_leaderboard
        WHERE full_name ILIKE %s
        ORDER BY rank_number ASC
        LIMIT 1;
        """,
        (f"%{search_name}%",)
    )

    row = cursor.fetchone()

    if row is None:
        return None

    return VIP(
        rank_number=row[0],
        honorific_title=row[1],
        full_name=row[2],
        position_title=row[3]
    )


def get_position_details(protocol_position: int) -> tuple[str, int]:
    """
    Protocol seating rule:

    Position 1 = center
    Position 2 = right
    Position 3 = left
    Position 4 = right
    Position 5 = left
    Position 6 = right
    Position 7 = left

    Even positions go to the right.
    Odd positions after 1 go to the left.
    """

    if protocol_position == 1:
        return "center", 0

    if protocol_position % 2 == 0:
        return "right", protocol_position // 2

    return "left", protocol_position // 2


def create_seating_arrangement(attending_vips: list[VIP]) -> list[SeatingAssignment]:
    """
    Sort VIPs by official database rank.
    Then assign protocol positions.

    Highest ranked VIP gets protocol position 1.
    Second gets position 2.
    Third gets position 3.
    """

    sorted_vips = sorted(attending_vips, key=lambda vip: vip.rank_number)

    assignments = []

    for index, vip in enumerate(sorted_vips, start=1):
        side, distance = get_position_details(index)

        assignments.append(
            SeatingAssignment(
                protocol_position=index,
                side=side,
                distance_from_center=distance,
                vip=vip
            )
        )

    return assignments


def print_priority_leaderboard(assignments: list[SeatingAssignment]) -> None:
    print("\nVIP PRIORITY LEADERBOARD")
    print("-" * 130)
    print(f"{'Priority':<10} {'DB Rank':<10} {'Position':<10} {'Side':<10} {'Name':<40} {'Official Position'}")
    print("-" * 130)

    sorted_by_priority = sorted(assignments, key=lambda item: item.protocol_position)

    for assignment in sorted_by_priority:
        vip = assignment.vip

        print(
            f"{assignment.protocol_position:<10} "
            f"{vip.rank_number:<10} "
            f"{assignment.protocol_position:<10} "
            f"{assignment.side:<10} "
            f"{vip.full_name:<40} "
            f"{vip.position_title}"
        )


def print_front_row(assignments: list[SeatingAssignment]) -> None:
    """
    Prints physical seating from left to right.

    Since position 1 is center:
    Left side positions are odd: 3, 5, 7
    Right side positions are even: 2, 4, 6

    For 7 VIPs, physical row becomes:
    7 | 5 | 3 | 1 | 2 | 4 | 6
    """

    print("\nFRONT ROW SEATING ARRANGEMENT")
    print("Stage is in front of the VIPs.")
    print("Left to right view from the audience side.")
    print("-" * 130)

    def physical_order_key(assignment: SeatingAssignment):
        if assignment.side == "left":
            return -assignment.distance_from_center
        if assignment.side == "center":
            return 0
        return assignment.distance_from_center

    sorted_by_physical_position = sorted(assignments, key=physical_order_key)

    for assignment in sorted_by_physical_position:
        vip = assignment.vip

        print(
            f"Protocol Position {assignment.protocol_position}: "
            f"{assignment.side.upper()} "
            f"| DB Rank {vip.rank_number} "
            f"| {vip.honorific_title or ''} {vip.full_name}"
        )


def main():
    conn = get_connection()
    cursor = conn.cursor()

    attending_vips = []
    missing_names = []

    for extracted_name in EXTRACTED_ATTENDING_VIP_NAMES:
        vip = fetch_vip_from_database(cursor, extracted_name)

        if vip is None:
            missing_names.append(extracted_name)
        else:
            attending_vips.append(vip)

    cursor.close()
    conn.close()

    if missing_names:
        print("\nThese extracted names were not found in the database:")
        for name in missing_names:
            print(f"- {name}")

    if not attending_vips:
        print("No VIPs found. Cannot generate seating.")
        return

    assignments = create_seating_arrangement(attending_vips)

    print_priority_leaderboard(assignments)
    print_front_row(assignments)


if __name__ == "__main__":
    main()