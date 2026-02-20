"""
Disk Scheduling Algorithm Simulator - Flask Backend
Implements FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK algorithms.
"""

from flask import Flask, request, jsonify, render_template

app = Flask(__name__)


# ──────────────────────────────────────────────
# Algorithm implementations
# ──────────────────────────────────────────────

def fcfs(requests, head):
    """First Come First Served."""
    sequence = []
    total = 0
    current = head
    for r in requests:
        total += abs(r - current)
        current = r
        sequence.append(r)
    return sequence, total


def sstf(requests, head):
    """Shortest Seek Time First."""
    pending = list(requests)
    sequence = []
    total = 0
    current = head
    while pending:
        closest = min(pending, key=lambda r: abs(r - current))
        total += abs(closest - current)
        current = closest
        sequence.append(closest)
        pending.remove(closest)
    return sequence, total


def scan(requests, head, disk_size):
    """SCAN (Elevator) – moves toward 0 first, then reverses."""
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    sequence = []
    total = 0
    current = head

    # Move right first, then sweep left
    for r in right:
        total += abs(r - current)
        current = r
        sequence.append(r)

    # Go to end of disk
    if right or current != disk_size - 1:
        total += abs(disk_size - 1 - current)
        current = disk_size - 1
        sequence.append(disk_size - 1)

    # Sweep left
    for r in reversed(left):
        total += abs(r - current)
        current = r
        sequence.append(r)

    return sequence, total


def cscan(requests, head, disk_size):
    """C-SCAN – moves right, jumps to 0, continues right."""
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    sequence = []
    total = 0
    current = head

    # Move right
    for r in right:
        total += abs(r - current)
        current = r
        sequence.append(r)

    # Go to end
    if current != disk_size - 1:
        total += abs(disk_size - 1 - current)
        current = disk_size - 1
        sequence.append(disk_size - 1)

    # Jump to 0
    total += current  # distance from end to 0
    current = 0
    sequence.append(0)

    # Serve left side (now moving right from 0)
    for r in left:
        total += abs(r - current)
        current = r
        sequence.append(r)

    return sequence, total


def look(requests, head):
    """LOOK – like SCAN but only goes to last request in each direction."""
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    sequence = []
    total = 0
    current = head

    # Move right
    for r in right:
        total += abs(r - current)
        current = r
        sequence.append(r)

    # Sweep left
    for r in reversed(left):
        total += abs(r - current)
        current = r
        sequence.append(r)

    return sequence, total


def clook(requests, head):
    """C-LOOK – like C-SCAN but only goes to last request in each direction."""
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    sequence = []
    total = 0
    current = head

    # Move right
    for r in right:
        total += abs(r - current)
        current = r
        sequence.append(r)

    # Jump to smallest request
    if left:
        total += abs(left[0] - current)
        current = left[0]
        sequence.append(left[0])
        for r in left[1:]:
            total += abs(r - current)
            current = r
            sequence.append(r)

    return sequence, total


# ──────────────────────────────────────────────
# Algorithm dispatcher
# ──────────────────────────────────────────────

ALGORITHMS = {
    "FCFS": lambda req, h, ds: fcfs(req, h),
    "SSTF": lambda req, h, ds: sstf(req, h),
    "SCAN": lambda req, h, ds: scan(req, h, ds),
    "C-SCAN": lambda req, h, ds: cscan(req, h, ds),
    "LOOK": lambda req, h, ds: look(req, h),
    "C-LOOK": lambda req, h, ds: clook(req, h),
}


def run_algorithm(name, requests, head, disk_size):
    """Run a single algorithm and return its result dict."""
    if name not in ALGORITHMS:
        return None
    seq, total = ALGORITHMS[name](requests, head, disk_size)
    avg = round(total / len(requests), 2) if requests else 0
    return {
        "seek_sequence": seq,
        "total_seek_time": total,
        "average_seek_time": avg,
    }


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = request.get_json(force=True)

        requests_raw = data.get("requests")
        head = data.get("head")
        disk_size = data.get("disk_size")
        algorithm = data.get("algorithm", "").upper()

        # ── validation ──
        if requests_raw is None or head is None or disk_size is None:
            return jsonify({"error": "Missing required fields: requests, head, disk_size"}), 400

        if not isinstance(requests_raw, list) or len(requests_raw) == 0:
            return jsonify({"error": "requests must be a non-empty list of integers"}), 400

        try:
            requests_list = [int(r) for r in requests_raw]
            head = int(head)
            disk_size = int(disk_size)
        except (ValueError, TypeError):
            return jsonify({"error": "requests, head and disk_size must be valid integers"}), 400

        if disk_size <= 0:
            return jsonify({"error": "disk_size must be a positive integer"}), 400

        if head < 0 or head >= disk_size:
            return jsonify({"error": f"head must be between 0 and {disk_size - 1}"}), 400

        for r in requests_list:
            if r < 0 or r >= disk_size:
                return jsonify({"error": f"All requests must be between 0 and {disk_size - 1}"}), 400

        # ── compare-all mode ──
        if algorithm == "ALL":
            results = {}
            for name in ALGORITHMS:
                results[name] = run_algorithm(name, requests_list, head, disk_size)
            return jsonify(results)

        # ── single algorithm ──
        result = run_algorithm(algorithm, requests_list, head, disk_size)
        if result is None:
            supported = ", ".join(ALGORITHMS.keys())
            return jsonify({"error": f"Unknown algorithm '{algorithm}'. Supported: {supported}"}), 400

        return jsonify(result)

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
