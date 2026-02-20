# 💾 Disk Scheduling Algorithm Simulator

A full-stack web application that simulates classic **disk scheduling algorithms** used in Operating Systems. Built with a **Python Flask** backend and a **Vanilla JS** frontend with real-time **Chart.js** visualizations.

---

## 📸 Preview

| Single Simulation | Algorithm Comparison |
|---|---|
| Select an algorithm, hit Simulate | Compare all 6 algorithms side-by-side |
| Line chart of head movement | Bar chart of total seek times |

---

## 🧠 Algorithms Implemented

| Algorithm | Description |
|---|---|
| **FCFS** | First Come First Served – processes requests in arrival order |
| **SSTF** | Shortest Seek Time First – always moves to the nearest request |
| **SCAN** | Elevator – sweeps right to the end, then reverses |
| **C-SCAN** | Circular SCAN – sweeps right, jumps to 0, sweeps right again |
| **LOOK** | Like SCAN but only goes as far as the last request |
| **C-LOOK** | Like C-SCAN but only goes as far as the last request on each end |

---

## 🗂️ Project Structure

```
OS_MINOR/
├── app.py                  # Flask backend – REST API + algorithm logic
├── templates/
│   └── index.html          # Main UI page
├── static/
│   ├── style.css           # Dark-themed responsive stylesheet
│   └── script.js           # Fetch API calls + Chart.js visualizations
└── README.md
```

---

## ⚙️ Tech Stack

- **Backend:** Python 3, Flask
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Charts:** [Chart.js v4](https://www.chartjs.org/)
- **API:** REST (JSON over HTTP)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/OS_MINOR.git
cd OS_MINOR
```

### 2. Install Dependencies

```bash
pip install flask
```

> Or inside a virtual environment:
> ```bash
> python3 -m venv venv
> source venv/bin/activate   # Windows: venv\Scripts\activate
> pip install flask
> ```

### 3. Run the Server

```bash
python3 app.py
```

Open your browser at **http://127.0.0.1:5000**

---

## 🔌 API Reference

### `POST /simulate`

**Request body:**

```json
{
  "requests": [98, 183, 37, 122, 14, 124, 65, 67],
  "head": 53,
  "disk_size": 200,
  "algorithm": "FCFS"
}
```

Set `"algorithm": "ALL"` to run all algorithms at once (used by the **Compare All** button).

**Response (single algorithm):**

```json
{
  "seek_sequence": [98, 183, 37, 122, 14, 124, 65, 67],
  "total_seek_time": 640,
  "average_seek_time": 80.0
}
```

**Response (ALL):**

```json
{
  "FCFS":   { "seek_sequence": [...], "total_seek_time": 640,  "average_seek_time": 80.0  },
  "SSTF":   { "seek_sequence": [...], "total_seek_time": 236,  "average_seek_time": 29.5  },
  "SCAN":   { "seek_sequence": [...], "total_seek_time": 331,  "average_seek_time": 41.38 },
  "C-SCAN": { "seek_sequence": [...], "total_seek_time": 382,  "average_seek_time": 47.75 },
  "LOOK":   { "seek_sequence": [...], "total_seek_time": 299,  "average_seek_time": 37.38 },
  "C-LOOK": { "seek_sequence": [...], "total_seek_time": 322,  "average_seek_time": 40.25 }
}
```

---

## 📊 Sample Results

Input: `requests = [98, 183, 37, 122, 14, 124, 65, 67]`, `head = 53`, `disk_size = 200`

| Algorithm | Total Seek Time | Average Seek Time |
|-----------|:--------------:|:-----------------:|
| FCFS      | 640            | 80.00             |
| **SSTF**  | **236**        | **29.50** ★ Best  |
| SCAN      | 331            | 41.38             |
| C-SCAN    | 382            | 47.75             |
| LOOK      | 299            | 37.38             |
| C-LOOK    | 322            | 40.25             |

---

## ✨ Features

- ✅ 6 disk scheduling algorithms
- ✅ Interactive single-algorithm simulation
- ✅ One-click **Compare All** table with best algorithm highlighted
- ✅ **Chart.js** line chart (head movement) and bar chart (seek time comparison)
- ✅ Client-side + server-side input validation
- ✅ Smooth CSS animations & responsive dark-mode UI
- ✅ Fully modular Python backend — no global variables

---

