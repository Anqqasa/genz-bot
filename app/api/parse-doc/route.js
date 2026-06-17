import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();
    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      // Parse PDF
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (fileName.endsWith('.docx')) {
      // Parse Word
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      // Parse Excel / CSV
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let allText = [];
      // Extract from all sheets
      workbook.SheetNames.forEach(sheetName => {
        allText.push(`--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        allText.push(xlsx.utils.sheet_to_csv(sheet));
      });
      extractedText = allText.join('\n\n');
    } else if (fileName.endsWith('.txt')) {
      // Parse Text
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PDF, DOCX, XLSX, CSV, atau TXT.' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json({ error: 'Dokumen kosong atau teks tidak bisa dibaca.' }, { status: 400 });
    }

    return NextResponse.json({ text: extractedText.trim() });
  } catch (error) {
    console.error('Error parsing document:', error);
    return NextResponse.json({ error: `Gagal membaca dokumen: ${error.message}` }, { status: 500 });
  }
}
