import { fetchData } from "./helper-functions.js";

export function setupDownloadButton(gallery) {
  const downloadButton = document.getElementById("download");

  if (!downloadButton) return; // Stop if no button found

  downloadButton.addEventListener("click", async () => {
    try {
      // Ensure gallery and selectedVisual exist before accessing properties
      if (
        !gallery ||
        !gallery.selectedVisual ||
        !gallery.selectedVisual.collectionName
      ) {
        console.error("No dataset found for the selected visualization.");
        return;
      }

      const collectionName = gallery.selectedVisual.collectionName;

      // Temporary fix for aggregated data not available to download yet
      if (collectionName === "tech_diversity_mst") {
        alert("Oh no, we didn't get to that yet :( Please check back later!");
        return;
      }
      const data = await fetchData(collectionName);

      if (!data || data.length === 0) {
        console.error(`No data found in "${collectionName}".`);
        return;
      }

      // Convert data to a downloadable JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a download link
      const link = document.createElement("a");
      const objectURL = URL.createObjectURL(blob);
      link.href = objectURL;
      link.download = `${collectionName}.json`;

      // Trigger the download
      link.click();

      // Clean up: Revoke the object URL after download to free memory
      setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    } catch (error) {
      console.error("Download error", error);
    }
  });
}
