# Deploy uppush.io lên S3 + CloudFront

Hai giai đoạn:

- **Giai đoạn 1 (bước 1–6):** dựng site mới chạy song song với WordPress. Không đụng tới tên miền thật, làm lúc nào cũng được.
- **Giai đoạn 2 (bước 7–11):** ngày go-live, chuyển DNS. Nên chọn ngày ít traffic, dành khoảng 2–3 giờ và chuẩn bị trước 2 ngày (vì phải chờ DNSSEC).

Sau khi xong, mỗi lần push lên `main` GitHub Actions sẽ tự build, kiểm tra và deploy trong khoảng 3 phút.

```
GitHub (main) ─► Actions: check → build → kiểm tra redirect/link/SEO ─► S3 (private) ─► CloudFront ─► uppush.io
                                    OIDC, không lưu AWS key                       www.uppush.io ─301─┘
```

## Thông số đã chốt

| Hạng mục | Giá trị |
|---|---|
| Tài khoản AWS | `510970356951` |
| Region của stack | `us-west-1` |
| Stack | `uppush-branding` |
| Chứng chỉ ACM (us-east-1), chứa `uppush.io` và `www.uppush.io` | `arn:aws:acm:us-east-1:510970356951:certificate/03da89c0-0ef0-4f05-9ba1-1340d2d2efb9` ✅ ISSUED |
| GitHub OIDC provider (đã có sẵn) | `arn:aws:iam::510970356951:oidc-provider/token.actions.githubusercontent.com` |
| S3 bucket | `uppush-branding` |
| IAM role cho GitHub | `uppush-branding-github-deploy` |
| Tiền tố tên (OAC, Function, Headers policy, tag) | `uppush-branding` |
| `www.uppush.io` | Có, tự redirect 301 một bước về `https://uppush.io/…` |

**Cần có:** AWS CLI đăng nhập đúng tài khoản trên (`aws sts get-caller-identity`), tài khoản GitHub, quyền sửa Google Cloud DNS (zone `uppush.io`) và quyền vào nơi mua tên miền (registrar hiện là Key-Systems, có thể bạn mua qua một đại lý).

Các chỗ có dấu `<…>` là giá trị bạn tự điền.

---

## Giai đoạn 1: Dựng site mới (không ảnh hưởng site đang chạy)

### Bước 1: Đưa code lên GitHub

Tạo một repo **private, để trống** trên github.com, tên `uppush-branding`. Sau đó chạy:

```bash
cd ~/code/uppush-workspace/uppush-branding
git init -b main
git add -A
git commit -m "Uppush website (Astro)"
git remote add origin git@github.com:<owner>/uppush-branding.git
git push -u origin main
```

Workflow **Build and deploy** sẽ tự chạy. Job *build* phải xanh. Job *deploy* sẽ báo lỗi cho tới khi xong bước 5, như vậy là bình thường.

> Nếu đặt tên repo khác `uppush-branding`, thêm `GitHubRepo=<tên repo>` vào lệnh ở bước 4.

### Bước 2: Chứng chỉ SSL ✅ đã xong

Chứng chỉ gộp `03da89c0…` đã được cấp, chứa cả `uppush.io` và `www.uppush.io`. Một CloudFront distribution chỉ gắn được một chứng chỉ, nên chứng chỉ đó phải chứa mọi tên miền mà distribution phục vụ.

Hai bản ghi CNAME xác thực (`_ce83ea…uppush.io` và `_ee71ac…www.uppush.io`) đang nằm trong Google Cloud DNS. **Giữ chúng vĩnh viễn**, vì chứng chỉ tự gia hạn nhờ chúng. Ở bước 8 chúng sẽ được chép sang Route 53 cùng các bản ghi khác.

### Bước 3: GitHub OIDC provider ✅ đã có sẵn

Tài khoản đã có provider (dùng chung với ezorder). ARN đã được điền vào lệnh ở bước 4.

### Bước 4: Tạo hạ tầng bằng 1 lệnh (CloudFormation)

Lệnh này tạo: S3 bucket private, CloudFront (gồm function xử lý 301/410 cho URL WordPress cũ, redirect `www`, security header) và IAM role để GitHub deploy. Chỉ cần thay `<owner>`:

```bash
cd ~/code/uppush-workspace/uppush-branding

aws cloudformation deploy --region us-west-1 --stack-name uppush-branding \
  --template-file infra/cloudformation-website-hosting.yml --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    AcmCertificateArn=arn:aws:acm:us-east-1:510970356951:certificate/03da89c0-0ef0-4f05-9ba1-1340d2d2efb9 \
    GitHubOwner=<owner> \
    ExistingGitHubOidcProviderArn=arn:aws:iam::510970356951:oidc-provider/token.actions.githubusercontent.com \
    NamePrefix=uppush-branding \
    BucketName=uppush-branding \
    DeployRoleName=uppush-branding-github-deploy \
    "DistributionComment=uppush.io - branding astro website"

aws cloudformation describe-stacks --region us-west-1 --stack-name uppush-branding \
  --query 'Stacks[0].Outputs' --output table
```

Việc tạo CloudFront mất khoảng 5–15 phút. Ghi lại 4 output: `BucketName`, `DistributionId`, `DistributionDomainName` (dạng `dxxxx.cloudfront.net`) và `DeployRoleArn`.

**Nếu lệnh báo lỗi:** xem lý do bằng

```bash
aws cloudformation describe-stack-events --region us-west-1 --stack-name uppush-branding \
  --query 'StackEvents[?contains(ResourceStatus,`FAILED`)].[LogicalResourceId,ResourceStatusReason]' --output text
```

Một stack tạo lỗi sẽ ở trạng thái `ROLLBACK_COMPLETE` và bucket (rỗng) được giữ lại. Trước khi chạy lại phải dọn cả hai:

```bash
aws cloudformation delete-stack --region us-west-1 --stack-name uppush-branding
aws cloudformation wait stack-delete-complete --region us-west-1 --stack-name uppush-branding
aws s3 rb s3://uppush-branding
```

<details>
<summary>Các tham số đặt tên (đã dùng trong lệnh trên)</summary>

| Tham số | Áp dụng cho | Mặc định khi để trống |
|---|---|---|
| `NamePrefix` | Tên OAC, CloudFront Function, Response headers policy và tag `Name`/`Project` | Tên stack |
| `BucketName` | S3 bucket: duy nhất toàn AWS, chữ thường, số, `-`, không dấu chấm | AWS tự sinh |
| `DeployRoleName` | IAM role cho GitHub Actions (cần `CAPABILITY_NAMED_IAM`) | AWS tự sinh |
| `DistributionComment` | Mô tả distribution trong console CloudFront | `uppush.io marketing site` |
| `IncludeWww` | Phục vụ và redirect `www.uppush.io` | `true` |

Đổi tên bucket hoặc role sau khi tạo sẽ khiến AWS tạo tài nguyên mới thay thế (bucket cũ được giữ lại). Khi cập nhật stack, luôn dùng lại đúng các tham số này.
</details>

### Bước 5: Khai báo cho GitHub Actions

Vào repo trên GitHub → **Settings → Environments → New environment**, đặt tên `production`:

1. **Deployment branches and tags** → *Selected branches* → thêm `main`.
2. **Environment variables** → thêm 4 biến:

| Tên | Giá trị |
|---|---|
| `AWS_REGION` | `us-west-1` |
| `AWS_DEPLOY_ROLE_ARN` | output `DeployRoleArn` (dạng `arn:aws:iam::510970356951:role/uppush-branding-github-deploy`) |
| `S3_BUCKET` | `uppush-branding` |
| `CLOUDFRONT_DISTRIBUTION_ID` | output `DistributionId` |

Sau đó vào **Actions → Build and deploy → Run workflow** (nhánh `main`). Cả 2 job phải xanh.

### Bước 6: Kiểm tra trên domain CloudFront

Mở `https://<DistributionDomainName>/`. Sau đó chạy lệnh kiểm tra toàn bộ URL cũ trên môi trường thật:

```bash
BASE_URL=https://<DistributionDomainName> npm run check:redirects
```

Kết quả phải là `225/225 OK`. Các trường hợp `www` được kiểm tra ở máy local; trên production sẽ kiểm tra ở bước 10.

Kiểm tra thêm bằng tay:
- `/pricing` tự chuyển sang `/pricing/`;
- một URL không tồn tại trả về trang 404;
- ô tìm kiếm của blog có kết quả;
- banner cookie hiện ra;
- `curl -I` thấy header `strict-transport-security`.

---

## Giai đoạn 2: Go-live (chuyển DNS sang Route 53)

**Vì sao phải chuyển:** tên miền gốc `uppush.io` chỉ trỏ được tới CloudFront bằng bản ghi ALIAS. Google Cloud DNS không có loại bản ghi này, Route 53 thì có. Tên miền vẫn đăng ký ở chỗ cũ; bạn chỉ đổi nameserver.

### Bước 7: Tắt DNSSEC (làm trước ngày go-live ít nhất 2 ngày, bắt buộc)

uppush.io **đang bật DNSSEC**. Nếu đổi nameserver khi DNSSEC còn bật, toàn bộ tên miền sẽ ngừng phân giải: website, **app.uppush.io (app Shopify)** và **email công ty**.

1. Tại nơi mua tên miền: **xoá DS record / tắt DNSSEC**.
2. Chờ khoảng 48 giờ, rồi kiểm tra bằng lệnh `dig +short DS uppush.io`. Lệnh phải **không in ra gì** mới được làm tiếp.
3. Sau đó mới tắt DNSSEC trong Google Cloud DNS (zone → DNSSEC → Off).

Trong cùng thời gian đó, hạ TTL của các bản ghi trong Google Cloud DNS xuống 300 giây để lúc chuyển được nhanh.

### Bước 8: Sao chép zone sang Route 53

```bash
# Xuất toàn bộ bản ghi hiện có (MX, SPF, DMARC, app, docs, doc, dev.app, ACM…)
gcloud dns managed-zones list                       # lấy <ZONE_NAME> của uppush.io
gcloud dns record-sets export uppush-io.zone --zone=<ZONE_NAME> --zone-file-format
```

Vào **AWS Console → Route 53 → Hosted zones → Create hosted zone** `uppush.io` → **Import zone file**, dán nội dung file `uppush-io.zone`. Route 53 tự bỏ qua bản ghi SOA và NS.

Đối chiếu để chắc chắn không thiếu bản ghi nào. Tối thiểu phải có:
- `app` (CNAME tới ELB của app);
- `dev.app`;
- `docs` (CloudFront);
- `doc` (GitBook);
- 5 bản ghi **MX** của Google Workspace;
- TXT SPF `v=spf1 include:_spf.google.com ~all`;
- `_dmarc`;
- 2 CNAME xác thực ACM (`_ce83ea…` và `_ee71ac…`);
- mọi bản ghi `google._domainkey` và `google-site-verification` nếu có.

Sau đó **sửa riêng cho website**:

| Bản ghi | Thao tác |
|---|---|
| `uppush.io` loại **A** (hiện là `18.208.45.238`, server WordPress) | Xoá. **Ghi lại IP này để rollback.** |
| `uppush.io` loại **A** và **AAAA** | Tạo mới, bật *Alias* → CloudFront distribution `uppush-branding` |
| `www.uppush.io` loại **A** và **AAAA** | Tạo mới, bật *Alias* → cùng distribution. Function sẽ trả 301 về `https://uppush.io/…` |

> Không thêm bản ghi `www` vào Google Cloud DNS trước ngày go-live. Lúc đó `uppush.io` vẫn là WordPress, nên một số đích redirect mới (như `/rss.xml`) chưa tồn tại bên đó.

### Bước 9: Lần export nội dung cuối và đổi nameserver

1. Đóng băng WordPress (không đăng bài mới). Lấy nội dung lần cuối rồi push:
   ```bash
   npm run wp:export && npm run content:fix
   git add -A && git commit -m "Final WordPress export" && git push
   ```
2. Tại nơi mua tên miền: đổi **nameserver** sang 4 nameserver Route 53 của zone mới (xem ở bản ghi NS trong hosted zone).

Việc lan truyền thường mất từ vài phút tới vài giờ. Trong thời gian này một số người dùng vẫn vào site WordPress cũ. Điều đó không sao, vì cả hai zone có cùng các bản ghi còn lại.

### Bước 10: Kiểm tra sau khi chuyển

```bash
dig +short NS uppush.io                                   # đã là awsdns-…
BASE_URL=https://uppush.io npm run check:redirects        # 225/225 OK
curl -sI https://www.uppush.io/pricing | grep -iE '^(HTTP|location)'
# HTTP/2 301
# location: https://uppush.io/pricing/
```

- `https://uppush.io/` hoạt động; `https://www.uppush.io/...` chuyển 301 về đúng trang trên `uppush.io`.
- **Mở app Uppush trong Shopify admin** (`app.uppush.io`) xem chạy bình thường.
- **Gửi thử một email tới @uppush.io** xem có nhận được không (kiểm tra MX).
- `docs.uppush.io` và `doc.uppush.io` mở được.
- Google Search Console: thêm **Domain property** `uppush.io` (xác minh bằng TXT trên Route 53), rồi gửi `https://uppush.io/sitemap-index.xml`.

### Bước 11: Rollback nếu có sự cố

Trong Route 53:
- Sửa bản ghi của `uppush.io` từ Alias về **A `18.208.45.238`**.
- Xoá bản ghi `www`.

Site cũ sẽ quay lại trong vài phút (TTL 300). Hãy giữ server WordPress chạy ít nhất 30 ngày.

---

## Vận hành hằng ngày

- **Cập nhật nội dung:** sửa trong Pages CMS hoặc push lên `main`. Site cập nhật sau khoảng 3 phút.
- **Quay về bản trước:** revert commit trên `main`, hoặc chạy lại job deploy của một lần chạy thành công trước đó.
- **Đổi luật redirect** (`docs/url-inventory.csv`) hoặc security header: chạy `npm run redirects`, commit, rồi chạy lại lệnh ở bước 4 với đúng các tham số như trên để cập nhật stack. CloudFront function nằm trong template nên GitHub Actions không tự cập nhật nó.
- **Chi phí ước tính:** khoảng 1–5 USD/tháng (S3 + CloudFront + Route 53 hosted zone 0,5 USD).

## Việc nên xong trước ngày go-live

- [ ] Duyệt **Terms and conditions** (đang là bản nháp, `noindex`).
- [ ] Chọn cách gửi **form liên hệ** (hiện là `mailto`).
- [ ] Điền **số liệu doanh thu thật** nếu muốn hiện chart (hiện đang ẩn).
- [ ] Bổ sung mục **Cookies** vào Privacy Policy.
