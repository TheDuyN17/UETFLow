package com.vnu.uet.web.rest;

import com.vnu.uet.domain.DocumentExtraction;
import com.vnu.uet.repository.DocumentExtractionRepository;
import com.vnu.uet.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.vnu.uet.domain.DocumentExtraction}.
 */
@RestController
@RequestMapping("/api/document-extractions")
@Transactional
public class DocumentExtractionResource {

    private static final Logger LOG = LoggerFactory.getLogger(DocumentExtractionResource.class);

    private static final String ENTITY_NAME = "docformDocumentExtraction";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final DocumentExtractionRepository documentExtractionRepository;

    public DocumentExtractionResource(DocumentExtractionRepository documentExtractionRepository) {
        this.documentExtractionRepository = documentExtractionRepository;
    }

    /**
     * {@code POST  /document-extractions} : Create a new documentExtraction.
     *
     * @param documentExtraction the documentExtraction to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new documentExtraction, or with status {@code 400 (Bad Request)} if the documentExtraction has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<DocumentExtraction> createDocumentExtraction(@Valid @RequestBody DocumentExtraction documentExtraction)
        throws URISyntaxException {
        LOG.debug("REST request to save DocumentExtraction : {}", documentExtraction);
        if (documentExtraction.getId() != null) {
            throw new BadRequestAlertException("A new documentExtraction cannot already have an ID", ENTITY_NAME, "idexists");
        }
        documentExtraction = documentExtractionRepository.save(documentExtraction);
        return ResponseEntity.created(new URI("/api/document-extractions/" + documentExtraction.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, documentExtraction.getId().toString()))
            .body(documentExtraction);
    }

    /**
     * {@code PUT  /document-extractions/:id} : Updates an existing documentExtraction.
     *
     * @param id the id of the documentExtraction to save.
     * @param documentExtraction the documentExtraction to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated documentExtraction,
     * or with status {@code 400 (Bad Request)} if the documentExtraction is not valid,
     * or with status {@code 500 (Internal Server Error)} if the documentExtraction couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<DocumentExtraction> updateDocumentExtraction(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody DocumentExtraction documentExtraction
    ) throws URISyntaxException {
        LOG.debug("REST request to update DocumentExtraction : {}, {}", id, documentExtraction);
        if (documentExtraction.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, documentExtraction.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!documentExtractionRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        documentExtraction = documentExtractionRepository.save(documentExtraction);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, documentExtraction.getId().toString()))
            .body(documentExtraction);
    }

    /**
     * {@code PATCH  /document-extractions/:id} : Partial updates given fields of an existing documentExtraction, field will ignore if it is null
     *
     * @param id the id of the documentExtraction to save.
     * @param documentExtraction the documentExtraction to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated documentExtraction,
     * or with status {@code 400 (Bad Request)} if the documentExtraction is not valid,
     * or with status {@code 404 (Not Found)} if the documentExtraction is not found,
     * or with status {@code 500 (Internal Server Error)} if the documentExtraction couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<DocumentExtraction> partialUpdateDocumentExtraction(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody DocumentExtraction documentExtraction
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update DocumentExtraction partially : {}, {}", id, documentExtraction);
        if (documentExtraction.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, documentExtraction.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!documentExtractionRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<DocumentExtraction> result = documentExtractionRepository
            .findById(documentExtraction.getId())
            .map(existingDocumentExtraction -> {
                if (documentExtraction.gets3Key() != null) {
                    existingDocumentExtraction.sets3Key(documentExtraction.gets3Key());
                }
                if (documentExtraction.getFormName() != null) {
                    existingDocumentExtraction.setFormName(documentExtraction.getFormName());
                }
                if (documentExtraction.getRawText() != null) {
                    existingDocumentExtraction.setRawText(documentExtraction.getRawText());
                }
                if (documentExtraction.getStatus() != null) {
                    existingDocumentExtraction.setStatus(documentExtraction.getStatus());
                }
                if (documentExtraction.getExtractedAt() != null) {
                    existingDocumentExtraction.setExtractedAt(documentExtraction.getExtractedAt());
                }

                return existingDocumentExtraction;
            })
            .map(documentExtractionRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, documentExtraction.getId().toString())
        );
    }

    /**
     * {@code GET  /document-extractions} : get all the documentExtractions.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of documentExtractions in body.
     */
    @GetMapping("")
    public List<DocumentExtraction> getAllDocumentExtractions() {
        LOG.debug("REST request to get all DocumentExtractions");
        return documentExtractionRepository.findAll();
    }

    /**
     * {@code GET  /document-extractions/:id} : get the "id" documentExtraction.
     *
     * @param id the id of the documentExtraction to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the documentExtraction, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DocumentExtraction> getDocumentExtraction(@PathVariable("id") Long id) {
        LOG.debug("REST request to get DocumentExtraction : {}", id);
        Optional<DocumentExtraction> documentExtraction = documentExtractionRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(documentExtraction);
    }

    /**
     * {@code DELETE  /document-extractions/:id} : delete the "id" documentExtraction.
     *
     * @param id the id of the documentExtraction to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocumentExtraction(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete DocumentExtraction : {}", id);
        documentExtractionRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
