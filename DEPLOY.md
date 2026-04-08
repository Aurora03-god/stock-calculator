# 🚀 배포 가이드 (Deployment Guide)

이 문서는 Stock Return Calculator를 다양한 플랫폼에 배포하는 방법을 설명합니다.

---

## 📋 배포 전 준비

### 1. 빌드 테스트
```bash
cd stock-calculator
npm run build
```
빌드가 성공하면 `dist/` 폴더가 생성됩니다. 이 폴더가 배포할 파일입니다.

### 2. 로컬에서 빌드 미리보기
```bash
npm run preview
```
`http://localhost:4173/` 에서 빌드된 결과물을 확인할 수 있습니다.

---

## 🌐 배포 방법 (무료)

### 방법 1: Vercel (추천 ⭐)

가장 쉽고 빠른 방법입니다.

#### A. GitHub 연동 (자동 배포)

1. **GitHub에 코드 업로드**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stock-calculator.git
git push -u origin main
```

2. **Vercel 가입 및 연동**
   - [vercel.com](https://vercel.com) 접속
   - GitHub 계정으로 로그인
   - **"Add New Project"** 클릭
   - `stock-calculator` 레포지토리 선택
   - Framework Preset: **Vite** 선택
   - **"Deploy"** 클릭

3. **완료!** `https://stock-calculator-xxxxx.vercel.app` 주소가 자동 생성됩니다.

> 💡 이후 GitHub에 push하면 자동으로 재배포됩니다.

#### B. CLI로 바로 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포 (프로젝트 폴더에서 실행)
vercel

# 프로덕션 배포
vercel --prod
```

---

### 방법 2: Netlify

1. **Netlify 가입**
   - [netlify.com](https://www.netlify.com) 접속
   - GitHub 계정으로 로그인

2. **방법 A: 드래그 & 드롭 (가장 간단)**
   - `npm run build` 실행
   - [app.netlify.com/drop](https://app.netlify.com/drop) 접속
   - `dist/` 폴더를 브라우저에 드래그 & 드롭
   - 끝! 바로 URL이 생성됩니다.

3. **방법 B: GitHub 연동 (자동 배포)**
   - Netlify 대시보드 → **"Add new site"** → **"Import an existing project"**
   - GitHub 레포지토리 선택
   - Build command: `npm run build`
   - Publish directory: `dist`
   - **"Deploy"** 클릭

4. **방법 C: CLI**
```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 빌드 후 배포
npm run build
netlify deploy --dir=dist --prod
```

---

### 방법 3: GitHub Pages (무료)

1. **vite.config.js 수정** (base 경로 설정)
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/stock-calculator/',  // ← GitHub 레포지토리 이름
})
```

2. **gh-pages 패키지 설치**
```bash
npm install -D gh-pages
```

3. **package.json에 스크립트 추가**
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

4. **배포 실행**
```bash
npm run deploy
```

5. **GitHub 설정**
   - GitHub 레포지토리 → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` / `/ (root)` 선택
   - **Save** 클릭

6. **완료!** `https://YOUR_USERNAME.github.io/stock-calculator/` 에서 접근 가능

---

### 방법 4: Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) 접속 후 로그인
2. **Workers & Pages** → **Create application** → **Pages**
3. GitHub 레포지토리 연결
4. 설정:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Save and Deploy** 클릭
6. `https://stock-calculator.pages.dev` 같은 주소가 생성됩니다.

---

## 🔧 커스텀 도메인 연결

### Vercel
1. Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Domains**
2. 커스텀 도메인 입력 (예: `calculator.example.com`)
3. DNS 설정에서 CNAME 레코드 추가:
   - Name: `calculator`
   - Value: `cname.vercel-dns.com`

### Netlify
1. Netlify 대시보드 → **Domain settings** → **Add custom domain**
2. DNS 설정에서 CNAME 레코드 추가:
   - Name: `calculator`
   - Value: `your-site-name.netlify.app`

---

## ⚠️ 주의사항

### CORS 프록시
- 이 앱은 `corsproxy.io`를 CORS 프록시로 사용합니다.
- 프록시 서비스가 중단되면 데이터를 가져올 수 없습니다.
- 대안 프록시: `allorigins.win`, `api.codetabs.com` 등

### API 제한
- Yahoo Finance 비공식 API는 요청 횟수 제한이 있을 수 있습니다.
- 트래픽이 많을 경우 자체 백엔드 프록시 서버를 구축하는 것을 권장합니다.

### 환경
- Node.js 18+ 필요
- npm 9+ 권장

---

## 📊 배포 플랫폼 비교

| 플랫폼 | 무료 여부 | 자동 배포 | HTTPS | 커스텀 도메인 | 난이도 |
|---|---|---|---|---|---|
| **Vercel** | ✅ 무료 | ✅ | ✅ | ✅ | ⭐ 매우 쉬움 |
| **Netlify** | ✅ 무료 | ✅ | ✅ | ✅ | ⭐ 매우 쉬움 |
| **GitHub Pages** | ✅ 무료 | ⚠️ 수동 | ✅ | ✅ | ⭐⭐ 보통 |
| **Cloudflare Pages** | ✅ 무료 | ✅ | ✅ | ✅ | ⭐⭐ 보통 |

> 💡 **초보자 추천:** Vercel 또는 Netlify 드래그 & 드롭

---

<div align="center">
  <sub>이 가이드는 Stock Return Calculator 프로젝트를 위해 작성되었습니다.</sub>
</div>
