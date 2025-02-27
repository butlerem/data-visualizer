// invertData function that groups docs by company
function invertData(raceDocs) {
  let companiesMap = {};
  // Loop through each document in the array
  raceDocs.forEach((doc) => {
    // Get the company name from the doc
    const companyName = doc.company;
    // Get the race name for this doc
    const raceName = doc.race;
    // If we don't have an entry for this company yet, create one
    if (!companiesMap[companyName]) {
      companiesMap[companyName] = { company: companyName };
    }
    // For the given race, store the value from the property with the same name
    companiesMap[companyName][raceName] = parseFloat(doc[raceName]) || 0;
  });
  // Return an array of company objects
  return Object.values(companiesMap);
}

// Dummy data to simulate Firestore documents
const dummyRaceDocs = [
  // For CompanyA, we have two documents: one for white and one for black
  { race: "white", company: "CompanyA", white: "50", black: "20" },
  { race: "black", company: "CompanyA", white: "50", black: "20" },
  // For CompanyB, we have two documents: one for white and one for asian
  { race: "white", company: "CompanyB", white: "60", black: "15", asian: "0" },
  { race: "asian", company: "CompanyB", white: "60", black: "15", asian: "15" },
];

// Test the invertData function
function testInvertData() {
  const result = invertData(dummyRaceDocs);

  // We expect exactly 2 companies in the result
  console.assert(
    result.length === 2,
    "Expected 2 companies, got " + result.length
  );

  // Find CompanyA in the result and check its values
  const companyA = result.find((comp) => comp.company === "CompanyA");
  console.assert(companyA, "CompanyA should be present");
  if (companyA) {
    // For CompanyA, we expect a white value of 50 and black value of 20
    console.assert(companyA.white === 50, "CompanyA white should be 50");
    console.assert(companyA.black === 20, "CompanyA black should be 20");
  }

  // Find CompanyB in the result and check its values
  const companyB = result.find((comp) => comp.company === "CompanyB");
  console.assert(companyB, "CompanyB should be present");
  if (companyB) {
    // For CompanyB, we expect a white value of 60 and asian value of 15
    console.assert(companyB.white === 60, "CompanyB white should be 60");
    console.assert(companyB.asian === 15, "CompanyB asian should be 15");
  }

  console.log("invertData tests passed");
}

// Math test example
function testMath() {
  const expected = 2;
  // Check that 1 + 1 equals 2
  console.assert(1 + 1 === expected, "1 + 1 should equal " + expected);
  console.log("Math test passed");
}

// Run all tests
function runTests() {
  testMath(); // Run the simple math test
  testInvertData(); // Run the invertData test
}

// Run tests when the page loads
document.addEventListener("DOMContentLoaded", runTests);
