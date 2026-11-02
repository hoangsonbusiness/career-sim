# Chuẩn viết Spec (bắt buộc)

## Mục tiêu: "kết quả giống nhau" nghĩa là gì?

Hai agent khác nhau (Claude, Codex, GPT, Gemini…) đọc cùng một spec **sẽ không bao giờ viết ra code giống nhau từng dòng**, và cũng không cần như vậy. Mục tiêu thực tế và kiểm chứng được là:

> **Mọi bản implement đúng spec đều cho cùng một kết quả QUAN SÁT ĐƯỢC với cùng một đầu vào**, và điều này được chứng minh bằng việc cùng chạy đạt một **bộ test tuân thủ (conformance suite)** dùng chung.

Giống chuẩn JVM: Oracle, Eclipse OpenJ9, GraalVM có code hoàn toàn khác nhau, nhưng đều phải chạy đạt bộ TCK. Văn bản đặc tả chỉ nói **cái gì**; TCK mới là thứ **ép** mọi bản implement cho ra cùng kết quả. Spec ở repo này có cấu trúc tương tự: phần văn bản (mục 1–7) + **conformance vectors** (file JSON đầu vào/đầu ra mẫu).

## Nguồn gốc các quy tắc

Quy tắc dưới đây gom từ các thực hành đã được dùng rộng rãi:
- **RFC 2119 / RFC 8174**: từ khóa quy phạm (MUST/SHOULD), ở đây Việt hóa thành PHẢI / KHÔNG ĐƯỢC.
- **Specification by Example / BDD (Given–When–Then)**: tiêu chí chấp nhận viết bằng ví dụ cụ thể.
- **Design by Contract**: tiền điều kiện, hậu điều kiện, bất biến cho mỗi thao tác.
- **Conformance test suite** (kiểu TCK của Java, test262 của JavaScript): bộ vector dùng chung là trọng tài cuối cùng.

## Các quy tắc

| Mã | Quy tắc | Linter tự kiểm? |
|---|---|---|
| ST-01 | Frontmatter đủ: `id, title, status, features, owner, version`. Tên file bắt đầu bằng id. | ✓ |
| ST-02 | Đủ 7 mục theo `_template.md`. | ✓ |
| ST-03 | Mục 3 (thiết kế) dùng từ khóa quy phạm **PHẢI** / **KHÔNG ĐƯỢC** cho mọi hành vi bắt buộc. Câu không có từ khóa được coi là giải thích, không ràng buộc. | ✓ (có ít nhất 1) |
| ST-04 | Mục 3 **cấm từ mơ hồ**: "nên", "có thể", "tùy", "khoảng", "hợp lý", "phù hợp", "v.v.", "...". Mỗi chỗ như vậy là một chỗ hai agent sẽ chọn khác nhau. | ✓ |
| ST-05 | AC đánh số liên tục `AC-NNN-01..`, mỗi AC có đủ Given / When / Then. | ✓ |
| ST-06 | **Then** phải kiểm được bằng máy: giá trị cụ thể, mã lỗi, so sánh. Cấm "hoạt động đúng", "hợp lý". | ✓ (heuristic) |
| ST-07 | **Hợp đồng vào/ra** cho mọi hàm public: kiểu dữ liệu chính xác của tham số và kết quả, kể cả biên (mảng rỗng, số âm, trùng lặp, thiếu key). | Review |
| ST-08 | **Lỗi có mã ổn định** (`code: "INVALID_ANSWER"`), test kiểm tra theo `code`, không theo tên class hay message. Mỗi lỗi nói rõ: khi nào ném, **trạng thái có bị thay đổi không**. | Review |
| ST-09 | **Thứ tự & làm tròn được chốt**: cộng trước rồi chặn, hay chặn từng bước; làm tròn lên/xuống; so sánh mảng có thứ tự hay tập hợp. | Review |
| ST-10 | **Không ngẫu nhiên, không đồng hồ ẩn** trong logic; nếu cần thì inject (seed, clock) qua tham số. | Review |
| ST-11 | Hành vi có trạng thái → mô tả bằng **bảng chuyển trạng thái** (trạng thái × thao tác → trạng thái mới / lỗi), không phải văn xuôi. | Review |
| ST-12 | Spec có logic tính toán **PHẢI** kèm **conformance vectors** (`tests/spec-NNN/vectors.json`) và một AC yêu cầu chạy đạt toàn bộ vector. Vector là trọng tài khi văn bản và code mâu thuẫn. | Review |
| ST-13 | Mục 6 không còn câu hỏi `- [ ]` thì mới được duyệt. | ✓ (`approve` từ chối) |
| ST-14 | Mỗi quyết định thiết kế đã chốt ghi kèm lý do ngắn (vì sao), để agent sau không "cải tiến" ngược lại. | Review |

## Cách kiểm chứng một spec đã đủ chặt chưa (trước khi duyệt)

**Thử nghiệm hai agent:** đưa spec cho 2 agent khác nhau (ví dụ Claude Code và Codex), mỗi bên implement độc lập, sau đó chạy chéo bộ vector và test của bên kia. Chỗ nào hai bản ra kết quả khác nhau là chỗ spec còn hở → bổ sung quy tắc hoặc vector, rồi lặp lại. Spec đã đủ chặt khi hai bản độc lập cùng đạt toàn bộ test.

Không cần làm việc này cho mọi spec; nên làm với spec lõi (engine, chấm điểm, gợi ý nghề).
