# UET Flow — Big Batch Fix v2: Luồng business end-to-end TRONG BROWSER

Bạn là autonomous coding agent. Session trước đã fix smoke-test curl (15 PASS) nhưng **UI thực tế trong browser KHÔNG hoạt động đúng**. Lần này phải fix cho user **demo được trong browser** theo đúng sơ đồ business 4 giai đoạn:

1. 🟡 **eForm**: vẽ → sửa label → lưu → publish
2. 🟢 **eFlow**: tạo flow (có flowGroup) → vẽ luồng → cấu hình node (performer + map_form) → lưu → publish → list workflow hiển thị flow vừa tạo
3. 🔵 **eRequest tạo**: user role -1 thấy flow đã publish → click → render form khởi đầu → submit ticket
4. 🔵 **eRequest approve**: approver thấy ticket trong "cần xử lý" → click → flow diagram với highlight → form kế thừa → phê duyệt → ticket chuyển "đã xử lý"

**Working dir: `E:\Duan\`** chứa `backend/` và `FE/frontend/`.

**Mode:** Autonomous, chạy qua đêm, không hỏi. Hết Phase 5 thì viết `PROGRESS-V2.md`.

---

## 0. NGUYÊN TẮC

- **TEST BROWSER thật, không chỉ curl.** Mỗi fix phải mở browser verify. Dùng `playwright` (đã install hoặc tự cài `npm i -D playwright` trong FE folder) headless để test FE, nếu khả thi.
- **Đọc trước, code sau.** View file 30+ dòng quanh chỗ sửa.
- **Acceptance:** test_browser_e2e.sh hoặc `playwright_test.js` PASS tất cả 7 bước (xem mục 2).
- **Mọi quyết định lớn → `PROGRESS-V2.md`** ở `E:\Duan\`.
- **Cho phép đụng BE** (eForm/eFlow/eRequest). Khi rebuild BE image:
  - Backup image cũ trước: `docker tag <image>:latest <image>:backup-v2`
  - Sau khi fix fail 3 lần → revert + ghi vào `BLOCKED`, tiếp tục item khác
  - Mỗi rebuild ~5-15 phút, đừng tưởng nhầm stuck
- **Không xóa volume mysql_data** (mất admin, user test).
- **Không push git.**

---

## 1. CONTEXT — Trạng thái đã verify (USER ĐÃ TEST BROWSER)

### Backend Docker đang chạy
- 7 container: mysql (3307), eaccount (8081), eform (8082), eflow (8083), erequest (8084), eai (8085), nginx (8080)
- Gateway nginx ở 8080 routes theo prefix path
- Smoke test curl đã pass 15/0/1 (session batch trước)

### Tài khoản test (đã seed, password verify)
| Email | Password | Roles |
|---|---|---|
| admin@uetflow.com | admin | [-1,1,2,3,4,5] |
| bi@uetflow.com | 805e1aee@123 | [-1,2,3] |
| user@uetflow.com | 8237cdf6@123 | [-1] |
| approver@uetflow.com | 56d9c4f6@123 | [-1] |

⚠️ **Verify trước khi dùng:** admin có thể bị reset role về [-1] sau khi rebuild eaccount image. Nếu vậy sync lại:

```bash
TOKEN=$(curl -sS -X POST http://localhost:8080/api/internal/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uetflow.com","password":"admin"}' | jq -r '.token')
echo "$TOKEN"

# Verify roles
echo "$TOKEN" | head -c 50
# Nếu roles=[-1] only → sync:
curl -X POST http://localhost:8080/api/permissions/sync \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"admin@uetflow.com","roles":[-1,1,2,3,4,5]}'

curl -X POST http://localhost:8080/api/permissions/sync \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"bi@uetflow.com","roles":[-1,2,3]}'
```

### USER ĐÃ TEST 7 BƯỚC — Kết quả browser (NGÀY 19/05/2026)

| Bước | Kết quả | Ghi chú |
|---|---|---|
| B1 Login admin | ✅ PASS | |
| B2 eForm vẽ + sửa label | ✅ PASS | Label sửa được |
| B3 Publish form | ✅ PASS | |
| **B4 Create flow with flowGroup** | ❌ **FAIL** | Modal KHÔNG có field flowGroup |
| **B5 Node config UI** | ❌ **FAIL** | Chỉ có Performer, KHÔNG có tab "Biểu mẫu" (source/target form, variable mapping) |
| **B6 Flow appears in list after create** | ❌ **FAIL** | List vẫn rỗng |
| B7a User sees flow | ❓ | Chưa test (vì B6 fail) |
| B7b Approver sees ticket | ❓ | |
| B7c Approve → status 2 | ❓ | |

→ **Lỗi gốc nằm ở eFlow** (B4-B6). Sửa được eFlow thì B7 mới test được.

### DB schema (đã dò)
- `eaccount.user_profile` (id, email, first_name, password, phone, dob, gender, position, job, department, avatar, is_active)
- `eaccount.user_token`
- `eflow.flow` (id, flow_name, **flow_group**, owner_name, superviser_name, department, jhi_describe, status, flow_start_date, flow_end_date)
- `eflow.node`, `eflow.relate_node`, `eflow.performer`, `eflow.map_form`, `eflow.variable`
- `erequest.ticket`, `erequest.ticket_step`, `erequest.ticket_data_link`

---

## 2. ACCEPTANCE — Test browser end-to-end

Phải pass 7 bước này trong browser:

### A. eForm (✅ đã OK, chỉ verify regression)
1. Login `bi@uetflow.com`
2. Vẽ form mới với field input, label "Lý do"
3. Sửa label → "Lý do nghỉ phép"
4. Lưu → form xuất hiện trong list
5. Publish → statusForm=2

### B. eFlow tạo flow ❌ FIX

1. Login `bi@uetflow.com`
2. Vào EFlowWorkflow → click **"Thêm mới"**
3. **Modal hiện ra có field "Nhóm quy trình"** (BẮT BUỘC NHẬP)
   - Dropdown load từ `GET /api/workflow/group` nếu có data
   - Có option "+ Tạo nhóm mới" cho user gõ
   - Default: "default" nếu list rỗng
4. Điền: flowName="Demo", flowGroup="default", department="QA", describe="..."
5. Submit → navigate sang WorkflowDesigner

### C. eFlow vẽ luồng + cấu hình node ❌ FIX

1. Trong WorkflowDesigner:
   - Drag node "Bắt đầu" (start)
   - Drag node "eForm" (user_task) — đã đổi từ "eAccount"
   - Drag node "Kết thúc" (end)
   - Nối edges: start → eForm → end
2. Click vào node "eForm" → panel cấu hình bên phải có **2 SECTIONS rõ ràng**:

   **Section 1: Người thực hiện** (đã có)
   - Input email performer
   - Autocomplete từ `/api/proxy/eaccount/users?q=...`
   - Click Save → `POST /api/node/{nodeId}/performer`

   **Section 2: Biểu mẫu kế thừa** ❌ THIẾU, CẦN THÊM
   - Dropdown "Form nguồn (kế thừa từ)": load từ `GET /api/proxy/eform/published-forms`
   - Dropdown "Form đích (sẽ điền)": load từ cùng API
   - Sau khi chọn 2 forms: hiện bảng mapping variables
     - Cột trái: variables của form nguồn (lấy từ form.variableArr)
     - Cột phải: dropdown để map sang variable của form đích
   - Nút "Lưu ánh xạ" → `POST /api/node/{nodeId}/map-form` + `POST /api/map-form/{mapFormId}/variable`

3. Click "Lưu" header → persist nodes/edges/info qua API

### D. eFlow publish + list ❌ FIX

1. Click button "Phát hành" → `POST /api/workflow/{flowId}/status` body `"DangHoatDong"`
2. Quay lại trang list EFlowWorkflow → **flow "Demo" xuất hiện trong list** (đây là test B6)
   - List có dropdown filter group ở top → default chọn group đầu tiên
   - Khi đổi group → reload list

### E. eRequest tạo ticket (user role -1)

1. Login `user@uetflow.com`
2. Trang chủ eRequest hiện list flow đã publish (`GET /api/request/workflows`)
3. Click flow "Demo" → render form khởi đầu (form được set làm sourceForm của user_task đầu tiên)
4. Nhập form → click "Gửi yêu cầu"
5. `POST /api/request/ticket/init` thành công → notify + redirect

### F. eRequest approve (approver)

1. Login `approver@uetflow.com`
2. Vào ERequest → tab "Giao dịch cần xử lý" hiện ticket vừa tạo (`GET /api/request/tickets/pending-tasks`)
3. Click ticket → TransactionDetail
4. **Hiển thị flow diagram** (read-only WorkflowDesigner) với các bước đã qua highlight màu xanh/vàng
5. **Hiển thị form được kế thừa** (data từ ticket_data_link, render dùng formSchema của targetForm)
6. Action panel có nút "Phê duyệt" + "Từ chối"
7. Click "Phê duyệt" → `POST /api/request/ticket/{id}/action`
8. Ticket cập nhật `status=2` (Hoàn thành) → chuyển sang Kanban cột "Đã xử lý"

---

## 3. DANH SÁCH FIX (theo thứ tự ưu tiên)

### 🔧 GROUP 1 — eFlow Frontend (CRITICAL — block B4, B5, B6)

#### F1. Modal "Thêm mới" — thêm field flowGroup

**Triệu chứng (user confirmed):** Modal hiện ra không có chỗ nhập flowGroup → flow tạo ra có `flow_group=NULL` → list filter loại bỏ → ẩn.

**Hành động:**

1. Tìm component: `cd E:\Duan\FE\frontend && grep -rn "Thêm mới\|workflow/init\|initWorkflow" --include="*.jsx" src/`
2. Có thể là file `WorkflowEditor.jsx`, `EFlowWorkflow.jsx`, hoặc modal con
3. Thêm field "Nhóm quy trình":
   ```jsx
   const [groups, setGroups] = useState([]);
   const [flowGroup, setFlowGroup] = useState('');
   const [showNewGroupInput, setShowNewGroupInput] = useState(false);
   
   useEffect(() => {
     eFlow.getGroups()
       .then(data => {
         setGroups(Array.isArray(data) ? data : []);
         if (data?.length > 0 && !flowGroup) setFlowGroup(data[0]);
       })
       .catch(() => setShowNewGroupInput(true));
   }, []);
   
   // UI
   <div className="form-field">
     <label>Nhóm quy trình *</label>
     {!showNewGroupInput ? (
       <Select 
         value={flowGroup} 
         onChange={(v) => v === '__NEW__' ? setShowNewGroupInput(true) : setFlowGroup(v)}
         required
       >
         {groups.map(g => <option key={g} value={g}>{g}</option>)}
         <option value="__NEW__">+ Tạo nhóm mới...</option>
       </Select>
     ) : (
       <>
         <Input value={flowGroup} onChange={e => setFlowGroup(e.target.value)} 
                placeholder="Tên nhóm mới" required />
         <button onClick={() => setShowNewGroupInput(false)}>← Chọn từ list</button>
       </>
     )}
   </div>
   ```
4. Submit handler:
   ```jsx
   const handleSubmit = async () => {
     if (!flowName || !flowGroup) { 
       showToast('Vui lòng điền đầy đủ', 'error'); return; 
     }
     try {
       const res = await eFlow.initWorkflow({ 
         flowName, flowGroup, department, describe 
       });
       navigate(`/eflow/designer/${res.id}`);
     } catch (e) {
       showToast(`Lỗi: ${e.message}`, 'error');
     }
   };
   ```
5. Service `services/eFlow.js`: đảm bảo có
   ```js
   export const eFlow = {
     getGroups: () => api.get('/workflow/group'),
     initWorkflow: (body) => api.post('/workflow/init', body),
     // ... existing methods
   };
   ```

#### F2. EFlowWorkflow.jsx — filter dropdown group + reload list

**Triệu chứng:** Sau khi tạo flow xong, list vẫn rỗng.

**Hành động:**

1. Tìm `EFlowWorkflow.jsx`
2. Thêm state filter group:
   ```jsx
   const [selectedGroup, setSelectedGroup] = useState('');
   const [groups, setGroups] = useState([]);
   const [flows, setFlows] = useState([]);
   
   useEffect(() => {
     loadGroups();
   }, []);
   
   useEffect(() => {
     if (selectedGroup) loadFlows();
   }, [selectedGroup]);
   
   const loadGroups = async () => {
     const data = await eFlow.getGroups();
     setGroups(Array.isArray(data) ? data : []);
     if (data?.length > 0) setSelectedGroup(data[0]);
   };
   
   const loadFlows = async () => {
     const data = await eFlow.listFlows({ flowGroup: selectedGroup });
     setFlows(Array.isArray(data) ? data : []);
   };
   ```
3. UI: dropdown filter ở top trang
4. **Quan trọng:** sau khi tạo flow mới và quay lại, **reload cả groups và flows**:
   ```jsx
   useEffect(() => {
     // Listen for navigation back from designer
     const onFocus = () => { loadGroups(); loadFlows(); };
     window.addEventListener('focus', onFocus);
     return () => window.removeEventListener('focus', onFocus);
   }, []);
   ```

#### F3. WorkflowDesigner — Node config panel: thêm Section "Biểu mẫu"

**Triệu chứng:** Click vào node user_task chỉ thấy section Performer, thiếu Biểu mẫu (form nguồn/đích + variable mapping).

**Hành động:**

1. Tìm component node config: `grep -rn "performer\|NodeConfig\|configPanel" --include="*.jsx" src/pages/eFlow/`
2. Thêm UI Section "Biểu mẫu":
   ```jsx
   const [publishedForms, setPublishedForms] = useState([]);
   const [sourceFormId, setSourceFormId] = useState('');
   const [targetFormId, setTargetFormId] = useState('');
   const [variableMapping, setVariableMapping] = useState({});
   const [sourceVariables, setSourceVariables] = useState([]);
   const [targetVariables, setTargetVariables] = useState([]);
   
   useEffect(() => {
     eFlow.getPublishedForms()
       .then(setPublishedForms)
       .catch(console.error);
   }, []);
   
   // Khi chọn sourceFormId, load variables của form đó
   useEffect(() => {
     if (sourceFormId) {
       eForm.getFormById(sourceFormId)
         .then(form => setSourceVariables(form.variableArr || []));
     }
   }, [sourceFormId]);
   
   useEffect(() => {
     if (targetFormId) {
       eForm.getFormById(targetFormId)
         .then(form => setTargetVariables(form.variableArr || []));
     }
   }, [targetFormId]);
   
   const saveMapForm = async () => {
     try {
       const mapForm = await eFlow.createMapForm(nodeId, { sourceFormId, targetFormId });
       // Lưu từng variable mapping
       for (const [srcVarId, tgtVarId] of Object.entries(variableMapping)) {
         if (tgtVarId) {
           await eFlow.createVariable(mapForm.id, { 
             variableSourceFormId: srcVarId, 
             variableTargetFormId: tgtVarId 
           });
         }
       }
       showToast('Đã lưu ánh xạ form', 'success');
     } catch (e) {
       showToast(`Lỗi: ${e.message}`, 'error');
     }
   };
   
   // UI
   <section className="node-config-section">
     <h4>📄 Biểu mẫu kế thừa</h4>
     
     <div className="form-row">
       <label>Form nguồn (kế thừa từ)</label>
       <Select value={sourceFormId} onChange={e => setSourceFormId(e.target.value)}>
         <option value="">-- Chọn form --</option>
         {publishedForms.map(f => 
           <option key={f.formId} value={f.formId}>{f.formName}</option>
         )}
       </Select>
     </div>
     
     <div className="form-row">
       <label>Form đích (sẽ điền)</label>
       <Select value={targetFormId} onChange={e => setTargetFormId(e.target.value)}>
         <option value="">-- Chọn form --</option>
         {publishedForms.map(f => 
           <option key={f.formId} value={f.formId}>{f.formName}</option>
         )}
       </Select>
     </div>
     
     {sourceVariables.length > 0 && targetVariables.length > 0 && (
       <div className="variable-mapping">
         <h5>Ánh xạ biến</h5>
         <table>
           <thead>
             <tr><th>Biến nguồn</th><th>→</th><th>Biến đích</th></tr>
           </thead>
           <tbody>
             {sourceVariables.map(sv => (
               <tr key={sv.code || sv.id}>
                 <td>{sv.variableName} <small>({sv.variableType})</small></td>
                 <td>→</td>
                 <td>
                   <Select 
                     value={variableMapping[sv.id] || ''}
                     onChange={e => setVariableMapping({
                       ...variableMapping, 
                       [sv.id]: e.target.value
                     })}
                   >
                     <option value="">-- Không ánh xạ --</option>
                     {targetVariables
                       .filter(tv => tv.variableType === sv.variableType)
                       .map(tv => (
                         <option key={tv.id} value={tv.id}>
                           {tv.variableName}
                         </option>
                       ))}
                   </Select>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}
     
     <Button onClick={saveMapForm} disabled={!sourceFormId || !targetFormId}>
       💾 Lưu ánh xạ form
     </Button>
   </section>
   ```

3. Service `eFlow.js` cần thêm:
   ```js
   getPublishedForms: () => api.get('/proxy/eform/published-forms'),
   createMapForm: (nodeId, body) => api.post(`/node/${nodeId}/map-form`, body),
   createVariable: (mapFormId, body) => api.post(`/map-form/${mapFormId}/variable`, body),
   ```

4. Service `eForm.js`:
   ```js
   getFormById: (formId) => api.get(`/owner/form?formId=${formId}`),
   ```

### 🔧 GROUP 2 — Backend (eFlow + eRequest)

#### B1. eFlow BE — `POST /workflow/init` default flowGroup

Defensive: nếu FE quên gửi flowGroup → BE auto-fill "default":

1. `cd E:\Duan\backend\eFlow`
2. `grep -rn "workflow/init\|initWorkflow" --include="*.java" src/`
3. Trong service init:
   ```java
   if (flow.getFlowGroup() == null || flow.getFlowGroup().isBlank()) {
     flow.setFlowGroup("default");
   }
   ```
4. Rebuild image:
   ```bash
   docker tag eflow:latest eflow:backup-v2
   cd E:/Duan/backend/eFlow
   docker run --rm -v $PWD:/app -v $HOME/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -w /app maven:3.9-eclipse-temurin-21 sh -c "./mvnw -ntp -Pprod verify jib:dockerBuild -DskipTests -Djib.to.image=eflow:latest -Denforcer.skip=true"
   cd ../
   docker compose up -d eflow
   sleep 60
   ```

#### B2. eFlow BE — `GET /workflow/group` đảm bảo trả về groups thật

Hiện tại API trả `[]` dù có data. Có thể bug query.

1. `grep -rn "workflow/group\|getFlowGroups" --include="*.java" src/`
2. Sửa query (JPA):
   ```java
   @Query("SELECT DISTINCT f.flowGroup FROM Flow f WHERE f.flowGroup IS NOT NULL AND f.flowGroup <> ''")
   List<String> findDistinctFlowGroups();
   ```
3. Verify: `curl http://localhost:8080/api/workflow/group` phải trả `["default", ...]`

#### B3. eFlow BE — `POST /workflow` (list flows) — fix nếu filter sai

User báo `POST /api/workflow` body `{flowGroup: 'default'}` trả `[]` dù DB có 5 flow với flow_group='default'.

1. `grep -rn "/workflow.*POST\|searchWorkflow\|listFlows" --include="*.java" src/`
2. Debug query, có thể đang filter thêm điều kiện ẩn (status, owner_name, etc.)
3. Test với multiple body shapes:
   ```bash
   curl -X POST http://localhost:8080/api/workflow -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"flowGroup":"default"}'
   ```
4. Fix để trả về list flows match flowGroup, không filter thêm điều kiện khác trừ khi cần thiết

#### B4. eRequest BE — `pending-tasks` cần trả về ticket cho performer

Bug từ session trước. Khi user role -1 submit ticket, performer phải thấy được.

1. `cd E:\Duan\backend\eRequest`
2. `grep -rn "pending-tasks\|getPendingTasks" --include="*.java" src/`
3. Logic phải là:
   - Khi `POST /ticket/init`: tạo ticket + tạo `ticket_step` đầu tiên với `performer_email` = email của performer node user_task đầu tiên (gọi eFlow để lấy)
   - Khi `POST /ticket/{id}/submit`: 
     - Update ticket_step cũ thành status=1 (hoàn thành)
     - Gọi eFlow `GET /internal/flow/{flowId}/next-node` để biết node tiếp theo
     - Tạo ticket_step mới với performer_email tương ứng
   - `GET /pending-tasks`: query `ticket_step WHERE performer_email = currentUserEmail AND status = 0`

#### B5. eRequest BE — Approve update ticket status

Bug B2 từ session trước. Approve trả 200 nhưng status không đổi.

1. `grep -rn "/action\|takeAction" --include="*.java" src/`
2. Trong handler `POST /ticket/{id}/action`:
   ```java
   if ("APPROVE".equals(action)) {
     // Hoàn thành step hiện tại
     currentStep.setStatus(1);
     currentStep.setFinishedAt(Instant.now());
     stepRepo.save(currentStep);
     
     // Tìm next node
     NextNode next = eFlowClient.getNextNode(ticket.getFlowId(), currentStep.getNodeId(), null);
     
     if (next == null || "end".equals(next.getNodeType())) {
       // Hết flow → hoàn thành ticket
       ticket.setStatus(2);
       ticket.setCompletedAt(Instant.now());
       ticketRepo.save(ticket);
     } else {
       // Tạo step mới cho node tiếp theo
       TicketStep newStep = new TicketStep();
       newStep.setTicketId(ticket.getId());
       newStep.setNodeId(next.getNodeId());
       newStep.setPerformerEmail(next.getPerformerEmail());
       newStep.setStatus(0);
       newStep.setStartedAt(Instant.now());
       stepRepo.save(newStep);
       
       ticket.setCurrentStepId(newStep.getId());
       ticketRepo.save(ticket);
     }
   } else if ("REJECT".equals(action)) {
     currentStep.setStatus(2);
     currentStep.setNote(note);
     stepRepo.save(currentStep);
     ticket.setStatus(4);
     ticketRepo.save(ticket);
   }
   ```

#### B6. eFlow BE — Endpoint `/internal/flow/{flowId}/next-node`

Cần cho B5 hoạt động.

1. `cd E:\Duan\backend\eFlow`
2. `grep -rn "next-node\|nextNode" --include="*.java" src/`
3. Nếu chưa có, tạo:
   ```java
   @GetMapping("/api/internal/flow/{flowId}/next-node")
   public NextNodeResponse getNextNode(
       @PathVariable Long flowId, 
       @RequestParam Long currentNodeId
   ) {
     List<RelateNode> outgoing = relateNodeRepo.findByNodeId(currentNodeId);
     if (outgoing.isEmpty()) return null;
     
     // Single outgoing edge
     Long nextNodeId = outgoing.get(0).getChildNodeId();
     Node next = nodeRepo.findById(nextNodeId).orElseThrow();
     
     String performerEmail = null;
     if ("user_task".equals(next.getNodeType())) {
       List<Performer> performers = performerRepo.findByNodeIdOrderByOrderExecution(nextNodeId);
       performerEmail = performers.isEmpty() ? null : performers.get(0).getUserId();
     }
     
     return new NextNodeResponse(nextNodeId, next.getNodeType(), next.getNodeName(), performerEmail);
   }
   ```

### 🔧 GROUP 3 — eRequest UI

#### F4. TransactionDetail — Flow diagram read-only với highlight

User báo "Ấn vào thì sẽ hiển thị toàn bộ flow và những bước nào đã qua thì sẽ phát sáng".

1. Tìm `TransactionDetail.jsx`
2. Render flow diagram dùng cùng library với WorkflowDesigner (react-flow hoặc tương đương) nhưng ở chế độ read-only
3. Lấy data:
   ```jsx
   const [flowDef, setFlowDef] = useState(null);
   const [completedSteps, setCompletedSteps] = useState([]);
   
   useEffect(() => {
     if (!ticket) return;
     eFlow.getDefinition(ticket.flowId).then(setFlowDef);
     eRequest.getTicketHistory(ticket.id).then(steps => {
       setCompletedSteps(steps.filter(s => s.status === 1).map(s => s.nodeId));
     });
   }, [ticket]);
   
   // Render nodes with conditional styling
   <FlowDiagram 
     nodes={flowDef?.nodes?.map(n => ({
       ...n,
       style: completedSteps.includes(n.id) 
         ? { background: '#90EE90', border: '2px solid green' } 
         : n.id === ticket.currentStepId 
         ? { background: '#FFE4B5', border: '2px solid orange' }
         : {}
     }))} 
     edges={flowDef?.edges}
     readOnly={true}
   />
   ```

#### F5. TransactionDetail — Render form kế thừa

User báo "Ấn vào và hiển thị thông tin form được kế thừa".

1. Khi load detail, lấy `ticket_data_link` để biết formData parent + current
2. Render form schema của targetForm với data từ sourceForm (đã được map):
   ```jsx
   const [currentForm, setCurrentForm] = useState(null);
   const [inheritedData, setInheritedData] = useState({});
   
   useEffect(() => {
     if (!ticket?.currentStepId) return;
     // Lấy node info
     const step = ticket.steps.find(s => s.id === ticket.currentStepId);
     // Lấy map_form của node để biết targetForm + variable mapping
     eFlow.getNodeConfig(step.nodeId).then(cfg => {
       if (cfg.mapForm) {
         eForm.getFormById(cfg.mapForm.targetFormId).then(setCurrentForm);
         // Lấy data từ parent form, map theo variable mapping
         eRequest.getTicketData(ticket.id, step.nodeId).then(setInheritedData);
       }
     });
   }, [ticket]);
   
   {currentForm && (
     <FormRenderer 
       schema={JSON.parse(currentForm.jsonForm)} 
       value={inheritedData}
       onChange={setInheritedData}
     />
   )}
   ```

### 🔧 GROUP 4 — Quick fix data (SQL)

```bash
# Fix legacy flows có flow_group NULL
docker exec uetflow-mysql mysql -uroot -proot eflow -e "UPDATE flow SET flow_group='default' WHERE flow_group IS NULL;"

# Verify
docker exec uetflow-mysql mysql -uroot -proot eflow -e "SELECT id, flow_name, flow_group, status FROM flow ORDER BY id DESC LIMIT 10;"
```

---

## 4. PHASE EXECUTION

### Phase 0 — Probe (15 phút)

1. `cd E:\Duan`
2. Verify backend up:
   ```bash
   docker ps --filter "name=uetflow"
   ```
   Phải có 7 container Up. Nếu không: `cd backend && docker compose up -d`
3. Verify gateway:
   ```bash
   curl http://localhost:8080/api/permissions/system-roles
   ```
   Phải trả 200 + JSON 6 roles
4. Verify accounts:
   ```bash
   for email in admin@uetflow.com bi@uetflow.com user@uetflow.com approver@uetflow.com; do
     echo "Testing $email"
     curl -sS -X POST http://localhost:8080/api/internal/auth/generate-token \
       -H "Content-Type: application/json" \
       -d "{\"email\":\"$email\",\"password\":\"...\"}" | jq -r '.roles'
   done
   ```
5. Verify roles của admin có đủ `[-1,1,2,3,4,5]`. Nếu không, sync (xem mục 1 Context)
6. Tạo `PROGRESS-V2.md` đánh dấu Phase 0 done
7. Backup BE images:
   ```bash
   docker tag eflow:latest eflow:backup-v2
   docker tag erequest:latest erequest:backup-v2
   docker tag eaccount:latest eaccount:backup-v2
   docker tag eform-be:latest eform-be:backup-v2
   ```

### Phase 1 — Quick SQL fix (2 phút)

```bash
docker exec uetflow-mysql mysql -uroot -proot eflow -e "UPDATE flow SET flow_group='default' WHERE flow_group IS NULL;"
```

### Phase 2 — Frontend eFlow (2-3h)

Theo thứ tự: F1 → F2 → F3.

Sau mỗi fix:
- `npm run build` → 0 errors
- `npm run dev` → load `http://localhost:5173`, test manual nhanh
- Commit local: `git add -A && git commit -m "fix(eflow): <F1/F2/F3 description>"`

### Phase 3 — Backend (2-3h)

Theo thứ tự: B1 → B2 → B3 → B6 (cần cho B5) → B5 → B4.

Mỗi fix BE:
1. Sửa code Java
2. Build image (5-15 phút):
   ```bash
   cd E:/Duan/backend/<service>
   docker run --rm -v $PWD:/app -v $HOME/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -w /app maven:3.9-eclipse-temurin-21 sh -c "./mvnw -ntp -Pprod verify jib:dockerBuild -DskipTests -Djib.to.image=<image>:latest -Denforcer.skip=true"
   ```
3. Restart container:
   ```bash
   cd E:/Duan/backend
   docker compose up -d <service>
   sleep 60
   docker logs uetflow-<service> --tail 50
   ```
4. Test endpoint qua curl
5. Nếu fail 3 lần → revert + ghi `BLOCKED`

### Phase 4 — Frontend eRequest (1-2h)

F4 + F5: TransactionDetail UI.

### Phase 5 — Browser E2E test (45 phút)

Cài Playwright nếu chưa có:
```bash
cd E:/Duan/FE/frontend
npm i -D @playwright/test
npx playwright install chromium
```

Viết test `e2e/business-flow.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('Full business flow', async ({ page }) => {
  // A. Login bi
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name=email]', 'bi@uetflow.com');
  await page.fill('input[name=password]', '805e1aee@123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/(home|dashboard|erequest)/);
  
  // B. Create form
  await page.goto('http://localhost:5173/eform');
  await page.click('text=Thêm mới');
  // ... drag field, set label, save, publish
  
  // C. Create flow
  await page.goto('http://localhost:5173/eflow');
  await page.click('text=Thêm mới');
  await expect(page.locator('text=Nhóm quy trình')).toBeVisible(); // F1 test
  await page.fill('input[name=flowName]', 'E2E Test Flow');
  await page.fill('input[name=flowGroup]', 'default');
  // ... vẽ luồng, gán performer, map form, save, publish
  
  // D. Verify flow appears in list
  await page.goto('http://localhost:5173/eflow');
  await expect(page.locator('text=E2E Test Flow')).toBeVisible();
  
  // E. User tạo ticket
  await page.click('text=Logout');
  await page.fill('input[name=email]', 'user@uetflow.com');
  // ... submit ticket
  
  // F. Approver duyệt
  // ... approve, verify status=2
});
```

Chạy:
```bash
npx playwright test --headed
```

Hoặc nếu không có Playwright: viết bash script gọi curl mô phỏng cả 7 bước.

### Phase 6 — Cleanup (15 phút)

1. Update `PROGRESS-V2.md` đầy đủ:
   - Bảng fix DONE/SKIPPED/BLOCKED
   - Files đã sửa từng service
   - E2E test kết quả
   - Backend images mới
2. Commit từng repo (KHÔNG push):
   ```bash
   cd E:/Duan/FE/frontend && git add -A && git commit -m "fix(ui): full business flow v2"
   cd E:/Duan/backend/eFlow && git add -A && git commit -m "fix: flowGroup default + next-node endpoint"
   cd E:/Duan/backend/eRequest && git add -A && git commit -m "fix: pending-tasks + approve status transition"
   ```

---

## 5. KHÔNG LÀM

- Không sửa eAccount (đã ổn)
- Không sửa eForm BE (đã ổn)
- Không sửa eAi (cần credentials)
- Không deploy
- Không refactor lớn
- Không xóa volume MySQL
- Không thêm test framework mới ngoài Playwright (nếu chưa có)

---

## 6. APPENDIX — Useful commands

### Login admin lấy token
```bash
TOKEN=$(curl -sS -X POST http://localhost:8080/api/internal/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uetflow.com","password":"admin"}' | jq -r '.token')
```

### Check DB
```bash
docker exec uetflow-mysql mysql -uroot -proot eflow -e "SELECT * FROM flow ORDER BY id DESC LIMIT 5;"
docker exec uetflow-mysql mysql -uroot -proot eflow -e "SELECT * FROM map_form;"
docker exec uetflow-mysql mysql -uroot -proot erequest -e "SELECT * FROM ticket;"
docker exec uetflow-mysql mysql -uroot -proot erequest -e "SELECT * FROM ticket_step;"
```

### Rebuild + restart BE service
```bash
cd E:/Duan/backend/<service>
docker run --rm -v $PWD:/app -v $HOME/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -w /app maven:3.9-eclipse-temurin-21 sh -c "./mvnw -ntp -Pprod verify jib:dockerBuild -DskipTests -Djib.to.image=<image>:latest -Denforcer.skip=true"
cd ../
docker compose up -d <service>
sleep 60
docker logs uetflow-<service> --tail 30
```

### Revert BE if fail
```bash
docker tag <image>:backup-v2 <image>:latest
docker compose up -d <service>
```

### Sync admin roles (nếu bị reset)
```bash
TOKEN=...  # admin token
curl -X POST http://localhost:8080/api/permissions/sync \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"admin@uetflow.com","roles":[-1,1,2,3,4,5]}'
```

### Status codes
- Ticket: 0=Nháp, 1=Đang thực hiện, 2=Hoàn thành, 3=Hủy, 4=Từ chối
- Ticket Step: 0=Chờ xử lý, 1=Hoàn thành, 2=Từ chối
- Form: statusForm=2 → Phát hành
- Flow: status "DangHoatDong" → Phát hành

---

## 7. KICKOFF

```bash
cd /e/Duan  # hoặc cd E:/Duan tùy shell

# Phase 0
docker ps --filter "name=uetflow"
curl http://localhost:8080/api/permissions/system-roles
docker tag eflow:latest eflow:backup-v2
docker tag erequest:latest erequest:backup-v2

# Phase 1
docker exec uetflow-mysql mysql -uroot -proot eflow -e "UPDATE flow SET flow_group='default' WHERE flow_group IS NULL;"

# Phase 2-3: code + build (xem hướng dẫn trên)

# Phase 5: playwright test
cd FE/frontend
npx playwright test --headed

# Phase 6: commit, write PROGRESS-V2.md
```

Đi luôn không hỏi. Hết Phase 6 hoặc gặp BLOCKED > 30 phút thì pivot. Tổng thời gian ước tính: **4-6 giờ**.
