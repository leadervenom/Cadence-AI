from database import get_vip_leaderboard

vips = get_vip_leaderboard()

for vip in vips[:10]:
    print(vip)