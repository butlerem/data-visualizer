// Function to group documents by company and sum race data
function groupDocsByCompany(docs) {
  const companies = {};

  docs.forEach((doc) => {
    const company = doc.company;

    // Initialize the company entry if it doesn't exist
    if (!companies[company]) {
      companies[company] = { company };
    }

    // Iterate over all keys in the document (excluding 'company' and 'race')
    Object.keys(doc).forEach((key) => {
      if (key !== "company" && key !== "race") {
        // Convert to number and sum it up
        companies[company][key] =
          (companies[company][key] || 0) + (parseFloat(doc[key]) || 0);
      }
    });
  });

  return Object.values(companies);
}

// Sample Firestore documents
const sampleDocs = [
  { race: "white", company: "CompanyA", white: "50", black: "20" },
  { race: "black", company: "CompanyA", white: "50", black: "20" },
  { race: "white", company: "CompanyB", white: "60", black: "15", asian: "0" },
  { race: "asian", company: "CompanyB", white: "60", black: "15", asian: "15" },
];

// Test function
function testGroupDocsByCompany() {
  const results = groupDocsByCompany(sampleDocs);

  console.assert(
    results.length === 2,
    `Expected 2 companies, found ${results.length}`
  );

  // Validate CompanyA data
  const companyA = results.find((item) => item.company === "CompanyA");
  console.assert(companyA, "CompanyA should exist");
  if (companyA) {
    console.assert(
      companyA.white === 100,
      `CompanyA: white should be 100, found ${companyA.white}`
    );
    console.assert(
      companyA.black === 40,
      `CompanyA: black should be 40, found ${companyA.black}`
    );
  }

  // Validate CompanyB data
  const companyB = results.find((item) => item.company === "CompanyB");
  console.assert(companyB, "CompanyB should exist");
  if (companyB) {
    console.assert(
      companyB.white === 120,
      `CompanyB: white should be 120, found ${companyB.white}`
    );
    console.assert(
      companyB.black === 30,
      `CompanyB: black should be 30, found ${companyB.black}`
    );
    console.assert(
      companyB.asian === 15,
      `CompanyB: asian should be 15, found ${companyB.asian}`
    );
  }

  console.log("All tests passed for groupDocsByCompany");
}

// Run tests once the DOM content is loaded
document.addEventListener("DOMContentLoaded", testGroupDocsByCompany);
