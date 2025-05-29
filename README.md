CyberSpace

A game where you play inside a futuristic grid city trying to save a dying system! Collect keys, dodge bots, and deliver energy shards back to base to keep the system alive.

How I Made the Map ??
    • The game world is built using a grid system on HTML5 canvas
    • The whole canvas is divided into tiles using a fixed tileSize.
    • Inside each tile, I create a garden area with buildings randomly placed inside.
    • A special base and a hub are also placed on random tiles — but not too close to each other or the edges.
    • I added towers in most tiles that can damage you if you're in their range. If destroyed, they rebuild over time.
    • Buildings block movement, towers rotate and attack, and bots move around too.


Controls
    • W / ArrowUp: Move Up
    • S / ArrowDown: Move Down
    • A / ArrowLeft: Move Left
    • D / ArrowRight: Move Right
    • Click : Shoot a bouncing bullet in the clicked direction

Objective
    • Collect 5 keys from around the map.
    • Go to the hub to convert them into shards.
    • Return to the base to deliver shards and increase system health.
    • If system health reaches 100 → YOU WIN!
    • If system health hits 0 or you die → Game Over.

Key Features
Bots
There are 3 types of enemy bots:
    • LightBot 🟡 – Fast, small, medium damage
    • HeavyBot 🔵 – Slow, big, tanky, deals more damage
    • SniperBot 🟣 – Doesn’t chase, but shoots from far with strong damage
Towers
    • Each tile (except base and hub) may have a rotating laser tower.
    • If you’re inside their laser cone and not shielded → you'll take damage!
    • Towers can be destroyed by damaging buildings in their tile.
    • After being destroyed, they rebuild slowly over time.
Items
    • Keys – Needed to collect shards
    • Shields  – Makes you immune to towers for 6 seconds
    • Health Packs – Heal 20% of your health
    • Speed Boosters  – Double your movement speed for 5 seconds
