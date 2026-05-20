# UET Flow — eAi Gemini Integration + Preview UI

Bạn là autonomous coding agent. Project UET Flow đã có FE/BE chạy ổn (Đợt 1 PASS 7/7 Playwright). Đợt 2: tích hợp **Gemini AI cho eAi** + UI Preview "Phương án A" + auto-fill ticket.

**Working dir: `E:\Du_an\`** chứa `backend/` và `frontend/`.

**Mode:** Autonomous, chạy qua đêm (3-4 giờ), không hỏi. Hết Phase 5 thì viết `PROGRESS-EAI.md`.

---

## 0. NGUYÊN TẮC

- **Đọc trước, code sau.** View file 30+ dòng quanh chỗ sửa.
- **Test browser thật** (Playwright headed nếu có thể), không chỉ curl.
- **Backup eai image trước khi rebuild:** `docker tag docform:latest docform:backup-eai`
- **Mọi quyết định lớn → `PROGRESS-EAI.md`** ở `E:\Du_an\`
- **Mỗi rebuild Java ~5-15 phút**, đừng tưởng nhầm stuck
- **Không xóa volume mysql_data**
- **Không push git**

---

## 1. CONTEXT — Trạng thái đã verify

### Backend Docker
- 7 container đang chạy: mysql (3307), eaccount (8081), eform (8082), eflow (8083), erequest (8084), eai (8085), nginx (8080)
- **eai container đã có env `GEMINI_API_KEY=AIzaSyBYMe...`** (key thật, đã verified bằng `docker exec uetflow-eai sh -c "echo $GEMINI_API_KEY | head -c 10"` → trả `AIzaSyBYMe`)
- Endpoint sống: `POST /api/document-maps` trả 500 nếu thiếu file (đúng behavior), trả 405 nếu GET

### Code eAi đã có structure (KHÔNG viết lại từ đầu, chỉ wire Gemini SDK)

File hiện tại ở `E:\Du_an\backend\eAi\src\main\java\com\vnu\uet\`:

**Service:**
- `service/GeminiService.java` — có structure + TODO "Integrate com.google.genai SDK", hiện tại return mock data
- `service/PdfExtractionService.java` — OCR (Tesseract)
- `service/S3Service.java` — lưu file
- `service/DocumentMapService.java` — business logic chính
- `service/MockInternalService.java` — mock external calls

**Domain:**
- `domain/DocumentExtraction.java`
- `domain/FilledForm.java`

**Repository:**
- `repository/DocumentExtractionRepository.java`
- `repository/FilledFormRepository.java`

**DTOs:**
- `service/dto/DocumentMapResponseDTO.java`
- `service/dto/FilledFormResultDTO.java` (có fields: formName, confidence, missingFields, filledData [JSON string])

**Controllers:**
- `web/rest/DocumentMapResource.java` — endpoint chính `POST /api/document-maps`
- `web/rest/DocumentExtractionResource.java`
- `web/rest/FilledFormResource.java`

**Hiện tại GeminiService.java mock data:**
```java
mockData.put("ho_ten", "NGUYEN VAN A");
mockData.put("so_cccd", "012345678901");
mockData.put("ngay_sinh", "01/01/1990");
mockData.put("gioi_tinh", "Nam");
```

### Tài khoản test
| Email | Password | Roles |
|---|---|---|
| admin@uetflow.com | admin | [-1,1,2,3,4,5] |
| bi@uetflow.com | 805e1aee@123 | [-1,2,3] |
| user@uetflow.com | 8237cdf6@123 | [-1] |
| approver@uetflow.com | 56d9c4f6@123 | [-1] |

### Trạng thái flow đã publish (sau Đợt 1)
- Database có flows publish (status=DangHoatDong) trong eflow.flow
- FE eRequest gọi `GET /api/request/workflows` trả về list flow đã publish
- User chọn flow → render form khởi đầu → submit ticket

### Cấu trúc folder (CHÚ Ý — khác với session cũ)
```
E:\Du_an\
├── backend\
│   ├── eAccount\
│   ├── eForm\
│   ├── eFlow\
│   ├── eRequest\
│   ├── eAi\          ← target chính
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── .env          ← chứa GEMINI_API_KEY (DON'T COMMIT)
├── frontend\         ← ĐỔI: không phải FE/frontend như trước
│   ├── src\
│   ├── e2e\
│   ├── .env
│   └── package.json
└── PROGRESS-V2.md    ← đã có
```

---

## 2. ACCEPTANCE — Test E2E

Phải pass cả 5 bước (test bằng Playwright + manual nếu cần):

### A. eAi upload PDF → Preview screen
1. Login `user@uetflow.com`
2. Vào trang eAi
3. Upload file PDF (tạo file test `e2e/fixtures/sample-nghi-phep.pdf` với nội dung mock)
4. Loading spinner hiện trong 5-15 giây
5. **Trang chuyển sang Preview** với:
   - Tên đề xuất ticket (vd "Đơn xin nghỉ phép - Nguyễn Văn A")
   - Dropdown chọn flow (load `GET /api/request/workflows`)
   - Form preview các field extracted (mỗi field có input editable)
   - Indicator ✨ cho field do AI extract
   - Raw text (collapsed, "Xem text gốc")
6. Verify dữ liệu KHÔNG phải mock cứng "NGUYEN VAN A" — phải là data Gemini extract từ PDF thật

### B. Sửa data + Tạo ticket
1. Edit 1 field bất kỳ (vd Họ tên)
2. Chọn flow từ dropdown (cái flow đầu tiên trong list)
3. Click "Tạo yêu cầu"
4. Navigate sang `/erequest/new?flowId=X&prefill=<base64>`

### C. NewTicket auto-fill từ prefill
1. URL có query param `prefill=<base64-encoded-json>`
2. NewTicket decode prefill → set form initial values
3. Field nào có data từ prefill → fill sẵn
4. User confirm/sửa → Submit
5. POST `/api/request/ticket/init` thành công

### D. Approver thấy ticket
1. Login `approver@uetflow.com`
2. Vào "Cần xử lý" → ticket xuất hiện với data đầy đủ (data từ PDF gốc đã được Gemini extract + user edit)

### E. Verify Gemini thật
1. Upload 2 file PDF khác nhau (vd "Đơn nghỉ phép Nguyễn A" và "Đơn nghỉ phép Trần B")
2. Data extract phải khác nhau (không phải đều "NGUYEN VAN A")
3. Verify trong logs: `docker logs uetflow-eai | grep -i gemini` → thấy actual API call, không phải warning "API key not configured"

---

## 3. DANH SÁCH FIX

### 🔧 PHASE 1 — Backend Gemini SDK Integration (1-1.5h)

#### Task 1.1: Add Gemini REST client to GeminiService

**Cách triển khai (đề xuất):** dùng Spring `RestTemplate` gọi Gemini REST API trực tiếp — ít deps hơn google-cloud SDK.

Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

Body:
```json
{
  "contents": [{
    "parts": [{
      "text": "<prompt>"
    }]
  }],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

**Sửa `GeminiService.java`:**

```java
package com.vnu.uet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.service.dto.FilledFormResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    private final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key:dummy-api-key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public FilledFormResultDTO processDocumentExtraction(String rawText, String formName, String formTemplateJson) {
        log.info("Processing extraction with Gemini AI. Form: {}, raw text length: {}", formName, 
            rawText == null ? 0 : rawText.length());

        if ("dummy-api-key".equals(apiKey) || apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not configured. Returning mock data.");
            return generateMockFilledFormResult(formName);
        }

        try {
            String prompt = buildPrompt(rawText, formName, formTemplateJson);
            String responseText = callGeminiApi(prompt);
            return parseGeminiResponse(responseText, formName);
        } catch (Exception e) {
            log.error("Failed to process document with Gemini AI, falling back to mock", e);
            return generateMockFilledFormResult(formName);
        }
    }

    private String buildPrompt(String rawText, String formName, String formTemplateJson) {
        return String.format(
            "Bạn là AI trợ lý trích xuất thông tin từ văn bản tiếng Việt.\n\n" +
            "NHIỆM VỤ: Phân tích văn bản (OCR PDF) dưới đây và trích xuất thông tin theo SCHEMA form đã cho.\n\n" +
            "FORM NAME: %s\n\n" +
            "FORM SCHEMA (các field cần extract):\n%s\n\n" +
            "RAW TEXT (từ OCR PDF):\n%s\n\n" +
            "YÊU CẦU OUTPUT (JSON):\n" +
            "{\n" +
            "  \"confidence\": <0.0 đến 1.0>,\n" +
            "  \"filledData\": { <map field_name → value extract được> },\n" +
            "  \"missingFields\": \"<các field không tìm thấy, phân cách bằng dấu phẩy>\"\n" +
            "}\n\n" +
            "CHÚ Ý:\n" +
            "- Nếu không tìm thấy field nào, để empty string trong filledData\n" +
            "- Format ngày: dd/MM/yyyy\n" +
            "- Tên người: viết hoa chữ cái đầu, không viết HOA TẤT CẢ\n" +
            "- Chỉ trả JSON, không markdown, không lời giải thích\n",
            formName == null ? "Unknown" : formName,
            formTemplateJson == null ? "{}" : formTemplateJson,
            rawText == null ? "" : rawText
        );
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            model, apiKey
        );

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", new Object[]{part});
        requestBody.put("contents", new Object[]{content});
        
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("temperature", 0.2);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        log.debug("Calling Gemini API: {}", url.replaceAll("key=[^&]+", "key=REDACTED"));
        String response = restTemplate.postForObject(url, request, String.class);
        log.debug("Gemini response: {}", response);
        
        // Extract text from response
        JsonNode root = objectMapper.readTree(response);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && parts.size() > 0) {
                return parts.get(0).path("text").asText();
            }
        }
        throw new RuntimeException("Empty response from Gemini API: " + response);
    }

    private FilledFormResultDTO parseGeminiResponse(String responseText, String formName) {
        try {
            JsonNode root = objectMapper.readTree(responseText);
            
            FilledFormResultDTO dto = new FilledFormResultDTO();
            dto.setFormName(formName);
            dto.setConfidence(root.path("confidence").asDouble(0.9));
            dto.setMissingFields(root.path("missingFields").asText(""));
            
            JsonNode filledData = root.path("filledData");
            dto.setFilledData(objectMapper.writeValueAsString(filledData));
            
            return dto;
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", responseText, e);
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private FilledFormResultDTO generateMockFilledFormResult(String formName) {
        FilledFormResultDTO dto = new FilledFormResultDTO();
        dto.setFormName(formName);
        dto.setConfidence(0.95);
        dto.setMissingFields("ngay_cap, noi_cap");

        Map<String, String> mockData = new HashMap<>();
        mockData.put("ho_ten", "NGUYEN VAN A");
        mockData.put("so_cccd", "012345678901");
        mockData.put("ngay_sinh", "01/01/1990");
        mockData.put("gioi_tinh", "Nam");

        try {
            dto.setFilledData(objectMapper.writeValueAsString(mockData));
        } catch (Exception e) {
            dto.setFilledData("{}");
        }

        return dto;
    }
}
```

#### Task 1.2: Update application config

File `src/main/resources/config/application.yml` thêm:
```yaml
gemini:
  api:
    key: ${GEMINI_API_KEY:dummy-api-key}
    model: ${GEMINI_API_MODEL:gemini-2.0-flash}
```

#### Task 1.3: Verify DocumentMapResource trả response đúng schema cho FE

Đọc `DocumentMapResource.java` xem endpoint `POST /api/document-maps` hiện trả gì.

**Response phải có schema:**
```json
{
  "extractionId": "uuid",
  "fileName": "don-nghi-phep.pdf",
  "rawText": "...text từ OCR...",
  "suggestedFlowId": null,
  "suggestedFlowName": null,
  "formName": "...",
  "confidence": 0.92,
  "filledData": { "ho_ten": "...", "ngay_nghi": "..." },
  "missingFields": "..."
}
```

Nếu thiếu field nào → thêm vào DTO `DocumentMapResponseDTO.java` + populate trong service.

Logic flow trong DocumentMapService:
1. Save file vào S3/disk
2. Tesseract OCR PDF → rawText
3. Gọi GeminiService.processDocumentExtraction(rawText, formName, formTemplateJson)
4. Optional: Gemini suggest flow (extra call, nếu time cho phép)
5. Build DocumentMapResponseDTO, return

#### Task 1.4: Rebuild eai image

```bash
docker tag docform:latest docform:backup-eai

cd E:/Du_an/backend/eAi
docker run --rm -v $PWD:/app -v $HOME/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -w /app maven:3.9-eclipse-temurin-21 sh -c "./mvnw -ntp -Pprod verify jib:dockerBuild -DskipTests -Djib.to.image=docform:latest -Denforcer.skip=true"

cd ../
docker compose up -d --force-recreate eai
sleep 90
docker logs uetflow-eai --tail 30
```

#### Task 1.5: Test extraction qua curl

Tạo file test PDF `/tmp/test.pdf` hoặc dùng PDF có sẵn trong project.

```bash
curl -i -X POST http://localhost:8080/api/document-maps \
  -F "file=@/path/to/test.pdf" \
  -F "formName=Đơn xin nghỉ phép"
```

Mong đợi: 200, response có `filledData` với data khác mock cứng.

Verify logs:
```bash
docker logs uetflow-eai --tail 100 | grep -i gemini
```

Phải thấy "Calling Gemini API" — không phải "API key not configured".

### 🔧 PHASE 2 — Frontend Preview UI (Phương án A) (1.5h)

#### Task 2.1: Tìm trang eAi hiện tại

```bash
cd E:/Du_an/frontend
grep -rn "document-maps\|EAi\|eai" src/ --include="*.jsx" -l
```

Có thể nằm ở `src/pages/eAi/` hoặc tương tự. Tìm component upload + xử lý response.

#### Task 2.2: Refactor trang eAi thành 2 phase

```jsx
// src/pages/eAi/EAi.jsx (HOẶC tên hiện tại)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eAi } from '@/services/eAi';
import { eRequest } from '@/services/eRequest';
import UploadPhase from './UploadPhase';
import PreviewPhase from './PreviewPhase';

export default function EAi() {
  const [phase, setPhase] = useState('upload'); // 'upload' | 'loading' | 'preview'
  const [extractionResult, setExtractionResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async (file, formName) => {
    setUploadedFile(file);
    setPhase('loading');
    try {
      const result = await eAi.extractDocument(file, formName);
      setExtractionResult(result);
      setPhase('preview');
    } catch (e) {
      alert('Trích xuất thất bại: ' + e.message);
      setPhase('upload');
    }
  };

  const handleConfirmAndCreate = async (editedData, selectedFlowId) => {
    // Encode prefill data
    const prefillBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(editedData))));
    navigate(`/erequest/new?flowId=${selectedFlowId}&prefill=${prefillBase64}`);
  };

  const handleBack = () => {
    setPhase('upload');
    setExtractionResult(null);
  };

  return (
    <div className="eai-page">
      <h1>📄 Trích xuất thông tin từ PDF (AI)</h1>
      
      {phase === 'upload' && <UploadPhase onUpload={handleUpload} />}
      
      {phase === 'loading' && (
        <div className="loading-screen">
          <div className="spinner" />
          <p>🤖 AI đang phân tích tài liệu...</p>
          <p className="hint">Thời gian xử lý 5-15 giây</p>
        </div>
      )}
      
      {phase === 'preview' && extractionResult && (
        <PreviewPhase 
          result={extractionResult}
          fileName={uploadedFile?.name}
          onConfirm={handleConfirmAndCreate}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
```

```jsx
// src/pages/eAi/UploadPhase.jsx

import { useState, useRef } from 'react';

export default function UploadPhase({ onUpload }) {
  const [file, setFile] = useState(null);
  const [formName, setFormName] = useState('');
  const fileInputRef = useRef();

  const handleSubmit = () => {
    if (!file) {
      alert('Vui lòng chọn file PDF');
      return;
    }
    onUpload(file, formName || 'Auto-detect');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      alert('Chỉ chấp nhận file PDF');
    }
  };

  return (
    <div className="upload-phase">
      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file ? (
          <p>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
        ) : (
          <>
            <p>📤 Kéo & thả file PDF vào đây</p>
            <p className="hint">hoặc click để chọn</p>
          </>
        )}
      </div>

      <div className="form-row">
        <label>Loại tài liệu (tùy chọn)</label>
        <input 
          type="text" 
          value={formName} 
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Vd: Đơn xin nghỉ phép, Phiếu yêu cầu mua hàng..."
        />
      </div>

      <button onClick={handleSubmit} disabled={!file} className="btn-primary">
        🤖 Phân tích bằng AI
      </button>
    </div>
  );
}
```

```jsx
// src/pages/eAi/PreviewPhase.jsx

import { useState, useEffect } from 'react';
import { eRequest } from '@/services/eRequest';

export default function PreviewPhase({ result, fileName, onConfirm, onBack }) {
  const [editedData, setEditedData] = useState({});
  const [availableFlows, setAvailableFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // Parse filledData từ result (server trả JSON string hoặc object)
  useEffect(() => {
    let parsed = {};
    try {
      parsed = typeof result.filledData === 'string' 
        ? JSON.parse(result.filledData) 
        : result.filledData || {};
    } catch (e) {
      console.error('Failed to parse filledData', e);
    }
    setEditedData(parsed);
  }, [result]);

  // Load list flow đã publish
  useEffect(() => {
    eRequest.getWorkflows()
      .then(flows => {
        setAvailableFlows(flows || []);
        if (result.suggestedFlowId) {
          setSelectedFlowId(result.suggestedFlowId);
        } else if (flows && flows.length > 0) {
          setSelectedFlowId(flows[0].id || flows[0].flowId);
        }
      })
      .catch(console.error);
  }, [result]);

  const handleFieldChange = (key, value) => {
    setEditedData({ ...editedData, [key]: value });
  };

  const handleSubmit = () => {
    if (!selectedFlowId) {
      alert('Vui lòng chọn loại quy trình');
      return;
    }
    onConfirm(editedData, selectedFlowId);
  };

  const fieldEntries = Object.entries(editedData);

  return (
    <div className="preview-phase">
      <div className="preview-header">
        <button onClick={onBack} className="btn-back">← Tải file khác</button>
        <h2>✨ Data đã trích xuất từ {fileName}</h2>
        <div className="confidence-badge">
          Độ tin cậy: <strong>{(result.confidence * 100).toFixed(0)}%</strong>
        </div>
      </div>

      <div className="preview-body">
        {/* Form fields */}
        <div className="extracted-fields">
          <h3>📝 Thông tin trích xuất (có thể sửa)</h3>
          {fieldEntries.length === 0 ? (
            <p className="empty">Không có data nào được trích xuất.</p>
          ) : (
            fieldEntries.map(([key, value]) => (
              <div key={key} className="form-row">
                <label>
                  {key} <span className="ai-badge">✨ AI</span>
                </label>
                <input 
                  type="text" 
                  value={value || ''} 
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="editable"
                />
              </div>
            ))
          )}
          
          {result.missingFields && (
            <div className="warning">
              ⚠️ Các field không trích xuất được: {result.missingFields}
            </div>
          )}
        </div>

        {/* Flow selector */}
        <div className="flow-selector">
          <h3>🔀 Chọn quy trình</h3>
          <select 
            value={selectedFlowId} 
            onChange={(e) => setSelectedFlowId(e.target.value)}
          >
            <option value="">-- Chọn loại quy trình --</option>
            {availableFlows.map(flow => (
              <option key={flow.id || flow.flowId} value={flow.id || flow.flowId}>
                {flow.name || flow.flowName}
              </option>
            ))}
          </select>
        </div>

        {/* Raw text (collapsible) */}
        <details className="raw-text" onToggle={(e) => setShowRawText(e.target.open)}>
          <summary>📄 Xem text gốc từ PDF (debug)</summary>
          <pre>{result.rawText || 'No raw text'}</pre>
        </details>
      </div>

      <div className="preview-actions">
        <button onClick={onBack} className="btn-secondary">Hủy</button>
        <button 
          onClick={handleSubmit} 
          disabled={!selectedFlowId}
          className="btn-primary"
        >
          ➡️ Tạo yêu cầu với data này
        </button>
      </div>
    </div>
  );
}
```

#### Task 2.3: Service eAi

```js
// src/services/eAi.js
import api from './api';

export const eAi = {
  extractDocument: async (file, formName) => {
    const formData = new FormData();
    formData.append('file', file);
    if (formName) formData.append('formName', formName);
    
    const res = await api.post('/document-maps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60s timeout cho Gemini call
    });
    return res.data;
  }
};
```

#### Task 2.4: CSS styling (use existing design system)

Đảm bảo style nhất quán với phần còn lại của app (Tailwind hoặc CSS modules tùy project).

### 🔧 PHASE 3 — NewTicket prefill (30 phút)

#### Task 3.1: Patch NewTicket.jsx

```bash
grep -rn "NewTicket\|/erequest/new" src/ --include="*.jsx"
```

Tìm file `NewTicket.jsx`, thêm logic decode prefill:

```jsx
import { useSearchParams } from 'react-router-dom';

export default function NewTicket() {
  const [searchParams] = useSearchParams();
  const flowIdFromUrl = searchParams.get('flowId');
  const prefillBase64 = searchParams.get('prefill');
  
  const [initialFormData, setInitialFormData] = useState({});
  const [prefilledFields, setPrefilledFields] = useState(new Set());
  
  useEffect(() => {
    if (prefillBase64) {
      try {
        const decoded = decodeURIComponent(escape(atob(prefillBase64)));
        const parsed = JSON.parse(decoded);
        setInitialFormData(parsed);
        setPrefilledFields(new Set(Object.keys(parsed)));
      } catch (e) {
        console.error('Failed to decode prefill', e);
      }
    }
  }, [prefillBase64]);
  
  // Khi load form schema và set initial values, dùng initialFormData
  // Marker ✨ AI cho field nào nằm trong prefilledFields
  // ...
}
```

#### Task 3.2: Verify flow

1. URL trông như: `/erequest/new?flowId=123&prefill=eyJob190ZW4iOiJOZ3V5ZW4gVmFuIEEifQ==`
2. NewTicket decode → set form values
3. User thấy form đã prefilled, sửa được, submit
4. POST `/api/request/ticket/init` thành công

### 🔧 PHASE 4 — Test sample PDF (30 phút)

#### Task 4.1: Tạo file test PDF mock

Nếu không có file PDF mẫu, tạo bằng Python (chạy trong cmd Windows):

```bash
pip install reportlab --break-system-packages
```

```python
# E:/Du_an/scripts/create-sample-pdf.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

c = canvas.Canvas("E:/Du_an/sample-don-nghi-phep.pdf", pagesize=A4)
c.setFont("Helvetica", 14)

lines = [
    "DON XIN NGHI PHEP",
    "",
    "Kinh gui: Ban Giam doc",
    "",
    "Toi ten la: Tran Thi Bich",
    "Sinh ngay: 15/08/1995",
    "So CCCD: 023456789012",
    "Phong ban: Phong Ke toan",
    "",
    "Toi xin nghi phep tu ngay 25/05/2026 den ngay 28/05/2026",
    "Ly do: Viec gia dinh",
    "",
    "Toi xin cam doan nhung thong tin tren la dung su that.",
    "",
    "Ha Noi, ngay 20/05/2026",
    "                          Nguoi viet don",
    "",
    "                          Tran Thi Bich"
]

y = 800
for line in lines:
    c.drawString(50, y, line)
    y -= 25

c.save()
print("Created sample PDF")
```

```bash
python E:/Du_an/scripts/create-sample-pdf.py
```

#### Task 4.2: Test thủ công

1. Khởi động backend: `cd E:/Du_an/backend && docker compose up -d`
2. Khởi động FE: `cd E:/Du_an/frontend && npm run dev`
3. Mở browser `http://localhost:5173`
4. Login `user@uetflow.com` / `8237cdf6@123`
5. Vào trang eAi
6. Upload `sample-don-nghi-phep.pdf`
7. Đợi 5-15s
8. **Verify Preview screen hiện ra với data extracted thật** (Tran Thi Bich, không phải mock NGUYEN VAN A)
9. Sửa 1 field → chọn flow → Tạo yêu cầu
10. NewTicket page hiện form đã prefilled
11. Submit → ticket được tạo

### 🔧 PHASE 5 — Playwright E2E (30 phút)

```js
// frontend/e2e/eai-flow.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';

test('eAi extract PDF and create prefilled ticket', async ({ page }) => {
  // Login user
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'user@uetflow.com');
  await page.fill('input[type="password"]', '8237cdf6@123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(home|erequest|dashboard)/);
  
  // Navigate to eAi
  await page.goto('http://localhost:5173/eai');
  
  // Upload PDF
  const filePath = path.join(__dirname, '../sample-don-nghi-phep.pdf');
  await page.setInputFiles('input[type="file"]', filePath);
  await page.click('text=Phân tích bằng AI');
  
  // Wait for preview phase (up to 30s)
  await page.waitForSelector('text=Data đã trích xuất', { timeout: 30000 });
  
  // Verify data has been extracted (not mock)
  const extractedText = await page.textContent('.extracted-fields');
  expect(extractedText).not.toContain('NGUYEN VAN A'); // NOT mock data
  
  // Select flow
  await page.selectOption('select', { index: 1 });
  
  // Click create
  await page.click('text=Tạo yêu cầu với data này');
  
  // Verify on NewTicket page with prefill
  await page.waitForURL(/\/erequest\/new\?.*prefill=/);
  
  // Verify form has prefilled values
  const inputs = await page.$$('input[type="text"]');
  expect(inputs.length).toBeGreaterThan(0);
});
```

Chạy:
```bash
cd E:/Du_an/frontend
npx playwright test e2e/eai-flow.spec.js --headed
```

---

## 4. PHASE EXECUTION

### Phase 0 — Probe (10 phút)
- Verify backend up: `docker ps --filter "name=uetflow"` (phải có 7 container)
- Verify Gemini key: `docker exec uetflow-eai sh -c "echo $GEMINI_API_KEY | head -c 10"` (phải `AIzaSyBYMe` hoặc tương tự)
- Verify endpoint: `curl -i http://localhost:8080/api/document-maps` (phải trả 405 Method Not Allowed)
- Backup image: `docker tag docform:latest docform:backup-eai`
- Tạo `PROGRESS-EAI.md`

### Phase 1 — Backend (1-1.5h)
- Task 1.1: Sửa GeminiService
- Task 1.2: Update config yml
- Task 1.3: Verify DocumentMapResource response
- Task 1.4: Rebuild eai (5-15 phút, ĐỪNG tưởng stuck)
- Task 1.5: Test curl

### Phase 2 — Frontend (1.5h)
- Tasks 2.1-2.4: Refactor trang eAi thành Phương án A

### Phase 3 — NewTicket (30 phút)
- Tasks 3.1-3.2: Decode prefill

### Phase 4 — Manual test (30 phút)
- Tasks 4.1-4.2: Sample PDF + browser test

### Phase 5 — Playwright (30 phút)
- E2E test

### Phase 6 — Cleanup (15 phút)
- Update PROGRESS-EAI.md với:
  - Bảng task DONE/SKIP/BLOCKED
  - Files đã sửa
  - Backend image mới
  - Sample PDF location
  - Playwright result
- Commit từng repo (KHÔNG push):
  ```bash
  cd E:/Du_an/frontend && git add -A && git commit -m "feat(eai): Gemini integration + preview UI"
  cd E:/Du_an/backend/eAi && git add -A && git commit -m "feat: real Gemini API integration"
  ```

---

## 5. KHÔNG LÀM

- Không integrate AWS S3 thật (vẫn dùng local file/disk OK)
- Không sửa eAccount, eForm, eFlow, eRequest BE (đã ổn sau Đợt 1)
- Không deploy lên Internet
- Không refactor lớn
- Không xóa volume MySQL
- Không paste Gemini key vào source code (chỉ qua env var)
- Không commit `.env`

---

## 6. APPENDIX

### Status codes
- Ticket: 0=Nháp, 1=Đang thực hiện, 2=Hoàn thành, 3=Hủy, 4=Từ chối
- Form: statusForm=2 → Phát hành
- Flow: status "DangHoatDong" → Phát hành

### Debug commands

```bash
# Kiểm tra Gemini API call có gọi không
docker logs uetflow-eai --tail 100 | grep -i gemini

# Test direct Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hello in Vietnamese"}]}]}'

# Revert nếu rebuild fail
docker tag docform:backup-eai docform:latest
docker compose up -d --force-recreate eai
```

### Common issues

1. **Spring Boot OOM khi build**: tăng `JAVA_TOOL_OPTIONS: "-Xmx1g -Xms512m"` trong docker-compose
2. **Gemini timeout**: API có thể chậm 10-30s, tăng RestTemplate timeout
3. **Tesseract không OCR được PDF tiếng Việt**: cần language pack `vie.traineddata` 

---

## 7. KICKOFF

```bash
cd /e/Du_an  # hoặc cd E:/Du_an

# Phase 0
docker ps --filter "name=uetflow"
docker exec uetflow-eai sh -c "echo $GEMINI_API_KEY | head -c 10"
docker tag docform:latest docform:backup-eai

# Phase 1+: code + build (xem hướng dẫn trên)

# Phase 4: sample PDF
python scripts/create-sample-pdf.py

# Phase 5: playwright
cd frontend
npx playwright test e2e/eai-flow.spec.js --headed
```

Đi luôn không hỏi. Hết Phase 6 hoặc gặp BLOCKED > 30 phút thì pivot. Tổng thời gian ước tính: **3-4 giờ**.
