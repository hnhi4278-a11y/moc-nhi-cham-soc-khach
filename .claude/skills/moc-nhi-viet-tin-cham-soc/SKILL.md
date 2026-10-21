---
name: moc-nhi-viet-tin-cham-soc
description: Viết mẫu tin nhắn chăm sóc khách qua Zalo cho Mộc Nhi theo từng tình huống (khách mới, hỏi thăm sau dịch vụ, nhắc quay lại, sinh nhật, tri ân, xin lỗi, giới thiệu dịch vụ, khuyến mãi theo mùa/lễ). Dùng khi được nhờ soạn mẫu ưu đãi mới, viết lại mẫu cũ, hoặc thêm mẫu vào app.
---

# Viết tin chăm sóc khách Mộc Nhi

**Bắt buộc đọc trước**: `.claude/skills/moc-nhi-brand-voice/SKILL.md`. Mọi tin viết ra phải qua checklist ở cuối file đó.

## Quy trình

1. **Xác định tình huống** (bảng dưới). Nếu người dùng chưa nói rõ, hỏi: nhắn cho ai, nhằm mục đích gì, có ưu đãi gì cụ thể (giá/%/hạn).
2. **Viết 2-3 phương án** khác nhau về góc tiếp cận (ấm áp / vui nhộn / ngắn gọn), mỗi phương án kèm tên mẫu.
3. **Tự duyệt** bằng checklist brand voice, sửa trước khi đưa ra.
4. **Đề xuất ảnh kèm** nếu là tin dịch vụ/khuyến mãi (mô tả ảnh cần chụp hoặc thiết kế).
5. Nếu người dùng muốn **đưa vào app**: xem phần "Thêm vào app" bên dưới.

## Các tình huống

| Tình huống | Thời điểm gửi | Mục tiêu | Gợi ý nội dung |
|---|---|---|---|
| 🎉 Chào mừng khách mới | Tối cùng ngày lần đầu ghé | Ghi nhớ tiệm, hẹn lần sau | Cảm ơn lần đầu, nhắc đặt lịch trước, hé lộ ưu đãi quay lại |
| 💆‍♀️ Hỏi thăm sau dịch vụ | 1-2 ngày sau | Lấy phản hồi, tạo thiện cảm | Hỏi tóc/da đầu/cơ thể thấy sao, mời góp ý. **Không** kèm bán hàng |
| 💌 Nhắc quay lại | 3-4 tuần không ghé | Kéo khách về | "Mộc Nhi nhớ chị", nhắc cảm giác thư giãn, ưu đãi có hạn |
| 🎂 Sinh nhật | Đầu tháng hoặc đúng ngày | Tạo cảm xúc | Chúc mừng trước, ưu đãi trong tháng sinh nhật |
| 💚 Tri ân khách thân thiết | Khách ghé ≥ 5 lần / dịp đặc biệt | Giữ khách tốt | Cảm ơn sự đồng hành, ưu đãi riêng, có thể có hạn ngắn |
| 🙏 Xin lỗi | Ngay khi biết khách không hài lòng | Cứu vãn | Xin lỗi chân thành, không biện minh, mời quay lại kèm bù đắp |
| 🌿 Giới thiệu dịch vụ | Khi có dịch vụ mới/đẩy dịch vụ | Bán dịch vụ | Hook "nỗi đau" quen thuộc → giải pháp → 3 lợi ích ✔️ → giá → CTA |
| 🏮 Mùa / lễ | Trước lễ 3-7 ngày (Tết, 8/3, 20/10, Trung thu, mùa hè, mùa mưa) | Tạo lý do ghé | Gắn dịp với nhu cầu thật (Tết: gội đầu đón năm mới; mùa hè: da đầu bết, nóng) |

## Công thức giới thiệu dịch vụ (Hook → Vấn đề → Giải pháp → Lợi ích → Giá → CTA)

Tham khảo mẫu "Massage Bụng Đào Thải" có sẵn trong app - đây là mẫu chuẩn:

```
Chào chị {ten} 👋! [Hook: thói quen quen thuộc của khách] — [câu hỏi vui về hậu quả] 😅 [Dấu hiệu cụ thể khách nhận ra mình]!

✨ Mộc Nhi có giải pháp nhẹ nhàng mà cực đã: [Tên dịch vụ] 🌿
✔️ [Lợi ích 1 - cảm nhận được]
✔️ [Lợi ích 2]
✔️ [Lợi ích 3]

[Câu chốt cảm xúc] 💚 Chỉ [giá], chị nhắn tin đặt lịch ngay nhé!
```

## Ví dụ: Hỏi thăm sau dịch vụ

> Chào chị {ten} 👋, hôm qua chị gội đầu ở Mộc Nhi về có ngủ ngon không nè? 🌿 Da đầu với tóc chị thấy sao, chị nhắn Mộc Nhi biết với nhé, góp ý nào tiệm cũng quý lắm 💚.

## Định dạng trả về

Mỗi phương án trả về theo dạng:

```
**Tên mẫu:** 💆‍♀️ Hỏi thăm sau gội
**Gửi khi:** 1-2 ngày sau khi khách ghé
**Nội dung:**
<nội dung, dùng {ten}>
**Ảnh kèm:** (không) / <mô tả ảnh>
```

## Thêm vào app

Mẫu được lưu trên cloud và localStorage - sửa `defaultTemplates` chỉ ảnh hưởng máy chưa có dữ liệu. Vì vậy:

- **Cách khuyến nghị**: hướng dẫn người dùng vào mục "📝 Quản lý mẫu ưu đãi" trong app, dán Tên mẫu và Nội dung rồi bấm "💾 Lưu mẫu" (đồng bộ mọi máy).
- Chỉ sửa `defaultTemplates` trong `index.html` khi người dùng muốn đổi bộ mẫu mặc định. Khi đó: `id` dạng slug không dấu (`hoi-tham`), `title` bắt đầu bằng emoji, xuống dòng dùng `\n`, nháy kép escape `\"`, ảnh (nếu có) đặt trong `images/` và khai báo `image: "images/<file>.jpg"`.
