import time
import os
import math
from datetime import datetime

def cpu_task(duration=10):
    """
    Performs a CPU-intensive calculation for a specified duration.
    """
    print(f"[{datetime.now()}] Starting CPU task for {duration} seconds...", flush=True)
    start_time = time.time()
    count = 0
    while time.time() - start_time < duration:
        # Perform calculation: calculate square roots in a loop
        # This keeps the CPU busy
        for i in range(1000, 10000):
            math.sqrt(i) * math.sqrt(i+1)
        count += 1
    print(f"[{datetime.now()}] CPU task completed. Cycles: {count}", flush=True)

def main():
    # Default sleep interval: 12 hours (43200 seconds)
    # Can be overridden by environment variable VITALITY_INTERVAL
    sleep_interval = int(os.environ.get('VITALITY_INTERVAL', 43200))

    print(f"[{datetime.now()}] Vitality Guard started. Interval: {sleep_interval}s", flush=True)

    while True:
        try:
            cpu_task()
        except Exception as e:
            print(f"[{datetime.now()}] Error during CPU task: {e}", flush=True)

        print(f"[{datetime.now()}] Sleeping for {sleep_interval} seconds...", flush=True)
        time.sleep(sleep_interval)

if __name__ == "__main__":
    main()
