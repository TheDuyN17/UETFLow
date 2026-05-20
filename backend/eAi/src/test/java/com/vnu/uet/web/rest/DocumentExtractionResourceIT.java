package com.vnu.uet.web.rest;

import static com.vnu.uet.domain.DocumentExtractionAsserts.*;
import static com.vnu.uet.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.IntegrationTest;
import com.vnu.uet.domain.DocumentExtraction;
import com.vnu.uet.repository.DocumentExtractionRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link DocumentExtractionResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class DocumentExtractionResourceIT {

    private static final String DEFAULT_S_3_KEY = "AAAAAAAAAA";
    private static final String UPDATED_S_3_KEY = "BBBBBBBBBB";

    private static final String DEFAULT_FORM_NAME = "AAAAAAAAAA";
    private static final String UPDATED_FORM_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_RAW_TEXT = "AAAAAAAAAA";
    private static final String UPDATED_RAW_TEXT = "BBBBBBBBBB";

    private static final String DEFAULT_STATUS = "AAAAAAAAAA";
    private static final String UPDATED_STATUS = "BBBBBBBBBB";

    private static final Instant DEFAULT_EXTRACTED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_EXTRACTED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/document-extractions";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private DocumentExtractionRepository documentExtractionRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restDocumentExtractionMockMvc;

    private DocumentExtraction documentExtraction;

    private DocumentExtraction insertedDocumentExtraction;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static DocumentExtraction createEntity() {
        return new DocumentExtraction()
            .s3Key(DEFAULT_S_3_KEY)
            .formName(DEFAULT_FORM_NAME)
            .rawText(DEFAULT_RAW_TEXT)
            .status(DEFAULT_STATUS)
            .extractedAt(DEFAULT_EXTRACTED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static DocumentExtraction createUpdatedEntity() {
        return new DocumentExtraction()
            .s3Key(UPDATED_S_3_KEY)
            .formName(UPDATED_FORM_NAME)
            .rawText(UPDATED_RAW_TEXT)
            .status(UPDATED_STATUS)
            .extractedAt(UPDATED_EXTRACTED_AT);
    }

    @BeforeEach
    void initTest() {
        documentExtraction = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedDocumentExtraction != null) {
            documentExtractionRepository.delete(insertedDocumentExtraction);
            insertedDocumentExtraction = null;
        }
    }

    @Test
    @Transactional
    void createDocumentExtraction() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the DocumentExtraction
        var returnedDocumentExtraction = om.readValue(
            restDocumentExtractionMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(documentExtraction)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            DocumentExtraction.class
        );

        // Validate the DocumentExtraction in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertDocumentExtractionUpdatableFieldsEquals(
            returnedDocumentExtraction,
            getPersistedDocumentExtraction(returnedDocumentExtraction)
        );

        insertedDocumentExtraction = returnedDocumentExtraction;
    }

    @Test
    @Transactional
    void createDocumentExtractionWithExistingId() throws Exception {
        // Create the DocumentExtraction with an existing ID
        documentExtraction.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restDocumentExtractionMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(documentExtraction)))
            .andExpect(status().isBadRequest());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checks3KeyIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        documentExtraction.sets3Key(null);

        // Create the DocumentExtraction, which fails.

        restDocumentExtractionMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(documentExtraction)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkFormNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        documentExtraction.setFormName(null);

        // Create the DocumentExtraction, which fails.

        restDocumentExtractionMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(documentExtraction)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllDocumentExtractions() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        // Get all the documentExtractionList
        restDocumentExtractionMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(documentExtraction.getId().intValue())))
            .andExpect(jsonPath("$.[*].s3Key").value(hasItem(DEFAULT_S_3_KEY)))
            .andExpect(jsonPath("$.[*].formName").value(hasItem(DEFAULT_FORM_NAME)))
            .andExpect(jsonPath("$.[*].rawText").value(hasItem(DEFAULT_RAW_TEXT)))
            .andExpect(jsonPath("$.[*].status").value(hasItem(DEFAULT_STATUS)))
            .andExpect(jsonPath("$.[*].extractedAt").value(hasItem(DEFAULT_EXTRACTED_AT.toString())));
    }

    @Test
    @Transactional
    void getDocumentExtraction() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        // Get the documentExtraction
        restDocumentExtractionMockMvc
            .perform(get(ENTITY_API_URL_ID, documentExtraction.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(documentExtraction.getId().intValue()))
            .andExpect(jsonPath("$.s3Key").value(DEFAULT_S_3_KEY))
            .andExpect(jsonPath("$.formName").value(DEFAULT_FORM_NAME))
            .andExpect(jsonPath("$.rawText").value(DEFAULT_RAW_TEXT))
            .andExpect(jsonPath("$.status").value(DEFAULT_STATUS))
            .andExpect(jsonPath("$.extractedAt").value(DEFAULT_EXTRACTED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingDocumentExtraction() throws Exception {
        // Get the documentExtraction
        restDocumentExtractionMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingDocumentExtraction() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the documentExtraction
        DocumentExtraction updatedDocumentExtraction = documentExtractionRepository.findById(documentExtraction.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedDocumentExtraction are not directly saved in db
        em.detach(updatedDocumentExtraction);
        updatedDocumentExtraction
            .s3Key(UPDATED_S_3_KEY)
            .formName(UPDATED_FORM_NAME)
            .rawText(UPDATED_RAW_TEXT)
            .status(UPDATED_STATUS)
            .extractedAt(UPDATED_EXTRACTED_AT);

        restDocumentExtractionMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedDocumentExtraction.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedDocumentExtraction))
            )
            .andExpect(status().isOk());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedDocumentExtractionToMatchAllProperties(updatedDocumentExtraction);
    }

    @Test
    @Transactional
    void putNonExistingDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(
                put(ENTITY_API_URL_ID, documentExtraction.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(documentExtraction))
            )
            .andExpect(status().isBadRequest());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(documentExtraction))
            )
            .andExpect(status().isBadRequest());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(documentExtraction)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateDocumentExtractionWithPatch() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the documentExtraction using partial update
        DocumentExtraction partialUpdatedDocumentExtraction = new DocumentExtraction();
        partialUpdatedDocumentExtraction.setId(documentExtraction.getId());

        partialUpdatedDocumentExtraction
            .formName(UPDATED_FORM_NAME)
            .rawText(UPDATED_RAW_TEXT)
            .status(UPDATED_STATUS)
            .extractedAt(UPDATED_EXTRACTED_AT);

        restDocumentExtractionMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDocumentExtraction.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDocumentExtraction))
            )
            .andExpect(status().isOk());

        // Validate the DocumentExtraction in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDocumentExtractionUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedDocumentExtraction, documentExtraction),
            getPersistedDocumentExtraction(documentExtraction)
        );
    }

    @Test
    @Transactional
    void fullUpdateDocumentExtractionWithPatch() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the documentExtraction using partial update
        DocumentExtraction partialUpdatedDocumentExtraction = new DocumentExtraction();
        partialUpdatedDocumentExtraction.setId(documentExtraction.getId());

        partialUpdatedDocumentExtraction
            .s3Key(UPDATED_S_3_KEY)
            .formName(UPDATED_FORM_NAME)
            .rawText(UPDATED_RAW_TEXT)
            .status(UPDATED_STATUS)
            .extractedAt(UPDATED_EXTRACTED_AT);

        restDocumentExtractionMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDocumentExtraction.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDocumentExtraction))
            )
            .andExpect(status().isOk());

        // Validate the DocumentExtraction in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDocumentExtractionUpdatableFieldsEquals(
            partialUpdatedDocumentExtraction,
            getPersistedDocumentExtraction(partialUpdatedDocumentExtraction)
        );
    }

    @Test
    @Transactional
    void patchNonExistingDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, documentExtraction.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(documentExtraction))
            )
            .andExpect(status().isBadRequest());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(documentExtraction))
            )
            .andExpect(status().isBadRequest());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamDocumentExtraction() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        documentExtraction.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDocumentExtractionMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(documentExtraction)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the DocumentExtraction in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteDocumentExtraction() throws Exception {
        // Initialize the database
        insertedDocumentExtraction = documentExtractionRepository.saveAndFlush(documentExtraction);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the documentExtraction
        restDocumentExtractionMockMvc
            .perform(delete(ENTITY_API_URL_ID, documentExtraction.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return documentExtractionRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected DocumentExtraction getPersistedDocumentExtraction(DocumentExtraction documentExtraction) {
        return documentExtractionRepository.findById(documentExtraction.getId()).orElseThrow();
    }

    protected void assertPersistedDocumentExtractionToMatchAllProperties(DocumentExtraction expectedDocumentExtraction) {
        assertDocumentExtractionAllPropertiesEquals(expectedDocumentExtraction, getPersistedDocumentExtraction(expectedDocumentExtraction));
    }

    protected void assertPersistedDocumentExtractionToMatchUpdatableProperties(DocumentExtraction expectedDocumentExtraction) {
        assertDocumentExtractionAllUpdatablePropertiesEquals(
            expectedDocumentExtraction,
            getPersistedDocumentExtraction(expectedDocumentExtraction)
        );
    }
}
