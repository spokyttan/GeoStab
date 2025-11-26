import sys
import os
import numpy as np

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from engine.math_engine import planar_failure, wedge_failure, dipdir_dip_to_normal

def test_planar_failure():
    print("\n--- Testing Planar Failure ---")
    
    # Case 1: Risk Detected
    # Slope: DipDir 180, Dip 60
    # Fracture: DipDir 180, Dip 40 (Daylights: 40 < 60)
    # Friction: 30 (Friction: 40 > 30)
    talud = {'alpha': 180, 'beta': 60}
    fractura = {'alpha': 180, 'beta': 40}
    phi = 30
    
    result = planar_failure(talud, fractura, phi)
    print(f"Case 1 (Risk Expected): {result['risk_detected']}")
    if not result['risk_detected']:
        print(f"  FAILED: {result['explanation']}")
    else:
        print("  PASSED")

    # Case 2: No Risk - No Daylighting
    # Fracture Dip 70 > Slope Dip 60
    fractura_no_daylight = {'alpha': 180, 'beta': 70}
    result = planar_failure(talud, fractura_no_daylight, phi)
    print(f"Case 2 (No Risk - No Daylight): {not result['risk_detected']}")
    if result['risk_detected']:
        print(f"  FAILED: {result['explanation']}")
    else:
        print("  PASSED")

    # Case 3: No Risk - Friction
    # Fracture Dip 20 < Friction 30
    fractura_friction = {'alpha': 180, 'beta': 20}
    result = planar_failure(talud, fractura_friction, phi)
    print(f"Case 3 (No Risk - Friction): {not result['risk_detected']}")
    if result['risk_detected']:
        print(f"  FAILED: {result['explanation']}")
    else:
        print("  PASSED")

    # Case 4: No Risk - Strike
    # Fracture DipDir 090 (Diff 90 > 20)
    fractura_strike = {'alpha': 90, 'beta': 40}
    result = planar_failure(talud, fractura_strike, phi)
    print(f"Case 4 (No Risk - Strike): {not result['risk_detected']}")
    if result['risk_detected']:
        print(f"  FAILED: {result['explanation']}")
    else:
        print("  PASSED")

def test_wedge_failure():
    print("\n--- Testing Wedge Failure ---")
    
    # Slope: DipDir 180, Dip 60
    talud_normal = dipdir_dip_to_normal(180, 60)
    phi = 30
    
    # Case 1: Intersection Plunge > Friction
    # Plane A: DipDir 135, Dip 45
    # Plane B: DipDir 225, Dip 45
    # Intersection should be roughly South (180) plunging < 45
    nA = dipdir_dip_to_normal(135, 45)
    nB = dipdir_dip_to_normal(225, 45)
    
    # Note: The current implementation of wedge_failure in math_engine.py seems incomplete 
    # based on the file content I read (it ended abruptly or seemed short).
    # Let's check if it returns a valid result.
    
    try:
        result = wedge_failure(nA, nB, talud_normal, phi)
        print(f"Case 1 Result: {result}")
    except Exception as e:
        print(f"Case 1 FAILED with error: {e}")

if __name__ == "__main__":
    test_planar_failure()
    test_wedge_failure()
