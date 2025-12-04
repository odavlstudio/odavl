// ODAVL Insight CLI — يعرض أحدث تحليلات الأخطاء من Insight
import * as fsp from "node:fs/promises";
import * as path from "node:path";

const logsPath = path.join(process.cwd(), ".odavl/insight/logs/latest.json");

function color(text: string, code: number) {
    return `\x1b[${code}m${text}\x1b[0m`;
}

function printInsightTable(errors: any[]) {
    console.log("\n🧠 ODAVL Insight – Latest Diagnostics");
    console.log("\u2500".repeat(45));
    for (const err of errors) {
        const type = color(err.analysis?.category || err.type || "?", 36); // cyan
        const loc = err.file ? `${err.file}${err.line ? ":" + err.line : ""}` : "-";
        const root = err.analysis?.rootCause || "-";
        const fix = err.analysis?.autoFixHint || err.analysis?.fixHint || "-";
        const conf = err.analysis?.confidence !== undefined ? Math.round((err.analysis.confidence || 0) * 100) : undefined;
        console.log(`${type}  ${loc}`);
        console.log(`↳ Root Cause: ${root}`);
        console.log(`↳ Fix Hint: ${fix}`);
        if (conf !== undefined) console.log(`↳ Confidence: ${conf}%`);
        console.log("\u2500".repeat(45));
    }
}

async function main() {
    try {
        await fsp.access(logsPath);
    } catch {
        console.log(color("[ODAVL Insight] لا يوجد سجل أخطاء حديث.", 33));
        process.exit(0);
    }
    const raw = await fsp.readFile(logsPath, "utf8");
    let errors: any[] = [];
    try {
        errors = JSON.parse(raw);
    } catch {
        console.log(color("[ODAVL Insight] تعذر قراءة السجل.", 31));
        process.exit(1);
    }
    if (!Array.isArray(errors) || errors.length === 0) {
        console.log(color("[ODAVL Insight] لا توجد أخطاء مسجلة.", 32));
        process.exit(0);
    }
    printInsightTable(errors);
}


export { main };


// دعم ESM/TSX: تنفيذ main إذا كان الملف هو نقطة الدخول
if (process.argv[1]?.endsWith('insight.ts') || process.argv[1]?.endsWith('insight.js') || (typeof import.meta !== 'undefined' && import.meta.url && import.meta.url.endsWith('/insight.ts'))) {
    void main();
}
