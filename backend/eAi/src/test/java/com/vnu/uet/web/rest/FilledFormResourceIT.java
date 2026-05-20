package com.vnu.uet.web.rest;

import static com.vnu.uet.domain.FilledFormAsserts.*;
import static com.vnu.uet.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.IntegrationTest;
import com.vnu.uet.domain.FilledForm;
import com.vnu.uet.repository.FilledFormRepository;
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
 * Integration tests for the {@link FilledFormResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class FilledFormResourceIT {

    private static final String DEFAULT_FORM_NAME = "AAAAAAAAAA";
    private static final String UPDATED_FORM_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_FILLED_DATA = "AAAAAAAAAA";
    private static final String UPDATED_FILLED_DATA = "BBBBBBBBBB";

    private static final Double DEFAULT_CONFIDENCE = 1D;
    private static final Double UPDATED_CONFIDENCE = 2D;

    private static final String DEFAULT_GEMINI_MODEL = "AAAAAAAAAA";
    private static final String UPDATED_GEMINI_MODEL = "BBBBBBBBBB";

    private static final Instant DEFAULT_PROCESSED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_PROCESSED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String DEFAULT_MISSING_FIELDS = "AAAAAAAAAA";
    private static final String UPDATED_MISSING_FIELDS = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/filled-forms";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private FilledFormRepository filledFormRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restFilledFormMockMvc;

    private FilledForm filledForm;

    private FilledForm insertedFilledForm;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static FilledForm createEntity() {
        return new FilledForm()
            .formName(DEFAULT_FORM_NAME)
            .filledData(DEFAULT_FILLED_DATA)
            .confidence(DEFAULT_CONFIDENCE)
            .geminiModel(DEFAULT_GEMINI_MODEL)
            .processedAt(DEFAULT_PROCESSED_AT)
            .missingFields(DEFAULT_MISSING_FIELDS);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static FilledForm createUpdatedEntity() {
        return new FilledForm()
            .formName(UPDATED_FORM_NAME)
            .filledData(UPDATED_FILLED_DATA)
            .confidence(UPDATED_CONFIDENCE)
            .geminiModel(UPDATED_GEMINI_MODEL)
            .processedAt(UPDATED_PROCESSED_AT)
            .missingFields(UPDATED_MISSING_FIELDS);
    }

    @BeforeEach
    void initTest() {
        filledForm = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedFilledForm != null) {
            filledFormRepository.delete(insertedFilledForm);
            insertedFilledForm = null;
        }
    }

    @Test
    @Transactional
    void createFilledForm() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the FilledForm
        var returnedFilledForm = om.readValue(
            restFilledFormMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(filledForm)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            FilledForm.class
        );

        // Validate the FilledForm in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertFilledFormUpdatableFieldsEquals(returnedFilledForm, getPersistedFilledForm(returnedFilledForm));

        insertedFilledForm = returnedFilledForm;
    }

    @Test
    @Transactional
    void createFilledFormWithExistingId() throws Exception {
        // Create the FilledForm with an existing ID
        filledForm.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restFilledFormMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(filledForm)))
            .andExpect(status().isBadRequest());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkFormNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        filledForm.setFormName(null);

        // Create the FilledForm, which fails.

        restFilledFormMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(filledForm)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllFilledForms() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        // Get all the filledFormList
        restFilledFormMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(filledForm.getId().intValue())))
            .andExpect(jsonPath("$.[*].formName").value(hasItem(DEFAULT_FORM_NAME)))
            .andExpect(jsonPath("$.[*].filledData").value(hasItem(DEFAULT_FILLED_DATA)))
            .andExpect(jsonPath("$.[*].confidence").value(hasItem(DEFAULT_CONFIDENCE)))
            .andExpect(jsonPath("$.[*].geminiModel").value(hasItem(DEFAULT_GEMINI_MODEL)))
            .andExpect(jsonPath("$.[*].processedAt").value(hasItem(DEFAULT_PROCESSED_AT.toString())))
            .andExpect(jsonPath("$.[*].missingFields").value(hasItem(DEFAULT_MISSING_FIELDS)));
    }

    @Test
    @Transactional
    void getFilledForm() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        // Get the filledForm
        restFilledFormMockMvc
            .perform(get(ENTITY_API_URL_ID, filledForm.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(filledForm.getId().intValue()))
            .andExpect(jsonPath("$.formName").value(DEFAULT_FORM_NAME))
            .andExpect(jsonPath("$.filledData").value(DEFAULT_FILLED_DATA))
            .andExpect(jsonPath("$.confidence").value(DEFAULT_CONFIDENCE))
            .andExpect(jsonPath("$.geminiModel").value(DEFAULT_GEMINI_MODEL))
            .andExpect(jsonPath("$.processedAt").value(DEFAULT_PROCESSED_AT.toString()))
            .andExpect(jsonPath("$.missingFields").value(DEFAULT_MISSING_FIELDS));
    }

    @Test
    @Transactional
    void getNonExistingFilledForm() throws Exception {
        // Get the filledForm
        restFilledFormMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingFilledForm() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the filledForm
        FilledForm updatedFilledForm = filledFormRepository.findById(filledForm.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedFilledForm are not directly saved in db
        em.detach(updatedFilledForm);
        updatedFilledForm
            .formName(UPDATED_FORM_NAME)
            .filledData(UPDATED_FILLED_DATA)
            .confidence(UPDATED_CONFIDENCE)
            .geminiModel(UPDATED_GEMINI_MODEL)
            .processedAt(UPDATED_PROCESSED_AT)
            .missingFields(UPDATED_MISSING_FIELDS);

        restFilledFormMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedFilledForm.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedFilledForm))
            )
            .andExpect(status().isOk());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedFilledFormToMatchAllProperties(updatedFilledForm);
    }

    @Test
    @Transactional
    void putNonExistingFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(
                put(ENTITY_API_URL_ID, filledForm.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(filledForm))
            )
            .andExpect(status().isBadRequest());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(filledForm))
            )
            .andExpect(status().isBadRequest());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(filledForm)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateFilledFormWithPatch() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the filledForm using partial update
        FilledForm partialUpdatedFilledForm = new FilledForm();
        partialUpdatedFilledForm.setId(filledForm.getId());

        partialUpdatedFilledForm
            .filledData(UPDATED_FILLED_DATA)
            .confidence(UPDATED_CONFIDENCE)
            .geminiModel(UPDATED_GEMINI_MODEL)
            .processedAt(UPDATED_PROCESSED_AT);

        restFilledFormMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedFilledForm.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedFilledForm))
            )
            .andExpect(status().isOk());

        // Validate the FilledForm in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertFilledFormUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedFilledForm, filledForm),
            getPersistedFilledForm(filledForm)
        );
    }

    @Test
    @Transactional
    void fullUpdateFilledFormWithPatch() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the filledForm using partial update
        FilledForm partialUpdatedFilledForm = new FilledForm();
        partialUpdatedFilledForm.setId(filledForm.getId());

        partialUpdatedFilledForm
            .formName(UPDATED_FORM_NAME)
            .filledData(UPDATED_FILLED_DATA)
            .confidence(UPDATED_CONFIDENCE)
            .geminiModel(UPDATED_GEMINI_MODEL)
            .processedAt(UPDATED_PROCESSED_AT)
            .missingFields(UPDATED_MISSING_FIELDS);

        restFilledFormMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedFilledForm.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedFilledForm))
            )
            .andExpect(status().isOk());

        // Validate the FilledForm in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertFilledFormUpdatableFieldsEquals(partialUpdatedFilledForm, getPersistedFilledForm(partialUpdatedFilledForm));
    }

    @Test
    @Transactional
    void patchNonExistingFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, filledForm.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(filledForm))
            )
            .andExpect(status().isBadRequest());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(filledForm))
            )
            .andExpect(status().isBadRequest());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamFilledForm() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        filledForm.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restFilledFormMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(filledForm)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the FilledForm in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteFilledForm() throws Exception {
        // Initialize the database
        insertedFilledForm = filledFormRepository.saveAndFlush(filledForm);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the filledForm
        restFilledFormMockMvc
            .perform(delete(ENTITY_API_URL_ID, filledForm.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return filledFormRepository.count();
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

    protected FilledForm getPersistedFilledForm(FilledForm filledForm) {
        return filledFormRepository.findById(filledForm.getId()).orElseThrow();
    }

    protected void assertPersistedFilledFormToMatchAllProperties(FilledForm expectedFilledForm) {
        assertFilledFormAllPropertiesEquals(expectedFilledForm, getPersistedFilledForm(expectedFilledForm));
    }

    protected void assertPersistedFilledFormToMatchUpdatableProperties(FilledForm expectedFilledForm) {
        assertFilledFormAllUpdatablePropertiesEquals(expectedFilledForm, getPersistedFilledForm(expectedFilledForm));
    }
}
