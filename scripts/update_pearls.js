const fs = require('fs');
const path = require('path');

const DATASET_PATH = 'c:/Users/Admin/Desktop/Antidepresivos/appantidepresivos/antidepresivos/web_app/public/data/dataset.antidepresivos.v1.0.0.json';
const MISSING_PEARLS_PATH = 'c:/Users/Admin/Desktop/Antidepresivos/appantidepresivos/antidepresivos/web_app/public/data/missing_pearls.json';

try {
    const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
    const missingPearls = JSON.parse(fs.readFileSync(MISSING_PEARLS_PATH, 'utf8'));

    let updatedCount = 0;

    missingPearls.forEach(item => {
        const farmaco = dataset.farmacos.find(f => f.id_farmaco === item.id);
        if (farmaco) {
            // Update Clinical Pearls
            if (item.patch && item.patch.perlas_clinicas) {
                farmaco.perlas_clinicas = item.patch.perlas_clinicas;
            }

            // Update Evidence
            // Initialize evidence array if it doesn't exist
            if (!farmaco.evidence) {
                farmaco.evidence = {};
            }

            if (item.evidence && item.evidence.perlas_clinicas) {
                farmaco.evidence.perlas_clinicas = item.evidence.perlas_clinicas;
            }

            updatedCount++;
        } else {
            console.warn(`Warning: Farmaco with ID ${item.id} not found.`);
        }
    });

    fs.writeFileSync(DATASET_PATH, JSON.stringify(dataset, null, 4), 'utf8');
    console.log(`Successfully updated ${updatedCount} items.`);

} catch (err) {
    console.error('Error updating dataset:', err);
    process.exit(1);
}
