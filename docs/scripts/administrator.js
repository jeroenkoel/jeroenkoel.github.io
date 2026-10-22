function showSection(sectionId, clickedButton) {

    // Get all content sections
    const sections =
        document.querySelectorAll(".admin-section");



    // Hide all sections
    sections.forEach(section => {
        section.classList.remove("active-section");
    });


    // Show the selected section
    document
        .getElementById(sectionId)
        .classList.add("active-section");


    // Get all sidebar buttons
    const buttons =
        document.querySelectorAll(".sidebar-button");


    // Remove highlight from all buttons
    buttons.forEach(button => {
        button.classList.remove("active");
    });


    // Highlight clicked button
    clickedButton.classList.add("active");

}

document.addEventListener("DOMContentLoaded", () => {
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener("click", async () => {
            try {
                const response = await fetch('/api/export-csv');
                if (!response.ok) {
                    const result = await response.json();
                    alert(result.message) || "Failed to download CSV";
                    return;
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "participant_data.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Error downloading CSV: ", err);
                alert("An error occurred while downloading the CSV file");
            }
        });
    }
});