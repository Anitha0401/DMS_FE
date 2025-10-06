import { jsPDF } from "jspdf";

export function downloadAsPDF(headerText: string, manualText: string) {
    const htmlContent = `
        <table class="header-table" style="width:100%;border-collapse: collapse;">
            <tr>
                <td style="width:10%; text-align:center;">
                    <img src="logo.png" alt="Company Logo" width="80">
                </td>
                <td style="width:50%; text-align:center;">
                    <div style="border-bottom:1px solid #000;"><h2>Fleet Maintenance Manual</h2></div>
                    <div><h3>${headerText}</h3></div>
                </td>
                <td style="width:40%; text-align:left;">
                    <table style="width:100%;">
                        <tr>
                            <td style="border: none;"><strong>DOCUMENT ID</strong></td>
                            <td style="border: none;">FMM</td>
                        </tr>
                        <tr>
                            <td style="border: none;"><strong>ISSUED BY</strong></td>
                            <td style="border: none;">DPA</td>
                        </tr>
                        <tr>
                            <td style="border: none;"><strong>SECTION</strong></td>
                            <td style="border: none;">2.1</td>
                        </tr>
                        <tr>
                            <td style="border: none;"><strong>REV. NO.</strong></td>
                            <td style="border: none;">1.0</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <div style="margin-top: 16px; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;">
            ${manualText}
        </div>
    `;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    // Create a temporary element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    doc.html(tempDiv, {
        callback: function (doc) {
            doc.save(`${headerText || 'manual'}.pdf`);
            document.body.removeChild(tempDiv); // Clean up
        },
        x: 20,
        y: 20,
        width: 555, // a4 width minus margins (595 - 2*20)
        windowWidth: 800 // helps with scaling
    });
}