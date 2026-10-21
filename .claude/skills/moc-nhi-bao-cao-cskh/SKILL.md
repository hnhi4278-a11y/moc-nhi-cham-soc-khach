---
name: moc-nhi-bao-cao-cskh
description: Tổng hợp và phân tích lịch sử chăm sóc khách qua Zalo của Mộc Nhi thành báo cáo (số tin đã gửi, mẫu nào dùng nhiều, khách nào lâu chưa chăm sóc, tỷ lệ phản hồi/quay lại nếu có dữ liệu) kèm insight và đề xuất. Dùng khi được hỏi về hiệu quả chăm sóc khách, báo cáo tuần/tháng, hoặc mẫu tin nào hiệu quả.
---

# Báo cáo chăm sóc khách Mộc Nhi

## Nguồn dữ liệu

App lưu lịch sử gửi ở backend dùng chung:

```bash
curl -s https://moc-nhi-ops.moc-nhi-logom-q6.workers.dev/state
```

Các trường liên quan trong JSON trả về:

- `careMessages[]` - lịch sử gửi (backend giữ tối đa **100 tin gần nhất**): `phone`, `customerName` ("Khách lẻ" nếu không nhập tên), `templateTitle`, `message`, `image`, `createdAt` (ISO, giờ UTC → đổi sang giờ VN +7 khi chia theo ngày/giờ).
- `careTemplates[]` - các mẫu hiện có: `id`, `title`, `content`, `image`.

Chỉ **đọc** - không bao giờ POST lên `/state` khi làm báo cáo (POST ghi đè dữ liệu thật của tiệm).

Nếu không truy cập được mạng, xin người dùng dán JSON hoặc file xuất từ app.

**Giới hạn cần nói rõ trong báo cáo:**
- App chỉ biết "đã mở Zalo cho khách", không biết tin có thực sự được gửi, khách có đọc/trả lời hay quay lại không.
- Chỉ có 100 tin gần nhất → kỳ báo cáo dài hơn thì số liệu bị thiếu.
- Muốn đo **tỷ lệ phản hồi / quay lại**, cần người dùng cung cấp thêm danh sách khách đã trả lời hoặc đã ghé (từ sổ lịch hẹn, app vận hành). Khi có, ghép theo số điện thoại (chuẩn hoá: bỏ ký tự không phải số, `0xxx` ↔ `84xxx`).

## Các chỉ số

| Chỉ số | Cách tính |
|---|---|
| Tổng tin trong kỳ | Đếm `careMessages` có `createdAt` trong kỳ |
| Số khách khác nhau | Đếm `phone` đã chuẩn hoá, không trùng |
| Trung bình/ngày, ngày cao nhất | Gom theo ngày giờ VN |
| Khung giờ gửi | Gom theo giờ VN (tham chiếu giờ mở cửa 9h30-20h30) |
| Mẫu dùng nhiều nhất | Đếm theo `templateTitle` |
| Tin bị sửa tay | So `message` với `content` mẫu (sau khi thay tên); sửa nhiều → mẫu chưa sát thực tế |
| Khách nhận nhiều tin | `phone` xuất hiện ≥ 3 lần trong 30 ngày → nguy cơ làm phiền |
| Khách "Khách lẻ" | Tỷ lệ tin không có tên → nhắc nhân viên nhập tên để tin cá nhân hoá hơn |
| Tỷ lệ phản hồi / quay lại | Chỉ khi có dữ liệu bổ sung, theo từng mẫu |

## Cấu trúc báo cáo

1. **Tổng quan** (3-4 con số chính, so với kỳ trước nếu có dữ liệu).
2. **Theo mẫu tin** - bảng: mẫu, số lần gửi, % sửa tay, (tỷ lệ phản hồi nếu có).
3. **Theo thời gian** - ngày/khung giờ gửi nhiều.
4. **3 insight quan trọng** - mỗi cái là một câu có số liệu chứng minh.
5. **Đề xuất hành động** - cụ thể, làm được ngay (ví dụ: "Viết lại mẫu Nhắc lịch - 70% bị sửa tay", "Gửi lại cho 12 khách chưa nhận tin nào 30 ngày qua"). Đề xuất về nội dung tin thì làm theo `moc-nhi-viet-tin-cham-soc`.
6. **Giới hạn dữ liệu** - ghi ngắn những gì chưa đo được.

Viết báo cáo bằng tiếng Việt, gọn, dễ gửi cho chủ tiệm qua Zalo. Nếu người dùng muốn bản đẹp để chia sẻ, dựng trang HTML/dashboard theo màu thương hiệu (xanh lá 💚 chủ đạo).

## Quyền riêng tư

Số điện thoại là dữ liệu khách hàng: trong báo cáo gửi đi, che bớt (`0909***141`), không dán toàn bộ danh sách số lên dịch vụ bên ngoài.
