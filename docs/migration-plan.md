# Kế hoạch chuyển uppush.io từ WordPress sang Astro

> Ngày lập: 2026-10-02 · Dự án: `uppush-branding` · Dùng lại kiến trúc từ `ezorder-workspace/ezorder-branding`
> Danh sách URL kèm hành động cho từng URL: [`url-inventory.csv`](./url-inventory.csv) (207 dòng)

---

## 1. Mục tiêu và tiêu chí hoàn thành

| Mục tiêu | Tiêu chí đo được |
|---|---|
| Trang nhanh | TTFB < 100 ms (CDN), LCP < 1.8 s trên mobile 4G, Lighthouse Performance ≥ 95 cho trang chủ, pricing, một bài blog |
| Không mất thứ hạng SEO | 100% URL đang có traffic trả về 200 hoặc redirect 301 đúng đích; số trang được index và click trong Search Console không giảm quá 10% sau 4 tuần |
| Ổn định | Không có server/PHP/DB; trang là file tĩnh trên S3 + CloudFront |
| Người không biết code vẫn sửa được nội dung | Blog, pricing, partners, cấu hình trang sửa được qua Pages CMS |
| Đủ trang | Home, Web Push, Why choose Uppush, Marketing services, Pricing, Partners, Contact, FAQ, About, Blog (+ category/tag), Privacy, Terms, 404 |

## 2. Hiện trạng (đo ngày 2026-10-02)

**Hiệu năng**
- Server mất 0.7–1.1 s mới bắt đầu trả về (TTFB), trang `/partners/` mất 1.9 s. Mọi request đều `x-fastcgi-cache: MISS`, tức cache không hoạt động.
- Trang chủ: HTML 211 KB, 38 file JS + 41 file CSS (~690 KB chưa nén).
- Đang chạy: WordPress 7.1.2, Elementor 4.3.3, ElementsKit (lite + pro), theme Sierra + KeyDesign framework, Header-Footer-Elementor, Contact Form 7, Cloudflare Turnstile, Google Site Kit (`GT-PHGJ586C`), Crisp chat, Yoast SEO 28.6.

**Nội dung cần chuyển**
| Loại | Số lượng | Ghi chú |
|---|---|---|
| Bài blog | 55 | URL nằm ở **gốc** `/{slug}/` (không có tiền tố `/blog/`). Nội dung là HTML sạch, không có markup Elementor hay shortcode. Bài nào cũng có ảnh đại diện, tổng cộng 22 ảnh trong nội dung. Bài cũ nhất 2024-10-31 |
| Trang | 11 công khai + `/email-marketing/` (đang 301 về `/`) | Đều dựng bằng Elementor, nên phải **làm lại giao diện**, chỉ chuyển được chữ |
| Category | 15 (2 cấp) | 9 category có ≥ 3 bài |
| Tag | 73 | Chỉ 7 tag có ≥ 3 bài, còn lại là trang mỏng |
| Phân trang blog | `/blog/page/2/` … `/blog/page/6/` | |

**Lỗi SEO đang có (bản Astro sẽ sửa luôn)**
1. `/robots.txt` trả về **404**.
2. Sitemap khai báo cho Google 37 URL rác của theme/plugin: `/portfolio/*` (trang demo của theme: "running-up-that-hill", "lingua-franca"…), `/elementskit-content/*`, `/?elementskit_template=*`, `/portfolio-category/*`.
3. Trang `/author/admin/` lộ username admin.
4. Title của bài viết do Yoast tạo quá dài, ví dụ: `How to create a Shopify email marketing strategy from scratch - AI Email Marketing for Shopify | Free Plan Available` (hơn 110 ký tự, Google sẽ cắt bớt).
5. Còn sót nội dung mẫu của theme trên trang chủ: *"Empower your financial future with personalized advice and smart investment products."* (mục "Build your loyal list").
6. Trang đang trỏ tới hai tên miền docs khác nhau: `doc.uppush.io` và `docs.uppush.io`.
7. 66 trang tag và category mỏng (1–2 bài) bị index.

## 3. Kiến trúc mục tiêu

Dùng lại gần như nguyên khung của `ezorder-branding`:

| | |
|---|---|
| Framework | Astro 7, `output: 'static'`, TypeScript, `trailingSlash: 'always'` |
| Style | Tailwind CSS 4 + `@tailwindcss/typography`, design token dạng CSS variable (theo nhận diện Uppush) |
| Nội dung | Astro Content Collections (Markdown/MDX), dữ liệu JSON được kiểm tra bằng zod lúc build |
| CMS | Pages CMS (`.pages.yml`): blog, pricing, partners, site settings, FAQ |
| Tìm kiếm | Pagefind |
| Font | Tự host (variable font, chỉ subset latin) |
| Hosting | S3 (private) + CloudFront, deploy bằng GitHub Actions qua OIDC, hạ tầng viết bằng CloudFormation |
| JS phía client | Mặc định không có. Chỉ thêm: máy tính so sánh giá, Crisp và GA (tải chậm), form liên hệ, tìm kiếm |

### 3.1 Sơ đồ route (giữ nguyên URL cũ)

```
src/pages/
  index.astro                       /
  web-push.astro                    /web-push/
  why-choose-uppush.astro           /why-choose-uppush/
  marketing-services-by-uppush.astro /marketing-services-by-uppush/
  pricing.astro                     /pricing/
  partners.astro                    /partners/
  contact.astro                     /contact/
  faq.astro                         /faq/
  about.astro                       /about/
  privacy-policy.astro              /privacy-policy/
  terms-and-conditions.astro        /terms-and-conditions/
  404.astro
  [slug].astro                      /{post-slug}/        ← bài blog ở gốc, như WordPress
  blog/index.astro                  /blog/
  blog/page/[page].astro            /blog/page/2/ …      ← giữ định dạng phân trang của WP
  category/[...path].astro          /category/email-marketing/email-automation/
  tag/[slug].astro                  /tag/email-marketing/
  rss.xml.ts                        /rss.xml
```

**Quy tắc bắt buộc:** `[slug].astro` ở gốc có thể trùng tên với một trang tĩnh. Phải thêm bước kiểm tra lúc build để báo lỗi nếu slug của bài viết trùng với tên trang hoặc từ khoá dành riêng (`blog`, `category`, `tag`, `pricing`…).

### 3.2 Những gì lấy từ ezorder-branding

| Tái sử dụng gần nguyên vẹn | Phải sửa |
|---|---|
| `astro.config.mjs` (sitemap, font, i18n) | Domain, font, màu sắc |
| `components/seo/SEO.astro`, `lib/json-ld-schema-builders.ts` | Đổi Organization/SoftwareApplication sang Uppush |
| `components/blog/*`, `lib/blog-posts.ts`, `layouts/BlogPostLayout.astro` | Thêm category (2 cấp), phân trang dạng `/blog/page/N/`, route bài ở gốc |
| `components/pricing/*`, `data/pricing.ts` | Thêm hai gói FREE/PRO, giá "from $12.99", bảng so sánh với đối thủ |
| `components/contact/ContactForm.astro` | Đổi sang cách gửi mới (xem §6.1) |
| `components/layout/GoogleAnalytics.astro`, `ChatWidget.astro` | Đổi ID và chuyển sang Crisp |
| `.pages.yml`, `infra/cloudformation-website-hosting.yml`, `.github/workflows/build-and-deploy.yml` | Thêm collection partners; thêm redirect và 410 vào CloudFront Function |

## 4. Chuyển đổi SEO (phần quan trọng nhất)

### 4.1 Quy tắc URL
Mọi quyết định cho từng URL nằm trong [`url-inventory.csv`](./url-inventory.csv):

| Hành động | Số URL | Gồm những gì |
|---|---|---|
| **keep** (giữ nguyên đường dẫn) | 88 | 11 trang, `/blog/` + 5 trang phân trang, 55 bài, 9 category ≥ 3 bài, 7 tag ≥ 3 bài |
| **301** | 78 | 66 tag mỏng → `/blog/`, 6 category mỏng → category cha hoặc `/blog/`, 2 trang author → `/blog/`, các feed → `/rss.xml`, `/email-marketing/` → `/` |
| **410 Gone** | 38 | 37 URL demo của theme/plugin, `/comments/feed/` |
| Theo mẫu (pattern) | — | `/wp-admin/*`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json/*` → 410; `/?p=ID`, `/?page_id=ID` → 301 tới URL mới (bảng tra sinh ra từ dữ liệu export) |

### 4.2 Redirect được xử lý ở đâu
- Astro `redirects` sinh ra trang HTML dùng meta refresh, **không phải 301 thật** khi host tĩnh. Vì vậy mọi redirect phải đặt trong **CloudFront Function** (đã có sẵn khung trong ezorder: chuyển www, thêm dấu `/` cuối, rewrite sang `index.html`).
- Lúc build sinh file `redirects.json` từ CSV, rồi chèn vào CloudFront Function dưới dạng bảng tra `{ "/tag/x/": "/blog/" }`. CloudFront Function giới hạn 10 KB code; ~80 redirect vẫn nằm trong giới hạn. Nếu sau này vượt, chuyển sang CloudFront KeyValueStore.
- Thêm kiểm tra trong CI: đọc CSV, gửi request tới bản staging, so sánh status code và `Location` với cột `action`/`target`.

### 4.3 Metadata
- Lấy `title`, `description`, `canonical`, `robots`, `og_image` của từng bài từ trường `yoast_head_json` của REST API, rồi ghi vào frontmatter (`seoTitle`, `description`, `ogImage`). Mục đích là giữ nguyên snippet đang xếp hạng.
- Đổi mẫu title mặc định thành `{title} | Uppush`. Chỉ ghi đè bằng `seoTitle` khi title của Yoast đã được viết tay (không phải title tự sinh có đuôi `- AI Email Marketing for Shopify | Free Plan Available`).
- Giữ đúng `pubDate` và `updatedDate` theo `date`/`modified` của WP.
- JSON-LD: `Organization`, `WebSite`, `SoftwareApplication` (kèm `aggregateRating` 4.9★ của App Store, phải cập nhật tay hoặc khi build), `BlogPosting`, `BreadcrumbList`, `FAQPage` (trang FAQ và phần FAQ của pricing).
- Category và tag còn giữ lại: có mô tả riêng ở đầu trang. Những trang chỉ là danh sách bài và quá mỏng thì đặt `noindex,follow`.
- `robots.txt` trỏ tới `sitemap-index.xml`. Sitemap loại bỏ 404 và các trang noindex.

### 4.4 Ảnh trong `/wp-content/uploads/`
Đề xuất: tải toàn bộ ảnh đại diện và ảnh trong bài về `src/assets/uploads/` để Astro tối ưu (AVIF/WebP). Không giữ đường dẫn cũ. Các URL `/wp-content/uploads/*` cũ sẽ trả 404; ảnh không phải nguồn traffic chính nên mất mát này chấp nhận được.
Phương án dự phòng, nếu Search Console cho thấy Google Images mang lại traffic đáng kể: copy nguyên ảnh gốc vào `public/wp-content/uploads/` theo đúng đường dẫn cũ.

## 5. Từng trang

| Trang | Nguồn dữ liệu | Ghi chú triển khai |
|---|---|---|
| **Home** | `data/home.ts` | Hero ("Smarter email marketing for Shopify, powered by AI"), automation, analytics, segmentation, template, social proof (4.9★), CTA về App Store. **Bỏ câu mẫu "Empower your financial future…"** |
| **Web Push** | `data/web-push.ts` | 6 trigger dựng sẵn, segment, campaign builder, mockup "native trên mọi nền tảng". Mockup phải dựng bằng HTML/CSS hoặc ảnh, không dùng JS |
| **Why choose Uppush** | MDX | |
| **Marketing services** | MDX | Trang dịch vụ email marketing làm trọn gói. CTA dẫn tới form liên hệ hoặc email |
| **Pricing** | `data/pricing.json` (CMS) | Hai gói FREE/PRO, giá "from $12.99*", bảng so sánh, FAQ. **Máy tính so sánh giá Klaviyo/Omnisend/Mailchimp/Uppush** (thay đổi số subscriber và số campaign/tháng) là một island JS nhỏ (< 5 KB, vanilla), có bảng tĩnh mặc định cho bot và trường hợp không có JS. Giá phải khớp với App Store |
| **Partners** | collection `partners` (CMS): tên, logo, số review, mô tả, link cài đặt | Bốn ô lợi ích + danh sách app được giới thiệu + CTA `marketing@uppush.io`. Link cài đặt gắn UTM |
| **Contact** | `data/contact-form.ts` | Form + ba thẻ hỗ trợ (Support center, Developer guides, Community). Xem §6.1 |
| **FAQ** | `data/faq.ts` | Có JSON-LD `FAQPage` |
| **About, Privacy, Terms** | Markdown | `LegalLayout` |
| **Blog** | `src/content/blog/*.md` | Danh sách, category, tag, tìm kiếm, mục lục, bài liên quan, RSS |

**Link App Store:** gom các link `apps.shopify.com/pushup-notification-marketing?surface_detail=…&surface_type=landing-page` vào một helper `appStoreUrl(surfaceDetail)` để giữ nguyên dữ liệu tracking hiện có.
**Docs:** chọn **một** domain (`docs.uppush.io` hoặc `doc.uppush.io`) và đặt trong `site.json`.

## 6. Tính năng động

### 6.1 Form liên hệ (đang dùng Contact Form 7 + Turnstile)
Đề xuất: **tạo một endpoint nhỏ** (AWS Lambda Function URL, hoặc một route trong backend Uppush) để xác thực Turnstile, chặn spam bằng honeypot và rate limit, rồi gửi mail qua `mail-service` sẵn có tới `support@uppush.io`. Dữ liệu không phải đi qua bên thứ ba.
Phương án nhanh hơn: Web3Forms (component đã hỗ trợ sẵn, chỉ cần access key).
Form phải hoạt động cả khi không có JS (POST thường rồi chuyển sang `/contact/thanks/`).

### 6.2 Crisp chat
Chỉ tải khi người dùng tương tác (scroll, di chuột, chạm) hoặc khi trình duyệt rảnh (`requestIdleCallback`), muộn nhất sau 4 s, để không ảnh hưởng LCP và INP.

### 6.3 Analytics
Dùng gtag trực tiếp (bỏ Site Kit), giữ property GA4 hiện tại (lấy Measurement ID trong Site Kit, tag Google đang là `GT-PHGJ586C`). Đặt sự kiện `click_app_store` với tham số `surface_detail` cho các nút CTA. Nếu cần cookie consent (EU) thì dùng Consent Mode v2.

## 7. Hosting và deploy
- CloudFormation stack mới `uppush-website`: S3 private + CloudFront (OAC) + ACM cert cho `uppush.io` và `www.uppush.io` + CloudFront Function (www → apex, dấu `/` cuối, bảng redirect, 410) + response headers policy (HSTS, CSP, X-Content-Type-Options) + IAM role OIDC cho GitHub.
- GitHub Actions: build và chạy `astro check` trên mọi PR. Push lên `main` thì sync lên S3, đặt `Cache-Control` (immutable cho `/_astro/*`, ngắn cho HTML) rồi invalidate CloudFront.
- Môi trường staging: một CloudFront distribution riêng hoặc subdomain `next.uppush.io`, gắn header `X-Robots-Tag: noindex` và basic auth.

## 8. Các giai đoạn triển khai

| # | Giai đoạn | Công việc chính | Kết quả bàn giao | Ước tính |
|---|---|---|---|---|
| 0 | **Chuẩn bị** | Chốt các quyết định ở §10. Backup WordPress (DB + uploads). Export dữ liệu Search Console: top trang/truy vấn 16 tháng, danh sách backlink. Crawl toàn bộ site cũ bằng Screaming Frog để có danh sách URL đầy đủ, kể cả URL không có trong sitemap | Snapshot SEO làm mốc so sánh, CSV được duyệt | 1 ngày |
| 1 | **Dựng khung dự án** | Copy khung từ ezorder, đổi brand (logo, màu, font), `site.json`, layout Header/Footer theo menu hiện tại (Web Push, Why choose Uppush, Pricing, Partners, Resources → Blog/FAQ/Help, Contact), CI, `astro check` sạch | Repo build được, deploy lên staging | 1–2 ngày |
| 2 | **Script chuyển nội dung** | `scripts/wp-export.mjs`: gọi REST `/wp/v2/posts`, `categories`, `tags`, `media` và `yoast_head_json` → Markdown + frontmatter, tải ảnh về `src/assets/uploads/`, viết lại link nội bộ, sinh bảng `?p=ID`. Chạy lại được nhiều lần cho tới ngày cutover | 55 bài `.md` hợp lệ theo schema | 1–2 ngày |
| 3 | **Blog** | Route bài ở gốc, `/blog/page/N/`, category 2 cấp, tag, mục lục, bài liên quan, Pagefind, RSS, JSON-LD | Blog đủ tính năng trên staging | 1–2 ngày |
| 4 | **Các trang marketing** | Home, Web Push, Why choose, Marketing services, About, FAQ, Privacy, Terms. Viết lại chữ, bỏ nội dung mẫu | Đủ trang tĩnh | 3–5 ngày |
| 5 | **Pricing, Partners, Contact** | Dữ liệu pricing qua CMS + máy tính so sánh giá, collection partners qua CMS, endpoint form + Turnstile | Ba trang hoạt động đầy đủ | 2–3 ngày |
| 6 | **Hạ tầng và redirect** | CloudFormation, CloudFront Function sinh từ CSV, script kiểm tra redirect, security headers, Crisp và GA tải chậm | Staging giống production | 1–2 ngày |
| 7 | **QA** | Xem mục 8.1 | Checklist đạt hết | 1–2 ngày |
| 8 | **Cutover** | Xem mục 8.2 | uppush.io chạy trên Astro | ½ ngày |
| 9 | **Theo dõi sau khi chạy** | Xem mục 8.3 | Báo cáo tuần 1, 2, 4 | 4 tuần (vài giờ/tuần) |

Tổng cộng khoảng **12–20 ngày công** cho một người, phụ thuộc chủ yếu vào việc làm lại thiết kế các trang marketing.

### 8.1 Checklist QA
- [ ] Mọi dòng `keep` trong CSV trả 200 trên staging, mọi dòng `301` trả đúng `Location`, mọi dòng `410` trả 410
- [ ] Crawl staging bằng Screaming Frog: không có link nội bộ hỏng, không có redirect chain, mỗi trang chỉ một H1, có title, description và canonical
- [ ] So sánh title và description của 55 bài giữa site cũ và mới (diff tự động)
- [ ] Lighthouse mobile ≥ 95 (Performance, SEO, Best Practices, Accessibility) cho home, pricing, một bài, blog
- [ ] Rich Results Test: Organization, SoftwareApplication, BlogPosting, FAQPage, Breadcrumb
- [ ] Form liên hệ: gửi thành công, chặn được spam, chạy được khi không có JS
- [ ] Máy tính giá ra đúng số; bảng giá khớp App Store
- [ ] Link App Store giữ đủ `surface_detail`; sự kiện GA được ghi nhận
- [ ] Giao diện đúng ở 360 px, 768 px, 1280 px; chế độ sáng và tối
- [ ] `robots.txt`, `sitemap-index.xml`, `rss.xml`, `404` đều đúng

### 8.2 Cutover
1. Đóng băng nội dung WordPress (không đăng bài mới), chạy lại script export lần cuối rồi deploy.
2. Giảm TTL của DNS xuống 300 s trước 24 giờ.
3. Trỏ `uppush.io` và `www` sang CloudFront.
4. Chạy lại script kiểm tra redirect trên production.
5. Submit `sitemap-index.xml` mới lên Search Console, xoá sitemap cũ của Yoast. Yêu cầu index lại home, pricing và 10 bài nhiều traffic nhất.
6. Giữ server WordPress (tắt public, chỉ truy cập qua IP hoặc subdomain nội bộ) ít nhất 30 ngày để rollback và tra cứu.

**Rollback:** trỏ DNS ngược về server cũ (mất khoảng 5 phút nhờ TTL thấp).

### 8.3 Theo dõi sau khi chạy
- Search Console hằng ngày trong tuần đầu: Coverage (404 tăng bất thường), Core Web Vitals, click và impression của top 20 trang so với mốc.
- Bổ sung redirect cho mọi 404 có traffic hoặc backlink (CloudFront log hoặc báo cáo 404 trong GA).
- Sau 4 tuần: so sánh với mốc, rồi tắt hẳn WordPress.

## 9. Rủi ro và cách giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Mất thứ hạng vì đổi URL | Cao | Giữ nguyên slug bài ở gốc, 301 thật ở CloudFront, kiểm tra tự động bằng CSV, theo dõi 4 tuần |
| Slug bài trùng tên trang | Trung bình | Kiểm tra lúc build (§3.1) |
| Title/description bị thay đổi làm giảm CTR | Trung bình | Import từ Yoast, chỉ đổi những title tự sinh quá dài |
| Có URL không nằm trong sitemap mà vẫn có backlink | Trung bình | Crawl và export backlink ở giai đoạn 0, theo dõi 404 sau khi chạy |
| Người biên tập quen WordPress | Thấp | Pages CMS + một trang hướng dẫn ngắn trong README |
| Vượt giới hạn 10 KB của CloudFront Function | Thấp | Gom redirect theo mẫu (tag mỏng → `/blog/`) hoặc dùng KeyValueStore |

## 10. Các quyết định cần chốt (kèm đề xuất mặc định)

| # | Quyết định | Đề xuất |
|---|---|---|
| 1 | Giữ bài blog ở gốc `/{slug}/` hay chuyển sang `/blog/{slug}/` | **Giữ ở gốc.** Chuyển sẽ phải 301 cả 55 bài mà không được lợi gì |
| 2 | Tag/category mỏng: 301, noindex hay giữ | **301 những trang < 3 bài** (như trong CSV) |
| 3 | Backend cho form liên hệ | **Endpoint riêng + `mail-service`**; muốn nhanh thì dùng Web3Forms |
| 4 | Làm lại thiết kế hay sao chép giao diện Elementor | **Làm lại theo bố cục hiện tại**, giữ chữ, tinh gọn visual |
| 5 | Domain tài liệu | Chọn một trong `docs.uppush.io` / `doc.uppush.io` |
| 6 | Ảnh `/wp-content/uploads/*` | Tối ưu lại, chấp nhận 404 (§4.4) |
| 7 | Đa ngôn ngữ | Chỉ tiếng Anh; routing i18n để sẵn như ezorder |
| 8 | Hosting | S3 + CloudFront giống ezorder (cùng một tài khoản AWS và quy trình) |

---

## 11. Tiến độ triển khai (cập nhật 2026-10-02)

| Giai đoạn | Trạng thái | Ghi chú |
|---|---|---|
| 1. Dựng khung dự án | ✅ Xong | Thiết kế mới hoàn toàn (Geist, màu `#15B27A`, mockup HTML/CSS). `astro check` 0 lỗi |
| 2. Script chuyển nội dung | ✅ Xong | `npm run wp:export`: 55 bài, ảnh WebP (52 MB → 3.8 MB), metadata Yoast, 67 shortlink |
| 3. Blog | ✅ Xong | Bài ở gốc, `/blog/page/N/`, category 2 cấp, tag, Pagefind, RSS, JSON-LD |
| 4. Trang marketing | ✅ Xong | Home, Web push, Why Uppush, Marketing services, About, FAQ, Partners, Contact |
| 5. Pricing, Partners, Contact | ✅ Xong · ⚠️ form | Máy tính giá dùng đúng công thức của app. Form đang ở chế độ `mailto` cho tới khi có endpoint |
| 6. Hạ tầng & redirect | ✅ Code xong | CloudFront Function sinh từ CSV (7 KB). `check:redirects` 208/208 OK. Chưa deploy |
| 7. QA | 🔶 Một phần | Đã kiểm tra desktop + 390px. Còn: Lighthouse, Rich Results, crawl staging |
| 8. Cutover | ⏳ Chưa | Cần: repo GitHub, stack AWS, chứng chỉ ACM, quyết định ở mục 12 |

## 12. Vấn đề phát hiện khi triển khai — cần chủ dự án quyết định

1. **Terms and conditions trên WordPress là văn bản mẫu của theme** ("WordPress themes … provided by (Company)"). Đã soạn bản nháp Terms riêng cho Uppush ở `src/pages/terms-and-conditions.md`, đang để `noindex`. **Phải được duyệt (tốt nhất bởi luật sư) trước khi go-live.**
2. **FAQ pricing cũ sai so với app**: ghi trial 14 ngày, $8.99, $1/1.000 email; code app là **7 ngày, $12.99, $1.50/1.000 email**. Site mới dùng số liệu từ code.
3. **"AI – Evaluation and scoring"** có trong danh sách tính năng gói Pro của app nhưng không tìm thấy code thực hiện. Landing page không quảng cáo tính năng này.
4. **9 bài blog chỉ có ảnh, không có chữ** (1 bài ảnh hỏng vì trỏ tới `dev.uppush.app`): `10-essential-email-campaigns…`, `best-practices-for-sending-browser-push…`, `building-a-welcome-email-series…`, `designing-effective-email-templates…`, `getting-started-with-email-marketing…`, `how-to-use-a-b-testing…`, `how-to-use-push-notifications-to-recover…`, `seasonal-email-campaign-ideas…`, `optimal-frequency-for-sending-web-push…`. Nên viết lại hoặc gộp (rồi 301).
5. **Trang About cũ trống** (khung demo theme). Đã viết mới, chỉ dùng thông tin kiểm chứng được.
6. **Số liệu trên trang Web push cũ** ("$24.8K recovered", "4× vs email") không có nguồn, nên không được dùng lại.
7. **Bảng giá đối thủ** (Klaviyo/Omnisend/Mailchimp) lấy từ `ComparePricing.tsx` của app. Nên rà soát lại theo giá hiện hành của các bên trước khi công bố.
