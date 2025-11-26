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
