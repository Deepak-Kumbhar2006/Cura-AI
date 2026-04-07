import API from "./api";

function getFilenameFromDisposition(disposition) {
    if (!disposition) return null;
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
    const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
    return basicMatch?.[1] || null;
}

export async function downloadHealthReport() {
    const response = await API.get("/api/health/report", { responseType: "blob" });
    const filename =
        getFilenameFromDisposition(response.headers?.["content-disposition"]) ||
        `health_report_${Date.now()}.pdf`;

    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
}
