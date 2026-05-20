package com.vnu.uet.web.rest;

import com.vnu.uet.domain.Form;
import com.vnu.uet.repository.FormRepository;
import com.vnu.uet.security.SecurityUtils;
import com.vnu.uet.security.UserInFoDetails;
import com.vnu.uet.domain.enums.StatusForm;
import com.vnu.uet.service.rest.client.EflowClient;
import com.vnu.uet.service.dto.StandardResponse;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonResource {

    private final FormRepository formRepository;
    private final EflowClient eflowClient;

    Gson gson = new Gson();

    /*
     * @GetMapping("/form")
     * public ResponseEntity<?> previewForm(@RequestParam(required = false) String
     * versionId,
     * 
     * @RequestParam(required = false) String formId) throws Exception {
     * CommonInfo commonInfo = commonService.getCommonInfo(versionId, formId);
     * return ResponseEntity.ok(gson.toJson(commonInfo));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/list-variable")
     * public ResponseEntity<?> getListVariable(@RequestParam String versionId)
     * throws Exception {
     * String variableArr = commonService.getListVariable(versionId);
     * return ResponseEntity.ok(gson.toJson(variableArr));
     * }
     */

    @GetMapping("/check-edit")
    public ResponseEntity<?> checkEdit(@RequestParam String formId) throws Exception {
        String message;
        boolean edit;
        boolean lockStructure = false;

        if (!formRepository.existsById(formId)) {
            message = "Form not exist";
            edit = false;
            StandardResponse standardResponse = new StandardResponse(message, edit);
            return ResponseEntity.ok(standardResponse);
        }

        // Kiểm tra status từ eFlow
        try {
            ResponseEntity<Boolean> eflowResponse = eflowClient.isFormReleasing(formId);
            if (eflowResponse.getBody() != null && eflowResponse.getBody()) {
                lockStructure = true;
            }
        } catch (Exception e) {
            message = "Error checking form status from eFlow";
        }

        Form form = formRepository.findFormByFormId(formId);
        if (Objects.equals(form.getStatusForm(), StatusForm.RELEASE.getValue())) {
            message = "Can not edit";
            edit = false;
        } else {
            Optional<Form> optionalForm = formRepository.findById(formId);
            UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
            if (!(optionalForm.get().getCreatedBy().trim()).equals(currentUser.getLogin().trim())) {
                message = "Can not edit";
                edit = false;
                StandardResponse standardResponse = new StandardResponse(message, edit);
                return ResponseEntity.ok(standardResponse);
            } else {
                message = "Can edit";
                edit = true;
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("edit", edit);
        data.put("lockStructure", lockStructure);

        StandardResponse standardResponse = new StandardResponse(message, data);
        return ResponseEntity.ok(standardResponse);
    }

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/check-view")
     * public ResponseEntity<?> checkView(@RequestParam String formId) throws
     * Exception {
     * String message;
     * boolean view;
     * if (!formRepository.existsById(formId)) {
     * message = "Form not exist";
     * view = false;
     * StandardResponse standardResponse = new StandardResponse(message, view);
     * return ResponseEntity.ok(gson.toJson(standardResponse));
     * }
     * Form form = formRepository.findFormByFormId(formId);
     * if (!(form.getStatusForm() == 2L)) {
     * message = "Can not view form";
     * view = false;
     * } else {
     * UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
     * AuthorizeDto optionalForm =
     * authorizeRepository.getAuthor(currentUser.getLogin().trim(),
     * currentUser.getOrgIn().trim(), formId);
     * if (optionalForm == null) {
     * message = "Can not view form";
     * view = false;
     * StandardResponse standardResponse = new StandardResponse(message, view);
     * return ResponseEntity.ok(gson.toJson(standardResponse));
     * } else {
     * message = "Can view form";
     * view = true;
     * }
     * }
     * StandardResponse standardResponse = new StandardResponse(message, view);
     * return ResponseEntity.ok(gson.toJson(standardResponse));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/procedure")
     * public ResponseEntity<?> saveProcedure(@RequestBody RequestAddProcedure
     * requestAddProcedure) throws Exception {
     * if (!formRepository.existsByFormId(requestAddProcedure.getFormId())) {
     * return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
     * }
     * Procedures listProcedure = commonService.saveProcedure(requestAddProcedure);
     * return ResponseEntity.ok(gson.toJson(listProcedure));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/procedure-multi")
     * public ResponseEntity<?> saveProcedureV2(@RequestBody RequestAddProcedure
     * requestAddProcedure) throws Exception {
     * if (!formRepository.existsByFormId(requestAddProcedure.getFormId())) {
     * return new ResponseEntity<>("formId is not existed", HttpStatus.CONFLICT);
     * }
     * Procedures listProcedure =
     * commonService.saveProcedureV2(requestAddProcedure);
     * return ResponseEntity.ok(gson.toJson(listProcedure));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/procedure")
     * public ResponseEntity<?> getProcedure(@RequestParam(required = false) String
     * processId, @RequestParam(required = false) String userTaskId) throws
     * Exception {
     * List<StandardResponse> list = commonService.getFormEflow(processId,
     * userTaskId);
     * return ResponseEntity.ok(gson.toJson(list));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @DeleteMapping("/procedure")
     * public ResponseEntity<?> deleteProcedure(@RequestParam(required = false)
     * String processId, @RequestParam(required = false) String
     * userTaskId, @RequestParam(required = false) String formId) throws Exception {
     * commonService.deleteProcedure(processId, userTaskId, formId);
     * return ResponseEntity.ok(gson.toJson("Delete success"));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @GetMapping("/check-share")
     * public ResponseEntity<?> checkShare(@RequestParam String formId) {
     * return ResponseEntity.ok(gson.toJson(commonService.checkShare(formId)));
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/public")
     * public Mono<ResponseEntity<?>> callApi(@RequestBody RequestApi requestApi) {
     * String method = requestApi.getMethod().toUpperCase();
     * String fullUrl = requestApi.getUrl() + requestApi.getPath();
     * Map<String, String> headers = requestApi.getHeaders();
     * String token =
     * Optional.ofNullable(RequestContextHolder.getRequestAttributes())
     * .filter(ServletRequestAttributes.class::isInstance)
     * .map(ServletRequestAttributes.class::cast)
     * .map(attr -> attr.getRequest().getHeader("Authorization"))
     * .orElse(null);
     * 
     * WebClient client = webClientBuilder
     * .clone()
     * .exchangeStrategies(ExchangeStrategies.builder()
     * .codecs(configurer ->
     * configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024)
     * )
     * .build())
     * .build();
     * 
     * WebClient.RequestBodySpec requestSpec = client
     * .method(Objects.requireNonNull(HttpMethod.resolve(method)))
     * .uri(fullUrl)
     * .headers(httpHeaders -> {
     * if (headers != null) headers.forEach(httpHeaders::add);
     * if (headers == null || !headers.containsKey("Cookie")) {
     * httpHeaders.set("Authorization", token);
     * }
     * });
     * 
     * Mono<ResponseEntity<String>> responseMono;
     * 
     * if ("POST".equals(method) || "PUT".equals(method)) {
     * Object payload = requestApi.getPayload();
     * 
     * if (payload instanceof String) {
     * try {
     * payload = new Gson().fromJson((String) payload, new TypeToken<Map<String,
     * Object>>(){}.getType());
     * } catch (Exception e) {
     * return Mono.just(ResponseEntity.badRequest().body("Invalid JSON payload"));
     * }
     * }
     * 
     * responseMono = requestSpec
     * .contentType(MediaType.APPLICATION_JSON)
     * .bodyValue(payload)
     * .retrieve()
     * .toEntity(String.class);
     * 
     * } else {
     * responseMono = requestSpec
     * .retrieve()
     * .toEntity(String.class);
     * }
     * 
     * return ((Mono<ResponseEntity<?>>) (Mono<?>) responseMono)
     * .onErrorResume(e -> {
     * e.printStackTrace();
     * return
     * Mono.just(ResponseEntity.status(500).body("Error calling external API: " +
     * e.getMessage()));
     * });
     * }
     */

    /*
     * @Data
     * 
     * @NoArgsConstructor
     * public static class DataForm {
     * String jsonRaw;
     * }
     */

    /*
     * [UNUSED API]
     * 
     * @PostMapping("/idCheck")
     * public ResponseEntity<?> callApi(@RequestBody DataForm jsonRaw) {
     * 
     * // String body = jsonRaw.replace("//" , "");
     * 
     * 
     * HttpClient httpClient = HttpClient.newHttpClient();
     * String urlPath =
     * "https://apig.idcheck.xplat.online/api-security/v1/api-gateway/login";
     * Map<String, String> payloadApi = new HashMap<>();
     * payloadApi.put("token",
     * "d2JIUzVYTm83V1A5YUFsbV9fU3V6Y1Q4UjFFYTpmdnVHclFJM29VcVpNR2Y0RTcyX2UwQnFKWGth"
     * );
     * payloadApi.put("username", "econtract_prod");
     * payloadApi.put("password", "econtract@022024");
     * 
     * HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
     * .uri(URI.create(urlPath))
     * .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(payloadApi)));
     * HttpRequest request = requestBuilder.build();
     * String responseLogin = "";
     * try {
     * HttpResponse<String> response = httpClient.send(request,
     * HttpResponse.BodyHandlers.ofString());
     * responseLogin = response.body();
     * } catch (Exception e) {
     * // Xử lý lỗi nếu có
     * e.printStackTrace();
     * return ResponseEntity.status(500).body("Error calling external API");
     * }
     * 
     * JsonObject jsonObject =
     * JsonParser.parseString(responseLogin).getAsJsonObject();
     * 
     * // Trích xuất giá trị của trường "accessToken"
     * String accessToken = jsonObject.get("accessToken").getAsString();
     * 
     * HttpClient httpClientNFC = HttpClient.newHttpClient();
     * String urlPathCheckNFC =
     * "https://apig.idcheck.xplat.online/real-id/v1/api-gateway/check-nfc";
     * Map<String, Object> payloadApiNFC = new HashMap<>();
     * Map<String, String> headerNFC = new HashMap<>();
     * headerNFC.put("Authorization", "Bearer " + accessToken);
     * payloadApiNFC.put("json-raw", jsonRaw.getJsonRaw());
     * payloadApiNFC.put("is-check-bca", true);
     * 
     * 
     * HttpRequest requestBuilderNFC = HttpRequest.newBuilder()
     * .uri(URI.create(urlPathCheckNFC))
     * .header("Authorization", "Bearer " + accessToken)
     * .header("Content-Type", "application/json")
     * .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(payloadApiNFC)))
     * .build();
     * 
     * 
     * String responseNFC = "";
     * try {
     * HttpResponse<String> response = httpClientNFC.send(requestBuilderNFC,
     * HttpResponse.BodyHandlers.ofString());
     * responseNFC = response.body();
     * } catch (Exception e) {
     * // Xử lý lỗi nếu có
     * e.printStackTrace();
     * return ResponseEntity.status(500).body("Error calling external API");
     * }
     * 
     * return ResponseEntity.ok(responseNFC);
     * }
     */
}
