package com.vnu.uet.web.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.domain.Form;
import com.vnu.uet.repository.FormRepository;
import com.vnu.uet.request.*;
import com.vnu.uet.search.FormSearchOwnerDto;
import com.vnu.uet.search.FormSearchOwnerExcelDto;
import com.vnu.uet.search.SearchVersion;
import com.vnu.uet.search.SearchVersionDto;
import com.vnu.uet.security.SecurityUtils;
import com.vnu.uet.security.UserInFoDetails;
import com.vnu.uet.service.OwnerService;
import com.vnu.uet.service.dto.*;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.persistence.EntityManager;
import javax.validation.Valid;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerResources {
    private final FormRepository formRepository;
    private final OwnerService ownerService;
    private final ObjectMapper objectMapper;

    @PostMapping("/form-data")
    public ResponseEntity<Map<String, String>> saveFormData(@RequestBody Map<String, Object> request) {
        String dataId = UUID.randomUUID().toString();
        return ResponseEntity.ok(Map.of("dataId", dataId, "status", "saved"));
    }

    @PostMapping("/form")
    public ResponseEntity<?> saveForm(@RequestBody @Valid RequestAddForm form) throws Exception {
        Form form1 = ownerService.saveForm(form);
        return ResponseEntity.ok(form1);
    }

    @GetMapping("/form")
    public ResponseEntity<?> getCommonInfo(@RequestParam String formId) throws Exception {
        String message;
        if (!formRepository.existsByFormId(formId)) {
            message = "FormId not exist";
            StandardResponse standardResponse = new StandardResponse(message, false);
            return ResponseEntity.ok(standardResponse);
        }
        CommonInfo commonInfo = ownerService.getCommonInfo(formId);
        return ResponseEntity.ok(commonInfo);
    }

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/form-list")
     * public ResponseEntity<?> getFormList(
     * 
     * @RequestBody FormIdListRequest request,
     * Pageable pageable) {
     * 
     * Page<FormShareDto> dtoPage = ownerService.getFormList(request, pageable);
     * 
     * HttpHeaders headers = new HttpHeaders();
     * headers.add("X-Total-Count", String.valueOf(dtoPage.getTotalElements()));
     * headers.add("X-Total-Pages", String.valueOf(dtoPage.getTotalPages()));
     * headers.add("X-Current-Page", String.valueOf(dtoPage.getNumber()));
     * headers.add("X-Page-Size", String.valueOf(dtoPage.getSize()));
     * 
     * return new ResponseEntity<>(dtoPage, headers, HttpStatus.OK);
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/form-list-all")
     * public ResponseEntity<?> getFormListAll(@RequestBody FormIdListRequest
     * request) {
     * List<FormShareDto> dtoList = ownerService.getFormListAll(request);
     * 
     * HttpHeaders headers = new HttpHeaders();
     * headers.add("X-Total-Count", String.valueOf(dtoList.size()));
     * 
     * return new ResponseEntity<>(dtoList, headers, HttpStatus.OK);
     * }
     */

    @PutMapping("/form")
    public ResponseEntity<?> updateForm(@RequestBody @Valid RequestFormDto requestForm) throws Exception {
        if (!formRepository.existsByFormId(requestForm.getFormId())) {
            return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
        }
        Form form = ownerService.updateForm(requestForm);
        FormDto formDto = FormDto.formTODto(form);
        return ResponseEntity.ok(formDto);
    }

    @PostMapping("/find-form")
    public ResponseEntity<?> findFormOwner(@RequestBody FormSearchOwnerDto formSearchOwnerDto, Pageable pageable)
            throws Exception {
        Page<FormDto> formDtos = ownerService.findFormOwner1(formSearchOwnerDto, pageable);
        return ResponseEntity.ok(formDtos);
    }

    @GetMapping("/menu-views")
    public ResponseEntity<String> getMenuViews(Pageable pageable) throws Exception {
        FormSearchOwnerDto formSearchOwnerDto = new FormSearchOwnerDto();
        Page<FormDto> formDtos = ownerService.findFormOwner1(formSearchOwnerDto, pageable);
        return ResponseEntity.ok(objectMapper.writeValueAsString(formDtos.getContent()));
    }

    @GetMapping("/form/change-status")
    public ResponseEntity<?> changeStatusRelease(@RequestParam String formId) throws Exception {
        if (!formRepository.existsByFormId(formId)) {
            return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
        }
        Form form = ownerService.changeToRelease(formId);
        return ResponseEntity.ok(objectMapper.writeValueAsString(form));
    }

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/form/change-status-edit")
     * public ResponseEntity<String> changeStatusEdit(@RequestParam String formId)
     * throws Exception {
     * if (!formRepository.existsByFormId(formId)) {
     * return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
     * }
     * Form form = ownerService.changeToEdit(formId);
     * return ResponseEntity.ok(objectMapper.writeValueAsString(form));
     * }
     */

    @DeleteMapping("/form/change-status")
    public ResponseEntity<?> changeStatusStopRelease(@RequestParam String formId) throws Exception {
        if (!formRepository.existsByFormId(formId)) {
            return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
        }
        Form form = ownerService.changeToStopRelease(formId);
        return ResponseEntity.ok(objectMapper.writeValueAsString(form));
    }

    @DeleteMapping("/form")
    public ResponseEntity<?> deleteForm(@RequestParam String formId) throws Exception {
        if (!formRepository.existsByFormId(formId)) {
            return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
        }
        Form form = formRepository.findById(formId).orElse(null);
        if (form != null && Long.valueOf(2L).equals(form.getStatusForm())) {
            return new ResponseEntity<>("Không thể xóa biểu mẫu đang phát hành", HttpStatus.CONFLICT);
        }
        ownerService.deleteForm(formId);
        return ResponseEntity.ok(objectMapper.writeValueAsString(formId));
    }

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/restore-form")
     * public ResponseEntity<?> restoreForm(@RequestParam String versionId) throws
     * Exception {
     * Form form = ownerService.restoreForm(versionId);
     * return ResponseEntity.ok(objectMapper.writeValueAsString(form));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PutMapping("/extend-validity-form")
     * public ResponseEntity<String> extendTime(@RequestBody @Valid RequestFormDto
     * requestForm) throws Exception {
     * if (!formRepository.existsByFormId(requestForm.getFormId())) {
     * return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
     * }
     * Form form = ownerService.extendTime(requestForm);
     * FormDto formDto = FormDto.formTODto(form);
     * return ResponseEntity.ok(gson.toJson(formDto));
     * }
     */

    @PostMapping("/duplicate-form")
    public ResponseEntity<?> duplicateForm(@RequestParam String formId, @RequestBody RequestAddForm requestAddForm)
            throws Exception {
        Form form = ownerService.duplicateForm(formId, requestAddForm);
        return ResponseEntity.ok(objectMapper.writeValueAsString(form));
    }

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/export-form")
     * public ResponseEntity<InputStreamResource> exportForm(@RequestBody
     * FormSearchOwnerExcelDto formSearchOwnerDto) throws Exception {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * ByteArrayInputStream excelData =
     * exportExcell.exportExcelForm(formSearchOwnerDto);
     * 
     * HttpHeaders headers = new HttpHeaders();
     * headers.add("Content-Disposition", "attachment; filename=Form.xlsx");
     * 
     * return
     * ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType(
     * "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).body(
     * new InputStreamResource(excelData));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/export-form-list")
     * public ResponseEntity<InputStreamResource> exportFormList(@RequestBody
     * RequestListForm requestListForm) throws Exception {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * ByteArrayInputStream excelData =
     * exportExcell.exportExcelFormList(requestListForm.getListFormId());
     * 
     * HttpHeaders headers = new HttpHeaders();
     * headers.add("Content-Disposition", "attachment; filename=Form.xlsx");
     * 
     * return
     * ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType(
     * "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).body(
     * new InputStreamResource(excelData));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/scan")
     * public ResponseEntity<?> scan(@RequestPart MultipartFile file) throws
     * Exception {
     * String standardResponse = scanVirusClient.scan(file);
     * return ResponseEntity.ok(standardResponse);
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/export-version")
     * public ResponseEntity<InputStreamResource> exportVersion(@RequestBody
     * SearchVersionDto searchVersionDto) throws Exception {
     * ByteArrayInputStream excelData =
     * exportExcell.exportExcelVersion1(searchVersionDto);
     * 
     * HttpHeaders headers = new HttpHeaders();
     * headers.add("Content-Disposition", "attachment; filename=Version.xlsx");
     * 
     * return
     * ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType(
     * "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).body(
     * new InputStreamResource(excelData));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/share-form")
     * public ResponseEntity<?> shareForm(@RequestBody List<RequestShareForm>
     * requestShareForms, @RequestParam String formId) throws Exception {
     * ownerService.shareForm(formId, requestShareForms);
     * return ResponseEntity.ok(gson.toJson(requestShareForms));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/delete-share-form")
     * public ResponseEntity<?> deleteShareForm(@RequestBody RequestDeleteShare
     * requestDeleteShare) throws Exception {
     * ownerService.deleteShareForm(requestDeleteShare);
     * return ResponseEntity.ok(gson.toJson(requestDeleteShare));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/list-procedure")
     * public ResponseEntity<String> getProcedure(@RequestParam String
     * formId, @RequestParam String procedureName) throws Exception {
     * if (!formRepository.existsByFormId(formId)) {
     * return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
     * }
     * List<ProcedureDto> procedureDtos = ownerService.getListProcedure(formId,
     * procedureName);
     * return ResponseEntity.ok(gson.toJson(procedureDtos));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/version")
     * public ResponseEntity<?> getVersion(@RequestBody SearchVersionDto
     * searchVersionDto, Pageable pageable) throws Exception {
     * SearchVersion searchVersion = new SearchVersion();
     * searchVersion.formId = searchVersionDto.formId;
     * searchVersion.sort = searchVersionDto.sort;
     * if (!(searchVersionDto.start == null || searchVersionDto.start.equals(""))) {
     * searchVersion.start =
     * DateConverter.parseStringToZonedDateTime(searchVersionDto.start);
     * }
     * if (!(searchVersionDto.end == null || searchVersionDto.end.equals(""))) {
     * searchVersion.end =
     * DateConverter.parseStringToZonedDateTime3(searchVersionDto.end);
     * }
     * if (searchVersion.sort == 0) {
     * if (searchVersionDto.version == null || searchVersionDto.version.equals(""))
     * {
     * Page<VersionDto> versions = ownerService.getVersion(searchVersion, pageable);
     * return ResponseEntity.ok(gson.toJson(versions));
     * } else if (searchVersionDto.version.equals("0")) {
     * List<VersionDto> versionDtos = new ArrayList<>();
     * return ResponseEntity.ok(gson.toJson(versionDtos));
     * } else {
     * searchVersion.version = Integer.parseInt(searchVersionDto.version);
     * Page<VersionDto> versions = ownerService.getVersion(searchVersion, pageable);
     * if (searchVersion.version > versions.getTotalElements()) {
     * searchVersion.formId = "";
     * Page<VersionDto> version1 = ownerService.getVersion(searchVersion, pageable);
     * return ResponseEntity.ok(gson.toJson(version1));
     * } else {
     * VersionDto version = versions.getContent().get((int)
     * versions.getTotalElements() - searchVersion.version);
     * List<VersionDto> versionDtos = new ArrayList<>();
     * versionDtos.add(version);
     * return ResponseEntity.ok(gson.toJson(versionDtos));
     * }
     * }
     * } else {
     * if (searchVersionDto.version == null || searchVersionDto.version.equals(""))
     * {
     * Page<VersionDto> versions = ownerService.getVersionSort(searchVersion,
     * pageable);
     * return ResponseEntity.ok(gson.toJson(versions));
     * } else if (searchVersionDto.version.equals("0")) {
     * List<VersionDto> versionDtos = new ArrayList<>();
     * return ResponseEntity.ok(gson.toJson(versionDtos));
     * } else {
     * searchVersion.version = Integer.parseInt(searchVersionDto.version);
     * Page<VersionDto> versions = ownerService.getVersionSort(searchVersion,
     * pageable);
     * if (searchVersion.version > versions.getTotalElements()) {
     * searchVersion.formId = "";
     * Page<VersionDto> version1 = ownerService.getVersion(searchVersion, pageable);
     * return ResponseEntity.ok(gson.toJson(version1));
     * } else {
     * VersionDto version = versions.getContent().get(searchVersion.version - 1);
     * List<VersionDto> versionDtos = new ArrayList<>();
     * versionDtos.add(version);
     * return ResponseEntity.ok(gson.toJson(versionDtos));
     * }
     * }
     * }
     * }
     */
}
