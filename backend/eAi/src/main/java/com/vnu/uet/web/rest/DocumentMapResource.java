package com.vnu.uet.web.rest;

import com.vnu.uet.domain.DocumentExtraction;
import com.vnu.uet.domain.FilledForm;
import com.vnu.uet.repository.DocumentExtractionRepository;
import com.vnu.uet.repository.FilledFormRepository;
import com.vnu.uet.service.DocumentMapService;
import com.vnu.uet.service.dto.DocumentMapResponseDTO;
import com.vnu.uet.service.dto.FilledFormResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/api")
public class DocumentMapResource {

    private final Logger log = LoggerFactory.getLogger(DocumentMapResource.class);

    private final DocumentMapService documentMapService;
    private final DocumentExtractionRepository documentExtractionRepository;
    private final FilledFormRepository filledFormRepository;

    public DocumentMapResource(DocumentMapService documentMapService,
                               DocumentExtractionRepository documentExtractionRepository,
                               FilledFormRepository filledFormRepository) {
        this.documentMapService = documentMapService;
        this.documentExtractionRepository = documentExtractionRepository;
        this.filledFormRepository = filledFormRepository;
    }

    /**
     * POST /document-maps : Start async processing of PDF
     */
    @PostMapping("/document-maps")
    public ResponseEntity<DocumentMapResponseDTO> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("formName") String formName) {
        log.debug("REST request to upload document map async for form: {}", formName);
        
        Long taskId = documentMapService.initializeDocumentExtraction(formName);
        documentMapService.processMapAsync(taskId, file, formName);
        
        return ResponseEntity.ok(new DocumentMapResponseDTO(String.valueOf(taskId), "PROCESSING", "Document processing initiated"));
    }

    /**
     * GET /document-maps/{taskId}/status : Get processing status
     */
    @GetMapping("/document-maps/{taskId}/status")
    public ResponseEntity<DocumentMapResponseDTO> getTaskStatus(@PathVariable Long taskId) {
        log.debug("REST request to get status for task: {}", taskId);
        Optional<DocumentExtraction> docOpt = documentExtractionRepository.findById(taskId);
        
        if (docOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        String status = docOpt.orElseThrow().getStatus();
        return ResponseEntity.ok(new DocumentMapResponseDTO(String.valueOf(taskId), status, "Current status: " + status));
    }

    /**
     * GET /document-maps/{taskId}/result : Get processing result
     */
    @GetMapping("/document-maps/{taskId}/result")
    public ResponseEntity<FilledFormResultDTO> getTaskResult(@PathVariable Long taskId) {
        log.debug("REST request to get result for task: {}", taskId);
        
        Optional<DocumentExtraction> docOpt = documentExtractionRepository.findById(taskId);
        if (docOpt.isEmpty() || !"COMPLETED".equals(docOpt.orElseThrow().getStatus())) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<FilledForm> formOpt = filledFormRepository.findAll().stream()
                .filter(f -> f.getDocument() != null && f.getDocument().getId().equals(taskId))
                .findFirst();
                
        if (formOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FilledForm form = formOpt.orElseThrow();
        FilledFormResultDTO dto = new FilledFormResultDTO();
        dto.setFormName(form.getFormName());
        dto.setConfidence(form.getConfidence());
        dto.setMissingFields(form.getMissingFields());
        dto.setFilledData(form.getFilledData());
        
        return ResponseEntity.ok(dto);
    }
    
    /**
     * GET /document-maps/{taskId}/raw-text : Get raw text
     */
    @GetMapping("/document-maps/{taskId}/raw-text")
    public ResponseEntity<String> getRawText(@PathVariable Long taskId) {
        Optional<DocumentExtraction> docOpt = documentExtractionRepository.findById(taskId);
        if (docOpt.isEmpty() || docOpt.orElseThrow().getRawText() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(docOpt.orElseThrow().getRawText());
    }

    /**
     * POST /document-maps/sync : Blocking upload and processing
     */
    @PostMapping("/document-maps/sync")
    public ResponseEntity<FilledFormResultDTO> uploadDocumentSync(
            @RequestParam("file") MultipartFile file,
            @RequestParam("formName") String formName) throws Exception {
        log.debug("REST request to upload document map sync for form: {}", formName);
        
        FilledFormResultDTO result = documentMapService.processMapSync(file, formName);
        return ResponseEntity.ok(result);
    }
}
