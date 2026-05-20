package com.vnu.uet.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.converter.DateConverter;
import com.vnu.uet.domain.Acl;
import com.vnu.uet.domain.Form;
import com.vnu.uet.domain.Version;
import com.vnu.uet.domain.enums.StatusForm;
import com.vnu.uet.repository.AclRepository;
import com.vnu.uet.repository.FormRepository;
import com.vnu.uet.repository.ProceduresRepository;
import com.vnu.uet.repository.VersionRepository;
import com.vnu.uet.request.*;
import com.vnu.uet.search.FormSearchOwner;
import com.vnu.uet.search.FormSearchOwnerDto;
import com.vnu.uet.search.SearchVersion;
import com.vnu.uet.security.SecurityUtils;
import com.vnu.uet.security.UserInFoDetails;
import com.vnu.uet.service.dto.*;
import com.vnu.uet.service.mapper.FormMapper;
import com.vnu.uet.service.rest.client.EflowClient;
import com.vnu.uet.utils.FormSpecification;
import com.vnu.uet.utils.IDGenerator;
import com.vnu.uet.web.rest.errors.FormNotPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class OwnerService {
    private final FormRepository formRepository;
    private final AclRepository aclRepository;
    private final ProceduresRepository proceduresRepository;
    private final VersionRepository versionRepository;
    private final NotifyService notifyService;
    private final Logger logger = LoggerFactory.getLogger(OwnerService.class);
    private final FormMapper formMapper;
    private final EntityManager entityManager;
    private final EflowClient eflowClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Form checkFormPermission(String formId, UserInFoDetails currentUser) {
        return formRepository.findById(formId)
                .filter(form -> form.getCreatedBy().trim().equals(currentUser.getLogin().trim()))
                .orElseThrow(() -> new FormNotPermission("Can not permission with ID: " + formId));
    }

    private void syncVersionFromForm(Version version, Form form, UserInFoDetails currentUser) {
        Instant currentTime = Instant.now();
        version.setVariableArr(form.getVariableArr());
        version.setFormName(form.getFormName());
        version.setDescription(form.getDescription());
        version.setJsonForm(form.getJsonForm());
        version.setLastModifiedDate(currentTime);
        version.setTag(form.getTag());
        version.setFormCode(form.getFormCode());
        version.setBeginTime(form.getBeginTime());
        version.setEndTime(form.getEndTime());
        version.setLastModifiedBy(currentUser.getLogin().trim());
        version.setJsonFormCondition(form.getJsonFormCondition());
        version.setCodeJson(form.getCodeJson());
        version.setConfigWriter(form.getConfigWriter());
    }

    public Form saveForm(RequestAddForm form) {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        if (currentUser == null) {
            throw new FormNotPermission("User not found or not logged in");
        }
        Instant currentTime = Instant.now();
        Form form1 = formMapper.toForm(form, currentUser.getId(), currentUser.getLogin(), currentUser.getOrgIn(),
                currentUser.getCustId(), IDGenerator.generateIDSuffix(currentUser.getId()), currentTime);

        if (form1.getFormName() == null || form1.getFormName().trim().isEmpty()) {
            throw new IllegalArgumentException("Form name cannot be empty");
        }
        if (form1.getBeginTime() != null && form1.getEndTime() != null && form1.getBeginTime().isAfter(form1.getEndTime())) {
            throw new IllegalArgumentException("Begin time must be before end time");
        }

        form1 = formRepository.save(form1);

        Acl authorize = new Acl();
        authorize.setIdAcl(IDGenerator.generateIDSuffix(currentUser.getId()));
        authorize.setFormId(form1.getFormId());
        authorize.setCreatedBy(currentUser.getLogin().trim());
        authorize.setStatus(1L);
        authorize.setRole(1L);
        authorize.setOrgIn(currentUser.getOrgIn());
        authorize.setCustId(currentUser.getCustId());
        authorize.setUserId(currentUser.getId());
        authorize.email(currentUser.getLogin().trim());
        authorize.createdDate(currentTime);
        authorize.lastModifiedBy(currentUser.getLogin().trim());
        authorize.lastModifiedDate(currentTime);

        aclRepository.save(authorize);
        return form1;
    }

    public CommonInfo getCommonInfo(String formId) {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        Form form = checkFormPermission(formId, currentUser);
        return new CommonInfo(form);
    }

    public Page<FormDto> findFormOwner1(FormSearchOwnerDto formSearchOwnerDto, Pageable pageable) {
        FormSearchOwner formSearchOwner = new FormSearchOwner(formSearchOwnerDto);
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();

        Page<Form> formEntities = formRepository.findAll(
                FormSpecification.forOwnerSearch(formSearchOwner, currentUser.getOrgIn()),
                pageable);

        Page<FormDto> forms = formEntities.map(entity -> new FormDto(
                entity.getFormId(),
                entity.getFormName(),
                entity.getStatusForm(),
                entity.getCreatedDate(),
                entity.getTag(),
                entity.getBeginTime(),
                entity.getEndTime(),
                entity.getLastModifiedDate(),
                entity.getDescription(),
                entity.getFormCode(),
                entity.getCreatedBy(),
                entity.getUserId(),
                entity.getOrgIn(),
                entity.getCustId(),
                entity.getConfigWriter()));

        if (!forms.isEmpty()) {

            List<String> formIds = forms.getContent().stream()
                    .map(FormDto::getFormId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Map<String, List<String>> proceduresMap = proceduresRepository.findProceduresByFormIdsIn(formIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            row -> (String) row[0],
                            Collectors.mapping(row -> (String) row[1], Collectors.toList())));

            List<Version> activeVersions = versionRepository.findByActiveTrueAndFormIdIn(formIds);

            Map<String, Version> versionMap = activeVersions.stream()
                    .collect(Collectors.toMap(
                            Version::getFormId,
                            v -> v,
                            (v1, v2) -> v1));

            forms.forEach(form -> {
                String formId = form.getFormId();

                List<String> procedures = proceduresMap.getOrDefault(formId, Collections.emptyList());
                form.setListProcedure(procedures.isEmpty() ? "" : String.join(", ", procedures));

                Version version = versionMap.get(formId);
                if (version != null) {
                    form.setVersionId(version.getVersionId().toString());
                }
            });
        }
        return forms;
    }
    /*
     * [UNUSED METHOD]
     * public Page<FormShareDto> getFormList(FormIdListRequest request, Pageable
     * pageable) {
     * Specification<Form> spec = FormSpecification.buildSpec(request);
     * 
     * Page<Form> formPage = formRepository.findAll(spec, pageable);
     * 
     * List<Form> formList = new ArrayList<>(formPage.getContent());
     * 
     * List<String> formIds = formList.stream()
     * .map(Form::getFormId)
     * .collect(Collectors.toList());
     * 
     * Map<String, Version> versionMap = formIds.isEmpty()
     * ? Collections.emptyMap()
     * : entityManager.createQuery(
     * "SELECT v FROM Version v WHERE v.formId IN :formIds AND v.active = true",
     * Version.class)
     * .setParameter("formIds", formIds)
     * .getResultList()
     * .stream()
     * .collect(Collectors.toMap(
     * Version::getFormId,
     * v -> v,
     * (v1, v2) -> v1
     * ));
     * 
     * List<FormShareDto> dtoList = formList.stream()
     * .map(form -> {
     * Version version = versionMap.get(form.getFormId());
     * return new FormShareDto(
     * form.getFormId(),
     * form.getFormName(),
     * form.getCreatedBy(),
     * form.getStatusForm(),
     * form.getCreatedDate(),
     * form.getTag(),
     * form.getBeginTime(),
     * form.getEndTime(),
     * form.getJsonForm(),
     * form.getDescription(),
     * form.getFormCode(),
     * version != null ? version.getVersionId() : null,
     * form.getVariableArr(),
     * version != null ? version.getJsonFormCondition() : null,
     * form.getCodeJson(),
     * form.getConfigWriter()
     * );
     * })
     * .collect(Collectors.toList());
     * 
     * return new PageImpl<>(dtoList, pageable, formPage.getTotalElements());
     * }
     */

    /*
     * [UNUSED METHOD]
     * public List<FormShareDto> getFormListAll(FormIdListRequest request) {
     * Specification<Form> spec = FormSpecification.buildSpec(request);
     * 
     * List<Form> formList = formRepository.findAll(spec);
     * 
     * List<String> formIds = formList.stream()
     * .map(Form::getFormId)
     * .collect(Collectors.toList());
     * 
     * Map<String, Version> versionMap = formIds.isEmpty()
     * ? Collections.emptyMap()
     * : entityManager.createQuery(
     * "SELECT v FROM Version v WHERE v.formId IN :formIds AND v.active = true",
     * Version.class)
     * .setParameter("formIds", formIds)
     * .getResultList()
     * .stream()
     * .collect(Collectors.toMap(
     * Version::getFormId,
     * v -> v,
     * (v1, v2) -> v1
     * ));
     * 
     * Instant currentTime = Instant.now();
     * return formList.stream()
     * .map(form -> {
     * Version version = versionMap.get(form.getFormId());
     * String effect = (version != null && version.getBeginTime() != null &&
     * version.getEndTime() != null
     * && currentTime.isAfter(version.getBeginTime()) &&
     * currentTime.isBefore(version.getEndTime()))
     * ? "true" : "false";
     * return new FormShareDto(
     * form.getFormId(),
     * form.getFormName(),
     * form.getCreatedBy(),
     * form.getStatusForm(),
     * form.getCreatedDate(),
     * form.getTag(),
     * form.getBeginTime(),
     * form.getEndTime(),
     * form.getJsonForm(),
     * form.getDescription(),
     * effect,
     * form.getFormCode(),
     * version != null ? version.getVersionId() : null,
     * form.getVariableArr(),
     * version != null ? version.getJsonFormCondition() : null,
     * form.getCodeJson(),
     * form.getConfigWriter()
     * );
     * })
     * .collect(Collectors.toList());
     * }
     */

    @Transactional
    public Form updateForm(RequestFormDto requestForm) throws Exception {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        if (currentUser == null) {
            throw new FormNotPermission("User not found or not logged in");
        }
        Form form = checkFormPermission(requestForm.getFormId(), currentUser);
        if (Objects.equals(form.getStatusForm(), StatusForm.RELEASE.getValue())) {
            throw new FormNotPermission("Form in RELEASE status cannot be updated");
        }

        Form originalForm = new Form();
        originalForm.setFormName(form.getFormName());
        originalForm.setFormCode(form.getFormCode());
        originalForm.setDescription(form.getDescription());
        originalForm.setJsonForm(form.getJsonForm());
        originalForm.setJsonFormCondition(form.getJsonFormCondition());
        originalForm.setTag(form.getTag());
        originalForm.setBeginTime(form.getBeginTime());
        originalForm.setEndTime(form.getEndTime());
        originalForm.setVariableArr(form.getVariableArr());

        // Check if form is being used in eFlow Release
        boolean lockStructure = false;
        try {
            ResponseEntity<Boolean> eflowResponse = eflowClient.isFormReleasing(requestForm.getFormId());
            if (eflowResponse.getBody() != null && eflowResponse.getBody()) {
                lockStructure = true;
            }
        } catch (Exception e) {
            logger.warn("Could not check eFlow status for form {}: {}", requestForm.getFormId(), e.getMessage());
        }

        if (lockStructure && requestForm.getVariableArr() != null) {
            validateVariableCodeIntegrity(originalForm.getVariableArr(), requestForm.getVariableArr());
        }

        Instant currentTime = Instant.now();
        formMapper.updateForm(requestForm, form, currentUser.getLogin(), currentTime);

        if (Objects.equals(form.getStatusForm(), StatusForm.EDIT.getValue())) {
            Version version = versionRepository.findVersionByActiveAndFormId(true, form.getFormId());
            if (version != null) {
                syncVersionFromForm(version, form, currentUser);

                // Update action field
                String action = "";
                if (!version.getFormName().equals(form.getFormName())) {
                    action += "Thay đổi tên biểu mẫu";
                }
                if (!version.getFormCode().equals(form.getFormCode())) {
                    action += action.isEmpty() ? "Thay đổi mã biểu mẫu" : ", Thay đổi mã biểu mẫu";
                }
                if (!Objects.equals(version.getDescription(), form.getDescription())) {
                    action += action.isEmpty() ? "Thay đổi mô tả biểu mẫu" : ", Thay đổi mô tả biểu mẫu";
                }
                if (!version.getJsonForm().equals(form.getJsonForm())) {
                    action += action.isEmpty() ? "Thay đổi element" : ", Thay đổi element";
                }
                version.setAction(action.isEmpty() ? version.getAction() : action);
                versionRepository.save(version);
            }
        }

        if (requestForm.getJsonForm() != null && !requestForm.getJsonForm().isEmpty()) {
            validateNoDuplicateIds(requestForm.getJsonForm());
        }

        formRepository.save(form);

        // Send notifications
        List<ReceiverDTO> receiverDTOS = sendNotifyShare(form.getFormId());
        if (receiverDTOS == null || receiverDTOS.isEmpty()) {
            logger.info("No receivers found. Skip sending notifications.");
            return form;
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        try {
            if (requestForm.getFormName() != null && !requestForm.getFormName().isEmpty()
                    && !originalForm.getFormName().equals(requestForm.getFormName())) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormNameOld(originalForm.getFormName());
                contentNotify.setFormNameNew(requestForm.getFormName());
                contentNotify.setCreateDate(formatter.format(currentTime));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "CHANGE_FORM_NAME");
            }
            if (requestForm.getFormCode() != null && !requestForm.getFormCode().isEmpty()
                    && !originalForm.getFormCode().equals(requestForm.getFormCode())) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormNameOld(originalForm.getFormName());
                contentNotify.setFormCodeNew(requestForm.getFormCode());
                contentNotify.setFormCodeOld(originalForm.getFormCode());
                contentNotify.setCreateDate(formatter.format(currentTime));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "CHANGE_FORM_CODE");
            }
            if (requestForm.getDescribeForm() != null && !requestForm.getDescribeForm().isEmpty()
                    && !Objects.equals(originalForm.getDescription(), requestForm.getDescribeForm())) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormName(originalForm.getFormName());
                contentNotify.setCreateDate(formatter.format(currentTime));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "CHANGE_FORM_DESCRIPTION");
            } else if (requestForm.getDescribeForm() == null && originalForm.getDescription() != null
                    && !originalForm.getDescription().isEmpty()) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormName(originalForm.getFormName());
                contentNotify.setCreateDate(formatter.format(currentTime));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "DELETE_FORM_DESCRIPTION");
            }
            if (requestForm.getJsonForm() != null && !requestForm.getJsonForm().isEmpty()
                    && !originalForm.getJsonForm().equals(requestForm.getJsonForm())) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormName(originalForm.getFormName());
                contentNotify.setCreateDate(formatter.format(currentTime));
                contentNotify.setForm(formRepository.findFormByFormId(requestForm.getFormId()));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "CHANGE_FORM_ELEMENT");
            }
            if ((requestForm.getBeginTime() != null && !Objects.equals(originalForm.getBeginTime(),
                    DateConverter.parseStringToZonedDateTime(requestForm.getBeginTime()))) ||
                    (requestForm.getEndTime() != null && !Objects.equals(originalForm.getEndTime(),
                            DateConverter.parseStringToZonedDateTime3(requestForm.getEndTime())))) {
                ContentNotify contentNotify = new ContentNotify();
                contentNotify.setFormName(originalForm.getFormName());
                contentNotify.setCreateDate(formatter.format(currentTime));
                contentNotify.setTimeDuration(convertDateFormat(requestForm.getBeginTime()) + " - "
                        + convertDateFormat(requestForm.getEndTime()));
                notifyService.sendNotify(null, receiverDTOS, contentNotify, "CHANGE_FORM_DURATION");
            }
            List<String> listTagOld = originalForm.getTag() != null
                    ? Arrays.stream(originalForm.getTag().split(",")).map(String::trim).collect(Collectors.toList())
                    : new ArrayList<>();
            List<String> listTagNew = requestForm.getTag() != null
                    ? Arrays.stream(requestForm.getTag().split(",")).map(String::trim).collect(Collectors.toList())
                    : new ArrayList<>();
            for (String tag : listTagOld) {
                if (!listTagNew.contains(tag)) {
                    ContentNotify contentNotify = new ContentNotify();
                    contentNotify.setFormName(originalForm.getFormName());
                    contentNotify.setTag(tag);
                    contentNotify.setCreateDate(formatter.format(currentTime));
                    notifyService.sendNotify(null, receiverDTOS, contentNotify, "REMOVE_FORM_TAG");
                }
            }
            for (String tag : listTagNew) {
                if (!listTagOld.contains(tag)) {
                    ContentNotify contentNotify = new ContentNotify();
                    contentNotify.setFormName(originalForm.getFormName());
                    contentNotify.setTag(tag);
                    contentNotify.setCreateDate(formatter.format(currentTime));
                    notifyService.sendNotify(null, receiverDTOS, contentNotify, "ADD_FORM_TAG");
                }
            }
        } catch (Exception e) {
            logger.error("Error sending notification", e);
        }

        return form;
    }

    public void validateNoDuplicateIds(String jsonForm) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(jsonForm);

        if (root.isArray()) {
            Map<String, JsonNode> seenIds = new HashMap<>();

            for (JsonNode node : root) {
                JsonNode idNode = node.get("id");
                if (idNode != null && idNode.isTextual()) {
                    String id = idNode.asText();
                    if (seenIds.containsKey(id)) {
                        String label = getTextOrDefault(node, "label");
                        String type = getTextOrDefault(node, "type");

                        String labelPrev = getTextOrDefault(seenIds.get(id), "label");
                        String typePrev = getTextOrDefault(seenIds.get(id), "type");

                        throw new IllegalArgumentException(
                                "Duplicate ID detected: \"" + id + "\".\n"
                                        + " - Element 1: label=\"" + labelPrev + "\", type=\"" + typePrev + "\"\n"
                                        + " - Element 2: label=\"" + label + "\", type=\"" + type + "\"");
                    } else {
                        seenIds.put(id, node);
                    }
                }
            }
        }
    }

    private void validateVariableCodeIntegrity(String oldVariableArrJson, Variable[] newVariables) throws Exception {
        if (oldVariableArrJson == null || oldVariableArrJson.isEmpty() || newVariables == null) {
            return;
        }
        JsonNode oldRoot = objectMapper.readTree(oldVariableArrJson);

        if (oldRoot.isArray()) {
            Set<String> oldCodes = new HashSet<>();
            for (JsonNode node : oldRoot) {
                JsonNode codeNode = node.get("code");
                if (codeNode != null)
                    oldCodes.add(codeNode.asText());
            }

            Set<String> newCodes = new HashSet<>();
            for (Variable var : newVariables) {
                if (var.getCode() != null)
                    newCodes.add(var.getCode());
            }

            // Check if any old code is missing in new codes (deletion is not allowed if
            // locked)
            for (String oldCode : oldCodes) {
                if (!newCodes.contains(oldCode)) {
                    throw new IllegalArgumentException("Cannot delete or change existing variable code '" + oldCode
                            + "' after form is released in eFlow");
                }
            }
        }
    }

    private String getTextOrDefault(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        return (value != null && value.isTextual()) ? value.asText() : "(unknown)";
    }

    /*
     * [UNUSED METHOD]
     * 
     * @Transactional
     * public Form changeToEdit(String formId) {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * Form form = checkFormPermission(formId, currentUser);
     * if (Objects.equals(form.getStatusForm(), StatusForm.EDIT.getValue())) {
     * throw new FormNotPermission("Form is already in EDIT status");
     * }
     * if (!Objects.equals(form.getStatusForm(), StatusForm.DRAFT.getValue()) &&
     * !Objects.equals(form.getStatusForm(), StatusForm.WITHDRAW.getValue())) {
     * throw new
     * FormNotPermission("Form must be in DRAFT or WITHDRAW status to change to EDIT"
     * );
     * }
     * 
     * Instant currentTime = Instant.now();
     * Version version;
     * boolean isWithdraw = Objects.equals(form.getStatusForm(),
     * StatusForm.WITHDRAW.getValue());
     * 
     * if (isWithdraw) {
     * // WITHDRAW to EDIT: Update existing active version
     * version = versionRepository.findVersionByActiveAndFormId(true, formId);
     * if (version == null) {
     * throw new
     * IllegalStateException("No active version found for form in WITHDRAW status: "
     * + formId);
     * }
     * // Update version fields
     * syncVersionFromForm(version, form, currentUser);
     * version.setStatusForm(StatusForm.EDIT.getValue());
     * version.setAfterChange(form.getJsonForm());
     * 
     * // Update action field
     * String action = "";
     * if (!version.getFormName().equals(form.getFormName())) {
     * action += "Thay đổi tên biểu mẫu";
     * }
     * if (!version.getFormCode().equals(form.getFormCode())) {
     * action += action.isEmpty() ? "Thay đổi mã biểu mẫu" :
     * ", Thay đổi mã biểu mẫu";
     * }
     * if (!Objects.equals(version.getDescription(), form.getDescription())) {
     * action += action.isEmpty() ? "Thay đổi mô tả biểu mẫu" :
     * ", Thay đổi mô tả biểu mẫu";
     * }
     * if (!version.getJsonForm().equals(form.getJsonForm())) {
     * action += action.isEmpty() ? "Thay đổi element" : ", Thay đổi element";
     * }
     * version.setAction(action.isEmpty() ? version.getAction() : action);
     * versionRepository.save(version);
     * } else {
     * // DRAFT to EDIT: Create new version
     * version = new Version();
     * version.setVersionId(IDGenerator.generateIDSuffix(currentUser.getId()));
     * version.setVariableArr(form.getVariableArr());
     * version.setFormId(form.getFormId());
     * version.setFormName(form.getFormName());
     * version.setDescription(form.getDescription());
     * version.setJsonForm(form.getJsonForm());
     * version.setCreatedDate(currentTime);
     * version.setLastModifiedDate(currentTime);
     * version.setTag(form.getTag());
     * version.setFormCode(form.getFormCode());
     * version.setBeginTime(form.getBeginTime());
     * version.setEndTime(form.getEndTime());
     * version.setStatusForm(StatusForm.EDIT.getValue());
     * version.setUserId(form.getUserId());
     * version.setCreatedBy(form.getCreatedBy());
     * version.setOrgIn(form.getOrgIn());
     * version.setCustId(form.getCustId());
     * version.setLastModifiedBy(form.getCreatedBy());
     * version.setJsonFormCondition(form.getJsonFormCondition());
     * version.setCodeJson(form.getCodeJson());
     * version.setConfigWriter(form.getConfigWriter());
     * 
     * List<Version> versionList = versionRepository.findVersionByFormId(formId);
     * version.setVersionName("Version " + (versionList.size() + 1));
     * if (!versionRepository.existsByFormId(formId)) {
     * version.setAction(null);
     * version.setActive(true); // Set new version as active
     * version.setBeforeChange(form.getJsonForm());
     * version.setAfterChange(null);
     * } else {
     * Version activeVersion = versionRepository.findVersionByActiveAndFormId(true,
     * formId);
     * if (activeVersion != null) {
     * activeVersion.setActive(false); // Deactivate current active version
     * versionRepository.save(activeVersion);
     * }
     * version.setActive(true); // Set new version as active
     * version.setBeforeChange(activeVersion != null ? activeVersion.getJsonForm() :
     * form.getJsonForm());
     * version.setAfterChange(form.getJsonForm());
     * String action = "";
     * Version lastVersion =
     * versionRepository.findVersionByVersionNameAndFormId("Version " +
     * versionList.size(), formId);
     * if (lastVersion != null &&
     * !lastVersion.getFormName().equals(version.getFormName())) {
     * action += "Thay đổi tên biểu mẫu";
     * }
     * if (lastVersion != null &&
     * !lastVersion.getFormCode().equals(version.getFormCode())) {
     * action += action.isEmpty() ? "Thay đổi mã biểu mẫu" :
     * ", Thay đổi mã biểu mẫu";
     * }
     * if (lastVersion != null && !Objects.equals(lastVersion.getDescription(),
     * version.getDescription())) {
     * action += action.isEmpty() ? "Thay đổi mô tả biểu mẫu" :
     * ", Thay đổi mô tả biểu mẫu";
     * }
     * if (lastVersion != null &&
     * !lastVersion.getJsonForm().equals(version.getJsonForm())) {
     * action += action.isEmpty() ? "Thay đổi element" : ", Thay đổi element";
     * }
     * version.setAction(action);
     * }
     * versionRepository.save(version);
     * }
     * 
     * // Update form status to EDIT
     * form.setStatusForm(StatusForm.EDIT.getValue());
     * form.setLastModifiedDate(currentTime);
     * form.setLastModifiedBy(currentUser.getLogin().trim());
     * formRepository.save(form);
     * 
     * // Send notification
     * List<ReceiverDTO> receiverDTOS = sendNotifyShare(formId);
     * DateTimeFormatter formatter =
     * DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of(
     * "Asia/Ho_Chi_Minh"));
     * ContentNotify contentNotify = new ContentNotify();
     * contentNotify.setFormName(form.getFormName());
     * contentNotify.setCreateDate(formatter.format(currentTime));
     * try {
     * notifyService.sendNotify(null, receiverDTOS, contentNotify, "EDIT_FORM");
     * } catch (Exception e) {
     * logger.error("Error sending notification", e);
     * }
     * return form;
     * }
     */

    @Transactional
    public Form changeToRelease(String formId) {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        Form form = checkFormPermission(formId, currentUser);
        if (Objects.equals(form.getStatusForm(), StatusForm.RELEASE.getValue())) {
            throw new FormNotPermission("Form is already in RELEASE status");
        }
        Instant currentTime = Instant.now();

        Version version;
        boolean wasEdited = form.getStatusForm() == StatusForm.EDIT.getValue();
        Version activeVersion = versionRepository.findVersionByActiveAndFormId(true, formId);
        form.setStatusForm(StatusForm.RELEASE.getValue());
        form.setLastModifiedDate(currentTime);
        form.setLastModifiedBy(currentUser.getLogin().trim());
        if (wasEdited && activeVersion != null) {

            version = activeVersion;
            syncVersionFromForm(version, form, currentUser);
            version.setStatusForm(StatusForm.RELEASE.getValue());
            version.setAfterChange(form.getJsonForm());

            String action = "";
            if (!version.getFormName().equals(form.getFormName())) {
                action += "Thay đổi tên biểu mẫu";
            }
            if (!version.getFormCode().equals(form.getFormCode())) {
                action += action.isEmpty() ? "Thay đổi mã biểu mẫu" : ", Thay đổi mã biểu mẫu";
            }
            if (!Objects.equals(version.getDescription(), form.getDescription())) {
                action += action.isEmpty() ? "Thay đổi mô tả biểu mẫu" : ", Thay đổi mô tả biểu mẫu";
            }
            if (!version.getJsonForm().equals(form.getJsonForm())) {
                action += action.isEmpty() ? "Thay đổi element" : ", Thay đổi element";
            }
            version.setAction(action.isEmpty() ? version.getAction() : action);
            versionRepository.save(version);
        } else {
            version = new Version();
            version.setVersionId(IDGenerator.generateIDSuffix(currentUser.getId()));
            version.setVariableArr(form.getVariableArr());
            version.setFormId(form.getFormId());
            version.setFormName(form.getFormName());
            version.setDescription(form.getDescription());
            version.setJsonForm(form.getJsonForm());
            version.setCreatedDate(currentTime);
            version.setLastModifiedDate(currentTime);
            version.setTag(form.getTag());
            version.setFormCode(form.getFormCode());
            version.setBeginTime(form.getBeginTime());
            version.setEndTime(form.getEndTime());
            version.setStatusForm(StatusForm.RELEASE.getValue());
            version.setUserId(form.getUserId());
            version.setCreatedBy(form.getCreatedBy());
            version.setOrgIn(form.getOrgIn());
            version.setCustId(form.getCustId());
            version.setLastModifiedBy(form.getCreatedBy());
            version.setJsonFormCondition(form.getJsonFormCondition());
            version.setCodeJson(form.getCodeJson());
            version.setConfigWriter(form.getConfigWriter());

            List<Version> versionList = versionRepository.findVersionByFormId(formId);
            version.setVersionName("Version " + (versionList.size() + 1));
            if (!versionRepository.existsByFormId(formId)) {
                version.setAction(null);
                version.setActive(true);
                version.setBeforeChange(form.getJsonForm());
                version.setAfterChange(null);
            } else {
                if (activeVersion != null) {
                    activeVersion.setActive(false);
                    versionRepository.save(activeVersion);
                }
                version.setActive(true);
                version.setBeforeChange(activeVersion != null ? activeVersion.getJsonForm() : form.getJsonForm());
                version.setAfterChange(form.getJsonForm());
                String action = "";
                Version lastVersion = versionRepository
                        .findVersionByVersionNameAndFormId("Version " + versionList.size(), formId);
                if (lastVersion != null && !lastVersion.getFormName().equals(version.getFormName())) {
                    action += "Thay đổi tên biểu mẫu";
                }
                if (lastVersion != null && !lastVersion.getFormCode().equals(version.getFormCode())) {
                    action += action.isEmpty() ? "Thay đổi mã biểu mẫu" : ", Thay đổi mã biểu mẫu";
                }
                if (lastVersion != null && !Objects.equals(lastVersion.getDescription(), version.getDescription())) {
                    action += action.isEmpty() ? "Thay đổi mô tả biểu mẫu" : ", Thay đổi mô tả biểu mẫu";
                }
                if (lastVersion != null && !lastVersion.getJsonForm().equals(version.getJsonForm())) {
                    action += action.isEmpty() ? "Thay đổi element" : ", Thay đổi element";
                }
                version.setAction(action);
            }
            versionRepository.save(version);
        }

        formRepository.save(form);
        List<ReceiverDTO> receiverDTOS = sendNotifyShare(formId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        ContentNotify contentNotify = new ContentNotify();
        contentNotify.setFormName(form.getFormName());
        contentNotify.setCreateDate(formatter.format(currentTime));
        try {
            notifyService.sendNotify(null, receiverDTOS, contentNotify, "RELEASE_FORM");
        } catch (Exception e) {
            logger.error("Error sending notification", e);
        }
        return form;
    }

    @Transactional
    public Form changeToStopRelease(String formId) {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        Form form = checkFormPermission(formId, currentUser);
        if (!Objects.equals(form.getStatusForm(), StatusForm.RELEASE.getValue())) {
            throw new FormNotPermission("Form must be in RELEASE status to withdraw");
        }
        form.setStatusForm(StatusForm.WITHDRAW.getValue());
        Instant currentTime = Instant.now();
        form.setLastModifiedDate(currentTime);
        formRepository.save(form);

        Version activeVersion = versionRepository.findVersionByActiveAndFormId(true, formId);
        if (activeVersion == null) {
            throw new IllegalStateException("No active version found for form in RELEASE status: " + formId);
        }
        activeVersion.setStatusForm(StatusForm.WITHDRAW.getValue());
        activeVersion.setLastModifiedDate(currentTime);
        versionRepository.save(activeVersion);

        List<ReceiverDTO> receiverDTOS = sendNotifyShare(formId);
        ContentNotify contentNotify = new ContentNotify();
        contentNotify.setFormName(form.getFormName());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        contentNotify.setCreateDate(formatter.format(currentTime));
        try {
            notifyService.sendNotify(null, receiverDTOS, contentNotify, "STOP_RELEASE_FORM");
        } catch (Exception e) {
            // Xử lý lỗi ở đây, ví dụ:
            logger.error("Lỗi khi gửi thông báo");
            // Tiếp tục thực hiện các bước tiếp theo
        }

        return form;
    }

    /*
     * [UNUSED METHOD]
     * 
     * @Transactional
     * public Form restoreForm(String versionId) {
     * Version version3 = versionRepository.findVersionByVersionId(versionId);
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * String formId = version3.getFormId();
     * Form form = checkFormPermission(formId, currentUser);
     * if (Objects.equals(form.getStatusForm(), StatusForm.RELEASE.getValue())) {
     * throw new FormNotPermission("Form in RELEASE status cannot be restored");
     * }
     * Version version = versionRepository.findVersionByVersionId(versionId);
     * Version version1 = versionRepository.findVersionByActiveAndFormId(true,
     * formId);
     * version1.setActive(false);
     * versionRepository.save(version1);
     * version.setActive(true);
     * form.setFormCode(version.getFormCode());
     * form.setFormName(version.getFormName());
     * form.setDescription(version.getDescription());
     * form.setJsonForm(version.getJsonForm());
     * form.setTag(version.getTag());
     * form.setBeginTime(version.getBeginTime());
     * form.setEndTime(version.getEndTime());
     * form.setVariableArr(version.getVariableArr());
     * form.setJsonFormCondition(version.getJsonFormCondition());
     * form.setCodeJson(version.getCodeJson());
     * form.setConfigWriter(version.getConfigWriter());
     * 
     * Instant currentTime = Instant.now();
     * 
     * form.setLastModifiedDate(currentTime);
     * form.setLastModifiedBy(currentUser.getLogin().trim());
     * version.setLastModifiedDate(currentTime);
     * form.setLastModifiedDate(currentTime);
     * 
     * versionRepository.save(version);
     * formRepository.save(form);
     * return form;
     * }
     */

    /*
     * [UNUSED METHOD]
     * 
     * @Transactional
     * public Form extendTime(RequestFormDto requestForm) {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * Form form = checkFormPermission(requestForm.getFormId(), currentUser);
     * Instant currentTime = Instant.now();
     * String timeDuration;
     * if (requestForm.getBeginTime() != null && requestForm.getEndTime() != null) {
     * formMapper.updateFormTime(requestForm, form, currentUser.getLogin(),
     * currentTime);
     * formRepository.save(form);
     * DateTimeFormatter formatter =
     * DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of(
     * "Asia/Ho_Chi_Minh"));
     * timeDuration = convertDateFormat(requestForm.getBeginTime()) + " - " +
     * convertDateFormat(requestForm.getEndTime());
     * List<ReceiverDTO> receiverDTOS = sendNotifyShare(requestForm.getFormId());
     * ContentNotify contentNotify = new ContentNotify();
     * contentNotify.setFormName(form.getFormName());
     * contentNotify.setCreateDate(formatter.format(currentTime));
     * contentNotify.setTimeDuration(timeDuration);
     * notifyService.sendNotify(null, receiverDTOS, contentNotify,
     * "CHANGE_FORM_DURATION");
     * }
     * return form;
     * }
     */

    public Form duplicateForm(String formId, RequestAddForm requestAddForm) {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        Form originalForm = checkFormPermission(formId, currentUser);
        Instant currentTime = Instant.now();
        Form newForm = formMapper.toDuplicateForm(originalForm, requestAddForm, currentUser.getId(),
                currentUser.getLogin(), currentUser.getOrgIn(), currentUser.getCustId(),
                IDGenerator.generateIDSuffix(currentUser.getId()), currentTime);
        newForm = formRepository.save(newForm);

        Acl authorize = new Acl();
        authorize.setIdAcl(IDGenerator.generateIDSuffix(currentUser.getId()));
        authorize.setFormId(newForm.getFormId());
        authorize.setCreatedBy(currentUser.getLogin().trim());
        authorize.setRole(1L);
        authorize.setOrgIn(currentUser.getOrgIn());
        authorize.setLastModifiedDate(currentTime);
        authorize.setUserId(currentUser.getId());
        authorize.setEmail(currentUser.getLogin().trim());
        authorize.setStatus(1L);
        authorize.setCustId(currentUser.getCustId());
        authorize.setCreatedDate(currentTime);
        authorize.setLastModifiedBy(currentUser.getLogin().trim());
        aclRepository.save(authorize);
        return newForm;
    }

    /*
     * [UNUSED METHOD]
     * public void shareForm(String formId, List<RequestShareForm>
     * requestShareForms) {
     * List<ReceiverDTO> receiverDTOS = new ArrayList<>();
     * for (RequestShareForm requestShareForm : requestShareForms) {
     * ReceiverDTO receiverDTO = new ReceiverDTO();
     * receiverDTO.setEmail(requestShareForm.getEmail());
     * receiverDTO.setOrgIn(requestShareForm.getOrgIn());
     * receiverDTOS.add(receiverDTO);
     * }
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * Form form = checkFormPermission(formId, currentUser);
     * 
     * for (RequestShareForm requestShareForm : requestShareForms) {
     * Instant currentTime = Instant.now();
     * Acl authorize = new Acl();
     * authorize.setIdAcl(IDGenerator.generateIDSuffix(currentUser.getId()));
     * authorize.setCreatedBy(currentUser.getLogin().trim());
     * authorize.setUserId(requestShareForm.getUserId());
     * authorize.setEmail(requestShareForm.getEmail());
     * authorize.setCustId(requestShareForm.getCustId());
     * authorize.setStatus(1L);
     * authorize.setRole(2L);
     * authorize.setFormId(formId);
     * authorize.setOrgIn(requestShareForm.getOrgIn());
     * authorize.setCreatedDate(currentTime);
     * authorize.setLastModifiedDate(currentTime);
     * authorize.setLastModifiedBy(currentUser.getLogin());
     * aclRepository.save(authorize);
     * ContentNotify contentNotify = new ContentNotify();
     * String userName = currentUser.getEmail();
     * int atIndex = userName.indexOf('@');
     * if (atIndex != -1) {
     * userName = userName.substring(0, atIndex);
     * }
     * contentNotify.setUserName(userName);
     * contentNotify.setFormName(form.getFormName());
     * DateTimeFormatter formatter =
     * DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of(
     * "Asia/Ho_Chi_Minh"));
     * contentNotify.setCreateDate(formatter.format(currentTime));
     * try {
     * notifyService.sendNotify(null, receiverDTOS, contentNotify, "SHARE_FORM");
     * } catch (Exception e) {
     * // Xử lý lỗi ở đây, ví dụ:
     * logger.error("Lỗi khi gửi thông báo");
     * // Tiếp tục thực hiện các bước tiếp theo
     * }
     * 
     * }
     * }
     */

    /*
     * [UNUSED METHOD]
     * 
     * @Transactional
     * public void deleteShareForm(RequestDeleteShare requestDeleteShare) {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * Form form = checkFormPermission(requestDeleteShare.getFormId(), currentUser);
     * aclRepository.deleteByFormIdAndEmailAndOrgIn(requestDeleteShare.getFormId(),
     * requestDeleteShare.getEmail(), requestDeleteShare.getOrgIn());
     * List<ReceiverDTO> receiverDTOS = new ArrayList<>();
     * ReceiverDTO receiverDTO = new ReceiverDTO();
     * receiverDTO.setEmail(requestDeleteShare.getEmail());
     * receiverDTO.setOrgIn(requestDeleteShare.getOrgIn());
     * receiverDTOS.add(receiverDTO);
     * ContentNotify contentNotify = new ContentNotify();
     * String userName = currentUser.getEmail();
     * int atIndex = userName.indexOf('@');
     * if (atIndex != -1) {
     * userName = userName.substring(0, atIndex);
     * }
     * contentNotify.setUserName(userName);
     * contentNotify.setFormName(form.getFormName());
     * DateTimeFormatter formatter =
     * DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of(
     * "Asia/Ho_Chi_Minh"));
     * Instant currentTime = Instant.now();
     * contentNotify.setCreateDate(formatter.format(currentTime));
     * try {
     * notifyService.sendNotify(null, receiverDTOS, contentNotify,
     * "DELETE_SHARE_FORM");
     * } catch (Exception e) {
     * log.error("Lỗi khi gửi thông báo");
     * }
     * }
     */

    /*
     * [UNUSED METHOD]
     * public List<ProcedureDto> getListProcedure(String formId, String
     * procedureName) {
     * List<ProcedureDto> procedureDtoList =
     * proceduresRepository.findListProcedureByFormId(formId, procedureName);
     * for (ProcedureDto procedureDto : procedureDtoList) {
     * Version version =
     * versionRepository.findVersionByVersionId(procedureDto.getVersionId());
     * procedureDto.setVersionName(version.getVersionName());
     * }
     * return procedureDtoList;
     * }
     */

    /*
     * [UNUSED METHOD]
     * public Page<VersionDto> getVersion(SearchVersion searchVersion, Pageable
     * pageable) {
     * return versionRepository.findVersion(searchVersion, pageable);
     * }
     */

    /*
     * [UNUSED METHOD]
     * public Page<VersionDto> getVersionSort(SearchVersion searchVersion, Pageable
     * pageable) {
     * return versionRepository.findVersionSort(searchVersion, pageable);
     * }
     */

    public List<ReceiverDTO> sendNotifyShare(String formId) {
        // List<AuthorizeDto> authorizeDtoList = aclRepository.getInfoShare(formId);
        List<ReceiverDTO> receiverDTOS = new ArrayList<>();
        /*
         * for (AuthorizeDto authorizeDto : authorizeDtoList) {
         * String[] emails = authorizeDto.arrEmail.split(",");
         * 
         * for (String email : emails) {
         * ReceiverDTO receiverDTO = new ReceiverDTO();
         * receiverDTO.setOrgIn(authorizeDto.getOrgIn());
         * receiverDTO.setEmail(email);
         * receiverDTOS.add(receiverDTO);
         * }
         * }
         */
        return receiverDTOS;
    }

    public static String convertDateFormat(String dateStr) {
        // Định dạng gốc là "yyyy/MM/dd"
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");

        // Định dạng mong muốn là "dd/MM/yyyy"
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Phân tích chuỗi ngày đầu vào thành đối tượng LocalDate
        LocalDate date = LocalDate.parse(dateStr, inputFormatter);

        // Định dạng lại theo "dd/MM/yyyy" và trả về chuỗi mới
        return date.format(outputFormatter);
    }

    @Transactional
    public void deleteForm(String formId) {
        checkFormPermission(formId, SecurityUtils.getInfoCurrentUserLogin());
        aclRepository.deleteByFormId(formId);
        versionRepository.deleteByFormId(formId);
        formRepository.deleteById(formId);
    }

    /*
     * [UNUSED METHOD]
     * 
     * @Scheduled(cron = "0 0 0 * * ?")
     * public void sendDailyOverdue() {
     * List<FormDto> formDtos = formRepository.findFormOverdue();
     * for (FormDto formDto : formDtos) {
     * Instant currentTime = Instant.now();
     * DateTimeFormatter formatter =
     * DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of(
     * "Asia/Ho_Chi_Minh"));
     * List<ReceiverDTO> receiverDTOS = sendNotifyShare(formDto.getFormId());
     * ContentNotify contentNotify = new ContentNotify();
     * contentNotify.setFormName(formDto.getFormName());
     * contentNotify.setCreateDate(formatter.format(currentTime));
     * if (receiverDTOS.size() != 0) {
     * notifyService.sendNotify(null, receiverDTOS, contentNotify,
     * "OVERDUE_FORM_SHARE");
     * }
     * List<ReceiverDTO> receiverDTOS1 = new ArrayList<>();
     * ReceiverDTO receiverDTO = new ReceiverDTO();
     * receiverDTO.setEmail(formDto.getCreatedBy());
     * receiverDTO.setUserId(formDto.getUserId());
     * receiverDTO.setCustId(formDto.getCustId());
     * receiverDTO.setOrgIn(formDto.getOrgIn());
     * receiverDTOS1.add(receiverDTO);
     * notifyService.sendNotify(null, receiverDTOS1, contentNotify, "OVERDUE_FORM");
     * 
     * }
     * }
     */
}
