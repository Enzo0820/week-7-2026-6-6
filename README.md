# 🎬 CINE收藏庫 - 電影收藏網站 (Next.js 期末專題)

這是一個使用 **Next.js (App Router)**、**TypeScript** 與 **Tailwind CSS** 構建的現代化個人電影收藏網站。
本專案專為高中期末專題設計，符合無資料庫、無登入系統的輕量限制，改採伺服器端讀寫本地 **JSON 檔案** 的方式進行電影資料的持久化儲存。

## 🌟 專案亮點與功能

1. **📊 數據統計儀表板 (Dashboard)**：
   - 即時計算「總電影收藏量」、「平均喜愛星級」以及「最喜愛的電影類型」。
2. **🍿 完整 CRUD 電影管理**：
   - **新增電影**：彈出式視窗表單，支援資料輸入驗證（片名與導演為必填，上映年份限制在 1888-2100 年之間）。
   - **編輯電影**：可一鍵將現有電影資料載入表單，完成修改後寫回 JSON。
   - **刪除電影**：包含防呆確認刪除的 Modal，確認後從硬碟完全移除。
3. **🔍 即時搜尋與篩選**：
   - 支援依據「電影片名」或「導演名字」進行即時前端關鍵字搜尋。
   - 類型篩選器會自動抓取當前已收藏電影的所有類型，動態產生篩選下拉選單。
4. **排序功能**：
   - 支援依據「新增時間」、「上映年份」以及「電影評分」進行排序，並支援一鍵切換正序/倒序。
5. **🎨 極致視覺設計 (Cinema Dark Theme)**：
   - 採用高級的電影院深色調（Slate/Indigo）背景，搭配毛玻璃（Backdrop-blur）效果。
   - 豐富的按鈕懸停（Hover）微動畫，以及無海報時自動生成的「文字美化版海報」設計。

---

## 🛠️ 技術棧 (Tech Stack)

* **前端框架**：Next.js 16.2.7 (React 19, App Router)
* **程式語言**：TypeScript
* **樣式工具**：Tailwind CSS v4
* **資料儲存**：本地 JSON 檔案儲存庫 (`data/data.json`)，使用 Node.js `fs/promises` 與 `path` 進行非同步讀寫。

---

## 📂 專案檔案結構說明

```
final-project/
├── app/
│   ├── page.tsx                      # 網頁主介面 (包含表單、卡片列表、搜尋與篩選狀態)
│   ├── layout.tsx                    # 全域版面配置與字型載入
│   ├── globals.css                   # 全域 CSS 與 Tailwind v4 載入
│   └── api/
│       └── items/
│           └── route.ts              # 後端 API 路由 (GET, POST, PUT, DELETE 讀寫 JSON)
├── data/
│   └── data.json                     # 電影資料庫 JSON 檔案 (自動建立)
├── types/
│   └── index.ts                      # TypeScript 介面與型別定義
├── package.json                      # 專案相依套件與執行腳本
└── README.md                         # 專案說明文件 (本檔案)
```

---

## 🚀 如何在本機執行

### 1. 安裝專案相依套件
在專案根目錄下，開啟終端機執行：
```bash
npm install
```

### 2. 啟動本機開發伺服器
```bash
npm run dev
```
啟動後，請於瀏覽器中打開 **[http://localhost:3000](http://localhost:3000)** 即可開始體驗！

---

## 📝 授權說明
本專案為高中 Next.js 網頁設計期末專題。
儲存於 `data/data.json` 中的所有圖片與電影資訊均為測試使用。
