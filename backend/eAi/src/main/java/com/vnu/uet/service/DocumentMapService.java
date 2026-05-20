package com.vnu.uet.service;

import com.vnu.uet.domain.DocumentExtraction;
import com.vnu.uet.domain.FilledForm;
import com.vnu.uet.repository.DocumentExtractionRepository;
import com.vnu.uet.repository.FilledFormRepository;
import com.vnu.uet.service.dto.FilledFormResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Optional;

@Service
public class DocumentMapService {

    private final Logger log = LoggerFactory.getLogger(DocumentMapService.class);

    private final S3Service s3Service;
    private final PdfExtractionService pdfExtractionService;
    private final GeminiService geminiService;
    private final MockInternalService mockInternalService;
    private final DocumentExtractionRepository documentExtractionRepository;
    private final FilledFormRepository filledFormRepository;

    public DocumentMapService(S3Service s3Service,
                              PdfExtractionService pdfExtractionService,
                              GeminiService geminiService,
                              MockInternalService mockInternalService,
                              DocumentExtractionRepository documentExtractionRepository,
                              FilledFormRepository filledFormRepository) {
        this.s3Service = s3Service;
        this.pdfExtractionService = pdfExtractionService;
        this.geminiService = geminiService;
        this.mockInternalService = mockInternalService;
        this.documentExtractionRepository = documentExtractionRepository;
        this.filledFormRepository = filledFormRepository;
    }

    /**
     * Initialize extraction record. Returns the generated Task ID (DocumentExtraction ID).
     */
    @Transactional
    public Long initializeDocumentExtraction(String formName) {
        DocumentExtraction doc = new DocumentExtraction();
        doc.setFormName(formName);
        doc.setStatus("PROCESSING");
        doc.setExtractedAt(Instant.now());
        doc.sets3Key("pending..."); // Will be updated asynchronously
        
        doc = documentExtractionRepository.save(doc);
        return doc.getId();
    }

    /**
     * Asynchronous pipeline execution.
     */
    @Async
    @Transactional
    public void processMapAsync(Long taskId, MultipartFile file, String formName) {
        log.info("Starting async pipeline for task {}", taskId);
        try {
            Optional<DocumentExtraction> docOpt = documentExtractionRepository.findById(taskId);
            if (docOpt.isEmpty()) {
                log.error("Task {} not found in db", taskId);
                return;
            }
            DocumentExtraction doc = docOpt.orElseThrow();

            // 1. Upload to S3
            String s3Key = s3Service.uploadFile(file, formName);
            doc.sets3Key(s3Key);

            // 2. Extract Text
            String rawText = pdfExtractionService.extractTextFromPdf(file);
            doc.setRawText(rawText);
            documentExtractionRepository.save(doc);

            // 3. Fetch Form Template
            String formTemplate = mockInternalService.fetchFormTemplate(formName);

            // 4. Send to Gemini
            FilledFormResultDTO result = geminiService.processDocumentExtraction(rawText, formName, formTemplate);

            // 5. Save Filled Form
            FilledForm filledForm = new FilledForm();
            filledForm.setFormName(formName);
            filledForm.setFilledData(result.getFilledData());
            filledForm.setConfidence(result.getConfidence());
            filledForm.setMissingFields(result.getMissingFields());
            filledForm.setProcessedAt(Instant.now());
            filledForm.setGeminiModel("gemini-2.0-flash");
            filledForm.setDocument(doc);
            filledFormRepository.save(filledForm);

            // 6. Update status
            doc.setStatus("COMPLETED");
            documentExtractionRepository.save(doc);

            // 7. Invoke Outbound to eRequest
            mockInternalService.createTicketInERequest(formName, result.getFilledData(), s3Key);

        } catch (Exception e) {
            log.error("Error processing document extraction for task {}", taskId, e);
            documentExtractionRepository.findById(taskId).ifPresent(doc -> {
                doc.setStatus("FAILED");
                documentExtractionRepository.save(doc);
            });
        }
    }

    /**
     * Synchronous pipeline for testing.
     */
    @Transactional
    public FilledFormResultDTO processMapSync(MultipartFile file, String formName) throws Exception {
        Long taskId = initializeDocumentExtraction(formName);
        
        String s3Key = s3Service.uploadFile(file, formName);
        String rawText = pdfExtractionService.extractTextFromPdf(file);
        
        DocumentExtraction doc = documentExtractionRepository.findById(taskId).orElseThrow();
        doc.sets3Key(s3Key);
        doc.setRawText(rawText);
        
        String formTemplate = mockInternalService.fetchFormTemplate(formName);
        FilledFormResultDTO result = geminiService.processDocumentExtraction(rawText, formName, formTemplate);
        
        doc.setStatus("COMPLETED");
        documentExtractionRepository.save(doc);
        
        FilledForm filledForm = new FilledForm();
        filledForm.setFormName(formName);
        filledForm.setFilledData(result.getFilledData());
        filledForm.setConfidence(result.getConfidence());
        filledForm.setMissingFields(result.getMissingFields());
        filledForm.setProcessedAt(Instant.now());
        filledForm.setGeminiModel("gemini-2.0-flash");
        filledForm.setDocument(doc);
        filledFormRepository.save(filledForm);
        
        return result;
    }
}
