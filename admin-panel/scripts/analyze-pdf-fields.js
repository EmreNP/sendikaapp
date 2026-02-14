import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function analyze() {
  const pdfPath = path.join(__dirname, '../public/templates/kayitformu.pdf');
  console.log('Reading PDF from:', pdfPath);
  
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('\n--- PDF Fields Analysis ---');
    console.log(`Total Fields: ${fields.length}`);
    
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`- [${type}] ${name}`);
    });
    
  } catch (error) {
    console.error('Error analyzing PDF:', error);
  }
}

analyze();
