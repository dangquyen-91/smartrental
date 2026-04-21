import puppeteer from 'puppeteer';
import cloudinary from '../config/cloudinary.js';
import { buildContractHtml } from './contract-template.js';

const generateAndUploadContractPdf = async (contractData) => {
  const html = buildContractHtml(contractData);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return uploadPdfToCloudinary(pdfBuffer, `contract_${contractData.contractId}`);
  } finally {
    await browser.close();
  }
};

const uploadPdfToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'smartrental/contracts',
        public_id: publicId,
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};

export { generateAndUploadContractPdf };
