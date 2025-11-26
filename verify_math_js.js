const MathEngine = require('./public/js/math_engine.js');

function testPlanarFailure() {
    console.log("\n--- Testing Planar Failure (JS) ---");

    const talud = { rumbo: 180, manteo: 60 };
    const phi = 30;

    // Case 1: Risk Expected
    const f1 = { rumbo: 180, manteo: 40 };
    const r1 = MathEngine.analyzePlanar(talud, f1, phi);
    console.log(`Case 1 (Risk Expected): ${r1.risk_detected}`);
    if (!r1.risk_detected) console.log("  FAILED");
    else console.log("  PASSED");

    // Case 2: No Risk - No Daylight (Dip 70 > 60)
    const f2 = { rumbo: 180, manteo: 70 };
    const r2 = MathEngine.analyzePlanar(talud, f2, phi);
    console.log(`Case 2 (No Risk - No Daylight): ${!r2.risk_detected}`);
    if (r2.risk_detected) console.log("  FAILED");
    else console.log("  PASSED");

    // Case 3: No Risk - Friction (Dip 20 < 30)
    const f3 = { rumbo: 180, manteo: 20 };
    const r3 = MathEngine.analyzePlanar(talud, f3, phi);
    console.log(`Case 3 (No Risk - Friction): ${!r3.risk_detected}`);
    if (r3.risk_detected) console.log("  FAILED");
    else console.log("  PASSED");

    // Case 4: No Risk - Strike (Diff 90 > 20)
    const f4 = { rumbo: 90, manteo: 40 };
    const r4 = MathEngine.analyzePlanar(talud, f4, phi);
    console.log(`Case 4 (No Risk - Strike): ${!r4.risk_detected}`);
    if (r4.risk_detected) console.log("  FAILED");
    else console.log("  PASSED");
}

function testWedgeFailure() {
    console.log("\n--- Testing Wedge Failure (JS) ---");

    const talud = { rumbo: 180, manteo: 60 };
    const phi = 30;

    // Case 1: Risk Expected
    // F1: 135/45, F2: 225/45
    // Intersection Plunge should be ~35.26 deg
    const f1 = { rumbo: 135, manteo: 45 };
    const f2 = { rumbo: 225, manteo: 45 };

    const r1 = MathEngine.analyzeWedge(talud, f1, f2, phi);
    console.log(`Case 1 (Risk Expected): ${r1.risk_detected}`);
    console.log(`  Plunge: ${r1.details.plunge.toFixed(2)} deg`);

    if (!r1.risk_detected) console.log("  FAILED");
    else console.log("  PASSED");
}

testPlanarFailure();
testWedgeFailure();

function testStressCases() {
    console.log("\n--- Testing Stress Cases (JS) ---");

    const phi = 30;

    // Case 1: Vertical Slope (Dip 90)
    // Should be stable if fracture dip < 90 but > phi, and daylighting condition met
    const taludVert = { rumbo: 180, manteo: 90 };
    const f1 = { rumbo: 180, manteo: 80 }; // Daylights (80 < 90) and > Friction (30)
    const r1 = MathEngine.analyzePlanar(taludVert, f1, phi);
    console.log(`Stress 1 (Vertical Slope - Risk): ${r1.risk_detected}`);
    if (!r1.risk_detected) console.log("  FAILED"); else console.log("  PASSED");

    // Case 2: Horizontal Slope (Dip 0)
    // Impossible for fracture to daylight (Dip < 0 is impossible)
    const taludHoriz = { rumbo: 180, manteo: 0 };
    const f2 = { rumbo: 180, manteo: 10 };
    const r2 = MathEngine.analyzePlanar(taludHoriz, f2, phi);
    console.log(`Stress 2 (Horizontal Slope - Stable): ${!r2.risk_detected}`);
    if (r2.risk_detected) console.log("  FAILED"); else console.log("  PASSED");

    // Case 3: Wedge Parallel Planes (No Intersection)
    const talud = { rumbo: 180, manteo: 60 };
    const f3a = { rumbo: 90, manteo: 45 };
    const f3b = { rumbo: 90, manteo: 60 }; // Parallel strike
    const r3 = MathEngine.analyzeWedge(talud, f3a, f3b, phi);
    console.log(`Stress 3 (Parallel Wedge - No Intersection): ${!r3.risk_detected}`);
    if (r3.risk_detected) console.log("  FAILED"); else console.log("  PASSED");
}

testStressCases();
