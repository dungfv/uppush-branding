# Deploy uppush.io lên S3 + CloudFront

Hai giai đoạn:

- **Giai đoạn 1 (bước 1–6):** dựng site mới chạy song song với WordPress. Không đụng tới tên miền thật, làm lúc nào cũng được.
- **Giai đoạn 2 (bước 7–10):** ngày go-live, sửa 3 bản ghi DNS trên Squarespace. Mất khoảng 30 phút.

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

**Cần có:** AWS CLI đăng nhập đúng tài khoản trên (`aws sts get-caller-identity`), tài khoản GitHub, quyền sửa DNS của uppush.io trên Squarespace và quyền vào nơi mua tên miền (registrar hiện là Key-Systems, có thể bạn mua qua một đại lý).

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

Hai bản ghi CNAME xác thực (`_ce83ea…uppush.io` và `_ee71ac…www.uppush.io`) đang nằm trong DNS trên Squarespace. **Giữ chúng vĩnh viễn**, vì chứng chỉ tự gia hạn nhờ chúng. Không được xoá chúng khi sửa DNS ở bước 8.

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

## Giai đoạn 2: Go-live (trỏ uppush.io vào CloudFront)

DNS của uppush.io do **Squarespace** quản lý (trước đây là Google Domains, nên nameserver có dạng `ns-cloud-e*.googledomains.com`). Squarespace hỗ trợ bản ghi **ALIAS**, nên chỉ cần tắt DNSSEC rồi sửa 3 bản ghi. Không phải chuyển DNS, và các bản ghi khác (email, app, docs) giữ nguyên.

> **Vì sao không dùng CNAME cho `uppush.io`?** Theo chuẩn DNS, tên miền gốc (apex) luôn phải có bản ghi SOA và NS, và ở đây còn có MX, TXT. Một CNAME không được phép đứng chung với bất kỳ bản ghi nào khác, nên CNAME ở gốc là không hợp lệ: nếu nhà cung cấp cho phép, email và cả zone sẽ hỏng. ALIAS giải quyết việc này: Squarespace tự tra địa chỉ IP của `d39wzklvb2vi03.cloudfront.net` rồi trả về dưới dạng bản ghi A. Với `www` thì CNAME bình thường là được, vì đó không phải tên miền gốc.

### Bước 7: Trước khi chuyển

1. Đóng băng WordPress (không đăng bài mới). Lấy nội dung lần cuối rồi push để deploy:
   ```bash
   npm run wp:export && npm run content:fix
   git add -A && git commit -m "Final WordPress export" && git push
   ```
2. Chờ GitHub Actions deploy xong, rồi kiểm tra lại: `BASE_URL=https://d39wzklvb2vi03.cloudfront.net npm run check:redirects` phải ra **225/225 OK**.
3. Ghi lại bản ghi hiện tại của `uppush.io`: **A `18.208.45.238`** (server WordPress). Cần dùng khi rollback.

### Bước 8a: Tắt DNSSEC an toàn (bắt buộc: Squarespace không cho tạo ALIAS khi DNSSEC đang bật)

**Nguyên tắc:** việc ngừng ký zone chỉ gây lỗi khi máy chủ `.io` **còn bản ghi DS**. Nếu không có DS, các resolver không xác thực zone, nên ký hay không ký đều không ảnh hưởng gì.

> **Sự cố ngày 03/10/2026:** bấm tắt DNSSEC khi `.io` còn DS key tag 30781. Squarespace lại chuyển sang ký bằng khoá mới (KSK 33), nên chuỗi khoá bị lệch và toàn bộ tên miền, kể cả `app.uppush.io`, trả SERVFAIL. Khắc phục bằng cách bật lại DNSSEC. Sau đó DS cũ bị gỡ và Squarespace chưa đăng DS mới, nên tên miền chạy lại.

Các bước:

1. **Kiểm tra `.io` không có DS** ngay trước khi tắt:
   ```bash
   for s in a0.nic.io b0.nic.io c0.nic.io; do dig +norec @$s DS uppush.io +noall +answer; done   # phải không in ra gì
   ```
   - Không in ra gì: làm bước 2 **ngay**.
   - Có in ra một bản ghi DS: **không tắt**. Nhờ hỗ trợ Squarespace gỡ DS ở registry trước, chờ DS biến mất cộng thêm 1 giờ (TTL), rồi mới tắt.
2. Squarespace → `uppush.io` → **DNS** → **Manage DNSSEC** → **Off**.
3. Theo dõi trong 15–30 phút. Bản ghi DS ở `.io` phải vẫn không có, và các resolver phải trả `NOERROR`:
   ```bash
   for r in 1.1.1.1 8.8.8.8 9.9.9.9; do echo "$r → $(dig @$r app.uppush.io A +time=3 +tries=1 | grep -oE 'status: [A-Z]+')"; done
   ```

### Bước 8b: Chuyển `uppush.io` sang ALIAS, không gián đoạn

Điều kiện trước khi làm:
- Mọi resolver lớn đã phân giải bình thường (không còn SERVFAIL):
  ```bash
  for r in 1.1.1.1 8.8.8.8 9.9.9.9 208.67.222.222; do for h in uppush.io app.uppush.io; do
    echo "$r $h → $(dig @$r $h A +time=3 +tries=1 | grep -oE 'status: [A-Z]+')"; done; done
  ```
- Trang DNSSEC trên Squarespace đang ở trạng thái **Off**. Không bật hay tắt lại.
- Bản ghi `A @` đang có TTL 300 (đã đúng).

Thứ tự thao tác (Squarespace → `uppush.io` → **DNS** → **Custom records**):

1. **Sửa trực tiếp** bản ghi `@` loại A thành loại **ALIAS**, Data `d39wzklvb2vi03.cloudfront.net`, TTL 300. Sửa tại chỗ là một thao tác duy nhất, nên không có lúc nào tên miền bị thiếu bản ghi.
   - Nếu Squarespace bắt phải xoá rồi mới thêm: chuẩn bị sẵn, xoá A rồi thêm ALIAS ngay trong vài giây. Resolver nào hỏi đúng lúc đó sẽ nhớ câu trả lời "không có bản ghi" tối đa 5 phút (theo SOA).
2. Ngay sau đó, thêm `www` loại **CNAME** → `d39wzklvb2vi03.cloudfront.net`.
3. **Không đụng** tới các bản ghi khác: MX, SPF, `_dmarc`, `app`, `dev.app`, `docs`, `doc`, 2 CNAME xác thực ACM.

**Vì sao không bị gián đoạn:** trong khoảng 5 phút lan truyền (TTL 300), mỗi người dùng sẽ được trả về hoặc site WordPress cũ, hoặc site mới trên CloudFront. Cả hai đều đang chạy, nên không ai gặp lỗi.

### Bước 9: Kiểm tra sau khi chuyển

```bash
dig +short uppush.io                                      # trả về IP của CloudFront, không còn 18.208.45.238
curl -sI https://uppush.io/ | grep -iE '^(HTTP|x-cache)'  # x-cache: … from cloudfront
BASE_URL=https://uppush.io npm run check:redirects        # 225/225 OK
curl -sI https://www.uppush.io/pricing | grep -iE '^(HTTP|location)'
# HTTP/2 301
# location: https://uppush.io/pricing/
```

- `app.uppush.io` (app Shopify), email @uppush.io, `docs.uppush.io` và `doc.uppush.io` phải chạy bình thường. Các bản ghi này không bị đụng tới, nhưng vẫn nên kiểm tra.
- Google Search Console: thêm **Domain property** `uppush.io` (xác minh bằng bản ghi TXT trên Squarespace), rồi gửi `https://uppush.io/sitemap-index.xml`.

### Bước 10: Rollback nếu có sự cố

Trên Squarespace:
- Xoá bản ghi ALIAS `@` và CNAME `www`.
- Thêm lại **A `@` → `18.208.45.238`**.

Site cũ quay lại sau khi hết TTL. Hãy giữ server WordPress chạy ít nhất 30 ngày.

### Lưu ý về ALIAS của Squarespace và hiệu năng

CloudFront chọn máy chủ biên (edge) gần nhất dựa vào nơi DNS được tra. Với ALIAS kiểu "flattening", Squarespace tự tra IP rồi trả về, nên một số khách ở xa có thể được đưa tới edge không tối ưu (chậm hơn vài chục tới vài trăm ms). Với một website marketing thì thường chấp nhận được. Nếu sau này cần tối ưu tốc độ toàn cầu, hãy chuyển DNS sang Route 53 theo phụ lục bên dưới, vì ALIAS của Route 53 chọn edge theo vị trí khách.

---

## Phụ lục: Chuyển DNS sang Route 53 (tuỳ chọn, không bắt buộc)

Chỉ cần làm nếu muốn ALIAS chọn edge theo vị trí khách hoặc muốn quản lý DNS trên AWS.

### R1: Tắt DNSSEC (trước ít nhất 2 ngày, bắt buộc khi đổi nameserver)

uppush.io **đang bật DNSSEC**. Nếu đổi nameserver khi DNSSEC còn bật, toàn bộ tên miền sẽ ngừng phân giải: website, **app.uppush.io (app Shopify)** và **email công ty**.

1. Tại nơi mua tên miền: **xoá DS record / tắt DNSSEC**.
2. Chờ khoảng 48 giờ, rồi kiểm tra bằng lệnh `dig +short DS uppush.io`. Lệnh phải **không in ra gì** mới được làm tiếp.
3. Squarespace tự tắt ký DNSSEC khi bạn chuyển sang nameserver bên ngoài; chỉ đổi nameserver sau khi bước 2 xác nhận DS đã hết.

Trong cùng thời gian đó, hạ TTL của các bản ghi trên Squarespace xuống 300 giây để lúc chuyển được nhanh.

### R2: Sao chép zone sang Route 53

```bash
# Xuất toàn bộ bản ghi hiện có (MX, SPF, DMARC, app, docs, doc, dev.app, ACM…)
# Squarespace không xuất được file zone: chép tay từng bản ghi trong mục Custom records,
# hoặc tạo file uppush-io.zone theo định dạng BIND rồi import vào Route 53.
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

> Không thêm bản ghi `www` vào DNS trước ngày go-live. Lúc đó `uppush.io` vẫn là WordPress, nên một số đích redirect mới (như `/rss.xml`) chưa tồn tại bên đó.

### R3: Đổi nameserver

1. Đóng băng WordPress (không đăng bài mới). Lấy nội dung lần cuối rồi push:
   ```bash
   npm run wp:export && npm run content:fix
   git add -A && git commit -m "Final WordPress export" && git push
   ```
2. Tại nơi mua tên miền: đổi **nameserver** sang 4 nameserver Route 53 của zone mới (xem ở bản ghi NS trong hosted zone).

Việc lan truyền thường mất từ vài phút tới vài giờ. Trong thời gian này một số người dùng vẫn vào site WordPress cũ. Điều đó không sao, vì cả hai zone có cùng các bản ghi còn lại.

### R4: Kiểm tra sau khi chuyển

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

### R5: Rollback

Trong Route 53:
- Sửa bản ghi của `uppush.io` từ Alias về **A `18.208.45.238`**.
- Xoá bản ghi `www`.

Site cũ sẽ quay lại trong vài phút (TTL 300). Hãy giữ server WordPress chạy ít nhất 30 ngày.

---

## Vận hành hằng ngày

- **Cập nhật nội dung:** sửa trong Pages CMS hoặc push lên `main`. Site cập nhật sau khoảng 3 phút.
- **Quay về bản trước:** revert commit trên `main`, hoặc chạy lại job deploy của một lần chạy thành công trước đó.
- **Đổi luật redirect** (`docs/url-inventory.csv`) hoặc security header: chạy `npm run redirects`, commit, rồi chạy lại lệnh ở bước 4 với đúng các tham số như trên để cập nhật stack. CloudFront function nằm trong template nên GitHub Actions không tự cập nhật nó.
- **Form liên hệ** (lưu email, Turnstile, xuất CSV): xem [contact-form.md](contact-form.md).
- **Chi phí ước tính:** khoảng 1–5 USD/tháng (S3 + CloudFront; thêm 0,5 USD nếu sau này dùng Route 53).

## Việc nên xong trước ngày go-live

- [ ] Duyệt **Terms and conditions** (đang là bản nháp, `noindex`).
- [ ] Chọn cách gửi **form liên hệ** (hiện là `mailto`).
- [ ] Điền **số liệu doanh thu thật** nếu muốn hiện chart (hiện đang ẩn).
- [ ] Bổ sung mục **Cookies** vào Privacy Policy.
