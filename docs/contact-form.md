# Form liên hệ: lưu email + chống spam

```
Trình duyệt ──POST /api/contact──▶ CloudFront ──▶ Lambda (Function URL)
                                                   ├─ kiểm tra Cloudflare Turnstile
                                                   ├─ lưu vào DynamoDB  uppush-branding-contact-submissions
                                                   └─ gửi email báo qua SNS (tuỳ chọn)
```

- Cùng domain với site (`/api/*` là một behavior của CloudFront), nên không cần CORS và CSP vẫn giữ `'self'`.
- Toàn bộ nằm trong `infra/cloudformation-website-hosting.yml` (các resource `Contact*`), không cần server riêng hay dịch vụ form bên ngoài.
- Chi phí gần như 0: DynamoDB on-demand, Lambda và SNS email đều nằm trong free tier với lượng form của một site marketing.

## Lớp chống spam

| Lớp | Tác dụng |
| --- | --- |
| Cloudflare Turnstile | Captcha "vô hình" (đa số người dùng không phải click). Lambda gọi `siteverify` bằng secret key; token sai, hết hạn hoặc đã dùng thì bị từ chối và **không lưu**. |
| Honeypot `botcheck` | Ô ẩn mà bot hay điền vào. Nếu có giá trị, Lambda trả "thành công" giả và không lưu. |
| Validate phía server | Bắt buộc email hợp lệ, tên và nội dung. Message tối đa 2000 ký tự, body tối đa 20KB. `topic` chỉ nhận các giá trị trong danh sách. |

## Dữ liệu được lưu

Mỗi lần gửi tạo 1 item trong DynamoDB với các trường:

- `id`, `createdAt`;
- `email` (chữ thường), `name`, `topic`, `store`, `message`;
- `subscribe`: `true` khi người dùng tự tick "Send me occasional product updates…". Ô này mặc định bỏ trống để hợp lệ với GDPR. Chỉ những email có `subscribe = true` mới được dùng cho marketing;
- `page`: trang mà form được gửi từ đó;
- `expiresAt`: DynamoDB tự xoá item sau `ContactRetentionDays` ngày (mặc định 730).

Point-in-time recovery đang bật, và bảng có `DeletionPolicy: Retain` nên xoá stack cũng không mất dữ liệu.

## Thiết lập (một lần)

### 1. Lấy Turnstile secret key

1. Mở Cloudflare dashboard → **Turnstile** → widget có site key `0x4AAAAAAD3kOzAab8rMeLS9`. Đây là widget form WordPress cũ đang dùng.
2. **Settings → Hostname management**: thêm `uppush.io` và domain CloudFront (`dxxxx.cloudfront.net`) để test trước khi go-live. Có thể thêm `localhost` nếu muốn.
3. Copy **Secret key**.

> Muốn tách hẳn khỏi WordPress thì tạo widget mới (mode **Managed**), rồi thay site key trong `src/data/contact-form.ts`.

### 2. Cập nhật stack

`aws cloudformation deploy` giữ nguyên các tham số cũ của stack, nên chỉ cần truyền tham số mới. Nhập secret bằng `read -s` để nó không nằm trong shell history:

```bash
read -rs TURNSTILE_SECRET   # dán secret rồi Enter

aws cloudformation deploy --region us-west-1 --stack-name uppush-branding \
  --template-file infra/cloudformation-website-hosting.yml --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    TurnstileSecretKey="$TURNSTILE_SECRET" \
    ContactNotifyEmail=support@uppush.io

unset TURNSTILE_SECRET
```

- Lần cập nhật này có thay đổi CloudFront (thêm origin và behavior `/api/*`), nên mất khoảng 5–10 phút.
- `ContactNotifyEmail` có thể để trống nếu chỉ muốn lưu mà không nhận email.

### 3. Xác nhận email SNS

AWS gửi email "AWS Notification - Subscription Confirmation" tới `ContactNotifyEmail`. Bấm **Confirm subscription**; trước khi xác nhận sẽ không nhận được thông báo.

### 4. Deploy code site

Push lên `main` như bình thường. Form hiện đã ở chế độ `endpoint` (`src/data/contact-form.ts`).

### 5. Kiểm tra

```bash
# Không có token captcha → phải bị từ chối (JSON 400, error: captcha), không lưu gì
curl -s https://dxxxx.cloudfront.net/api/contact -H 'accept: application/json' \
  -d 'name=Test&email=test@example.com&message=hi'
```

Sau đó gửi thử form thật trên `https://dxxxx.cloudfront.net/contact/`. Kết quả mong đợi:

- trình duyệt chuyển sang `/contact/thanks/`;
- có email báo;
- `npm run contacts:export` ra 1 dòng.

## Xem và xuất danh sách email

```bash
npm run contacts:export                   # tất cả → exports/contacts-YYYY-MM-DD.csv
npm run contacts:export -- --subscribed   # chỉ người đồng ý nhận tin (để import vào công cụ email)
```

- Script dùng AWS CLI với credential hiện tại (chỉ đọc).
- `exports/` đã được gitignore: file chứa dữ liệu cá nhân, không commit.
- Có thể xem nhanh trên AWS Console: DynamoDB → Tables → `uppush-branding-contact-submissions` → **Explore items**.

## Khi có sự cố

- **Log Lambda:** CloudWatch → Log groups → `/aws/lambda/uppush-branding-contact` (giữ 90 ngày).
- **Người dùng báo "couldn't verify you're human":**
  - hostname chưa được thêm vào widget Turnstile; hoặc
  - secret key sai hoặc chưa truyền: `TurnstileSecretKey` trống thì **mọi** submission bị từ chối.
- **Đổi secret:** chạy lại lệnh ở bước 2 với secret mới.
- **Lưu ý khi sửa Lambda** (code inline trong template, giới hạn 4096 ký tự): không trả status 403/404. CloudFront đổi hai mã này thành trang `/404.html` (CustomErrorResponses).
- **Yêu cầu xoá dữ liệu (GDPR):** tìm item theo email trong DynamoDB console và xoá.

## Việc còn lại về pháp lý

Privacy Policy nên có thêm một đoạn ngắn về form liên hệ:

- thu thập tên, email, store, nội dung để trả lời yêu cầu;
- dùng Cloudflare Turnstile để chống spam;
- lưu tối đa 2 năm;
- chỉ gửi tin marketing khi người dùng tự tick đồng ý.
