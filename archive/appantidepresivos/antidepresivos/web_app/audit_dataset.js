const fs = require('fs');

function audit() {
    try {
        const filePath = 'c:/Users/Admin/Desktop/Antidepresivos/appantidepresivos/antidepresivos/web_app/public/data/dataset.antidepresivos.v1.0.0.json';
        if (!fs.existsSync(filePath)) {
            console.error("File not found: " + filePath);
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        const farmacos = data.farmacos || [];

        const reports = [];

        farmacos.forEach(f => {
            const id = f.id_farmaco || 'NO_ID';
            const name = f.nombre_generico || 'NO_NAME';

            // Check for data shift (Esketamina pattern)
            if (f.riesgo_sindrome_abstinencia && f.riesgo_sindrome_abstinencia.includes('suicida')) {
                 reports.push(`[SHIFT] ${name} (${id}): 'riesgo_sindrome_abstinencia' contains utility text.`);
            }
            if (f.interacciones_contraindicadas === 'Bajo' || f.interacciones_contraindicadas === 'Alto') {
                 reports.push(`[SHIFT] ${name} (${id}): 'interacciones_contraindicadas' contains a rating.`);
            }

            // Check for missing data
            if (!f.perlas_clinicas) reports.push(`[MISSING] ${name} (${id}): perlas_clinicas`);
            if (!f.evidence || !f.evidence.perlas_clinicas || f.evidence.perlas_clinicas.length === 0) {
                 reports.push(`[MISSING EVIDENCE] ${name} (${id}): evidence`);
            }
        });

        console.log(`Audited ${farmacos.length} drugs.`);
        console.log(`Found ${reports.length} issues.`);
        reports.forEach(r => console.log(r));

    } catch (err) {
        console.error("Audit failed:");
        console.error(err);
    }
}

audit();
