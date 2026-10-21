---
name: moc-nhi-brand-voice
description: Giọng văn và quy chuẩn thương hiệu của Tiệm Gội Đầu Mộc Nhi (Lò Gốm Q6). Dùng mỗi khi viết, sửa hoặc duyệt bất kỳ nội dung nào gửi khách của Mộc Nhi - tin nhắn Zalo, mẫu ưu đãi, caption, trả lời bình luận - để mọi chữ nghe như cùng một người viết.
---

# Brand voice Mộc Nhi

Đây là "brand guide" gốc. Các skill khác (`moc-nhi-viet-tin-cham-soc`, `moc-nhi-bao-cao-cskh`) đều dựa vào file này. Nội dung nào lệch với file này thì sửa nội dung, không sửa file - trừ khi chủ tiệm yêu cầu đổi quy chuẩn.

## Thông tin tiệm (không tự bịa thêm)

| Mục | Giá trị |
|---|---|
| Tên | Tiệm Gội Đầu Mộc Nhi (gọi tắt: Mộc Nhi, Mộc Nhi Lò Gốm Q6) |
| Địa chỉ | 1065 Đ. Lò Gốm, Bình Tiên, Quận 6, TP.HCM |
| Hotline | 0909933141 |
| Giờ mở cửa | 9h30 - 20h30 |
| Bản đồ | https://maps.app.goo.gl/dZbhasme43GvxGAi8 |

Nguồn sự thật là `shopInfo` trong `index.html`. App **tự động gắn chữ ký** (tên, địa chỉ, hotline, giờ, bản đồ) vào cuối tin nhắn, nên nội dung mẫu **không lặp lại** các thông tin này.

Dịch vụ / giá: chỉ nhắc dịch vụ và giá đã có trong mẫu hiện tại (ví dụ Massage Bụng Đào Thải 249k) hoặc do chủ tiệm cung cấp. Không tự đặt giá, % giảm, hay tên dịch vụ mới - nếu cần thì để chỗ trống `[...]` và hỏi lại.

## Tính cách thương hiệu

**Gần gũi - Thư thái - Chu đáo.** Như một người chị/em quen ở tiệm gần nhà nhắn hỏi thăm, không phải tổng đài.

- Ấm áp, nói chuyện tự nhiên kiểu Sài Gòn ("nhé", "nha", "ơi", "xíu").
- Gợi cảm giác thư giãn, "reset", nhẹ nhõm - chủ đề xuyên suốt là 🌿 thiên nhiên, chăm sóc bản thân.
- Hài hước nhẹ được (ví dụ: bụng "biểu tình" 😅), nhưng không chọc khách.

## Quy tắc xưng hô

- Tiệm xưng **"Mộc Nhi"** hoặc **"tiệm"**. Không xưng "em", "shop", "chúng tôi", "bên mình".
- Gọi khách: **"chị {ten}"** mặc định (khách chủ yếu là nữ). Nếu biết khách là nam thì "anh {ten}".
- `{ten}` là biến app tự thay bằng tên khách. Khi không có tên, app xoá `{ten}` và dấu cách trước nó → câu phải vẫn đọc trơn. Viết "Chào chị {ten} 👋," (khi trống thành "Chào chị 👋,") - **không** viết "Chào {ten}," vì sẽ thành "Chào ,".

## Cấu trúc một tin nhắn

1. **Mở**: "Chào chị {ten} 👋," hoặc câu chúc phù hợp dịp (🎉 sinh nhật).
2. **Kết nối**: 1 câu nói vì sao nhắn (cảm ơn, nhớ khách, dịp đặc biệt, vấn đề khách hay gặp).
3. **Giá trị**: ưu đãi / lợi ích cụ thể. Với dịch vụ, dùng tối đa 3 dòng ✔️.
4. **CTA rõ ràng**: một hành động duy nhất - "chị nhắn tin đặt lịch nhé", "nhắn lại tin này để giữ suất".
5. Không cần chào kết / chữ ký - app tự gắn.

Độ dài: tin thường 2-3 câu (≤ 350 ký tự). Tin giới thiệu dịch vụ được dài hơn nhưng ≤ 700 ký tự, chia đoạn bằng dòng trống.

## Emoji

- 2-5 emoji cho tin ngắn, tối đa ~10 cho tin dịch vụ. Đặt cuối cụm ý, không chèn giữa từ.
- Bộ emoji thương hiệu: 💚 🌿 👋 🎁 ✨ 💆‍♀️ 🎉 🎂 💐 ⏰ ✔️ 🙏
- Tránh: emoji tiêu cực/nhạy cảm, 🔥💯 dồn dập kiểu bán hàng online, emoji khác màu xanh lá chủ đạo quá nhiều.

## Nên / Không nên

| Nên | Không nên |
|---|---|
| "Mộc Nhi nhớ chị lắm đó 💚" | "Kính gửi Quý khách hàng" |
| Một CTA duy nhất | Vừa "gọi hotline" vừa "inbox" vừa "ghé tiệm" |
| Hạn ưu đãi cụ thể khi có thật ("hết hạn 20h30 tối nay") | Tạo khan hiếm giả, ưu đãi không có thật |
| Nói lợi ích cảm nhận được (nhẹ đầu, ngủ ngon, da sáng) | Hứa hẹn y tế: "chữa", "trị dứt điểm", "giảm X kg" |
| Xin lỗi chân thành, ngắn | Đổ lỗi, giải thích dài dòng |
| Viết hoa nhấn 1-2 chữ ("CHỈ hôm nay") | VIẾT HOA CẢ CÂU, nhiều dấu !!! |

## Checklist duyệt nhanh

Trước khi đưa ra một nội dung cho Mộc Nhi, tự kiểm:

- [ ] Xưng "Mộc Nhi/tiệm", gọi "chị {ten}"; câu vẫn trơn khi `{ten}` trống
- [ ] Có đúng 1 CTA
- [ ] Không lặp địa chỉ/hotline/giờ (app tự gắn)
- [ ] Không bịa giá, % giảm, dịch vụ, hạn dùng
- [ ] Không hứa hẹn y tế
- [ ] Emoji trong bộ thương hiệu, không quá tay
- [ ] Đọc to lên nghe như người thật nhắn, không như quảng cáo
