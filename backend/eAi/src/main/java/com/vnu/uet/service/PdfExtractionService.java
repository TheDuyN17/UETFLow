package com.vnu.uet.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class PdfExtractionService {

    private final Logger log = LoggerFactory.getLogger(PdfExtractionService.class);

    /**
     * Extracts text from a PDF file using Apache PDFBox.
     */
    public String extractTextFromPdf(MultipartFile file) {
        log.info("Extracting text from PDF: {}", file.getOriginalFilename());
        
        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(is))) {
             
            if (document.isEncrypted()) {
                log.warn("Document is encrypted. Extraction may fail.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            
            if (text == null || text.trim().isEmpty()) {
                log.warn("Extracted text is empty. File might be a scanned image.");
                // TODO: Fallback to Tesseract OCR or Gemini Vision here if needed
            }
            
            return text;
        } catch (Exception e) {
            log.error("Error extracting text from PDF", e);
            throw new RuntimeException("Failed to extract text from PDF", e);
        }
    }
}
