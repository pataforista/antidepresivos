/* ============================================================
   src/core/utils.js
   Centralized Security & Logic Utilities
   ============================================================ */

/**
 * Robust HTML escaping to mitigate XSS vulnerabilities.
 * Encodes key characters: &, <, >, ", '
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Deep clone utility (lite)
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Validates a value is a valid numeric string or number
 */
export function isValidNumber(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
}
