"use client";

import { useState, useMemo, useEffect } from "react";
import { Movie, SortKey, SortOrder } from "@/types";

// 預設常見類型
const PRESETS_GENRES = ["科幻", "動畫", "劇情", "動作", "喜劇", "懸疑", "恐怖", "愛情", "冒險", "奇幻"];

export default function Home() {
  // 電影列表狀態（改由 API 獲取，初始為空陣列）
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // 控制新增/編輯表單的彈出狀態
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // 目前正在編輯的電影（若為 null 代表是「新增」模式）
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // 控制刪除確認對話框
  const [deletingMovieId, setDeletingMovieId] = useState<string | null>(null);

  // 搜尋、篩選與排序狀態
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 表單資料狀態
  const [formTitle, setFormTitle] = useState("");
  const [formDirector, setFormDirector] = useState("");
  const [formGenreType, setFormGenreType] = useState("preset"); // 'preset' | 'custom'
  const [formPresetGenre, setFormPresetGenre] = useState("科幻");
  const [formCustomGenre, setFormCustomGenre] = useState("");
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formRating, setFormRating] = useState<number>(5);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // 表單欄位錯誤提示
  const [formError, setFormError] = useState("");

  // -------------------------------------------------------------
  // API 串接邏輯
  // -------------------------------------------------------------
  
  // 1. GET 取得所有電影資料
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setMovies(data);
      } else {
        console.error("無法取得電影資料：伺服器回傳錯誤");
      }
    } catch (error) {
      console.error("無法取得電影資料：網路連線錯誤", error);
    } finally {
      setLoading(false);
    }
  };

  // 頁面載入時觸發 GET
  useEffect(() => {
    fetchMovies();
  }, []);

  // 開啟新增表單
  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormTitle("");
    setFormDirector("");
    setFormGenreType("preset");
    setFormPresetGenre("科幻");
    setFormCustomGenre("");
    setFormYear(new Date().getFullYear());
    setFormRating(5);
    setFormImageUrl("");
    setFormNotes("");
    setFormError("");
    setIsFormOpen(true);
  };

  // 開啟編輯表單
  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormTitle(movie.title);
    setFormDirector(movie.director);
    
    if (PRESETS_GENRES.includes(movie.genre)) {
      setFormGenreType("preset");
      setFormPresetGenre(movie.genre);
      setFormCustomGenre("");
    } else {
      setFormGenreType("custom");
      setFormPresetGenre("其他");
      setFormCustomGenre(movie.genre);
    }
    
    setFormYear(movie.year);
    setFormRating(movie.rating);
    setFormImageUrl(movie.imageUrl || "");
    setFormNotes(movie.notes || "");
    setFormError("");
    setIsFormOpen(true);
  };

  // 送出表單 (新增或編輯)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // 基礎欄位驗證
    if (!formTitle.trim()) {
      setFormError("請輸入電影片名");
      return;
    }
    if (!formDirector.trim()) {
      setFormError("請輸入導演名稱");
      return;
    }
    const finalGenre = formGenreType === "preset" ? formPresetGenre : formCustomGenre.trim();
    if (!finalGenre) {
      setFormError("請輸入或選擇電影類型");
      return;
    }
    if (formYear < 1888 || formYear > 2100) {
      setFormError("請輸入合理的上映年份 (1888-2100)");
      return;
    }

    if (editingMovie) {
      // 編輯模式 (呼叫 PUT API)
      try {
        const res = await fetch("/api/items", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingMovie.id,
            title: formTitle.trim(),
            director: formDirector.trim(),
            genre: finalGenre,
            year: formYear,
            rating: formRating,
            imageUrl: formImageUrl.trim(),
            notes: formNotes.trim(),
          }),
        });

        if (res.ok) {
          // 編輯成功後，重新取得最新資料 (GET)
          await fetchMovies();
          setIsFormOpen(false);
        } else {
          const errData = await res.json();
          setFormError(errData.error || "修改電影失敗");
        }
      } catch (error) {
        setFormError("與伺服器連線失敗，請檢查網路狀態");
      }
    } else {
      // 新增模式 (呼叫 POST API 新增資料)
      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            director: formDirector.trim(),
            genre: finalGenre,
            year: formYear,
            rating: formRating,
            imageUrl: formImageUrl.trim(),
            notes: formNotes.trim(),
          }),
        });

        if (res.ok) {
          // 新增成功後，重新取得最新資料 (GET)
          await fetchMovies();
          setIsFormOpen(false);
        } else {
          const errData = await res.json();
          setFormError(errData.error || "新增失敗，伺服器拒絕此請求");
        }
      } catch (error) {
        setFormError("與伺服器連線失敗，請檢查網路狀態");
      }
    }
  };

  // 確定刪除電影 (呼叫 DELETE API)
  const confirmDelete = async () => {
    if (deletingMovieId) {
      try {
        const res = await fetch(`/api/items?id=${deletingMovieId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // 刪除成功後，重新取得最新資料 (GET)
          await fetchMovies();
        } else {
          console.error("刪除電影失敗");
        }
      } catch (error) {
        console.error("與伺服器連線失敗", error);
      } finally {
        setDeletingMovieId(null);
      }
    }
  };

  // 取得所有已存在的電影類型，供篩選器使用
  const allGenres = useMemo(() => {
    const genresSet = new Set<string>();
    movies.forEach((m) => {
      if (m.genre) genresSet.add(m.genre);
    });
    return Array.from(genresSet);
  }, [movies]);

  // 統計數據計算
  const stats = useMemo(() => {
    const total = movies.length;
    const avgRating = total > 0 ? movies.reduce((sum, m) => sum + m.rating, 0) / total : 0;
    
    // 計算最愛的類型 (數量最多者)
    const genreMap: { [key: string]: number } = {};
    movies.forEach((m) => {
      genreMap[m.genre] = (genreMap[m.genre] || 0) + 1;
    });
    let topGenre = "無";
    let maxCount = 0;
    Object.entries(genreMap).forEach(([g, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenre = g;
      }
    });

    return { total, avgRating: avgRating.toFixed(1), topGenre };
  }, [movies]);

  // 篩選與排序後的電影清單
  const filteredAndSortedMovies = useMemo(() => {
    // 1. 關鍵字搜尋與類型篩選
    let result = movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === "all" || movie.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    });

    // 2. 排序
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [movies, searchQuery, selectedGenre, sortBy, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* 頂部導覽列 Header */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <div>
              <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CINE收藏庫
              </h1>
              <p className="text-xs text-slate-400">高中生 Next.js 期末專題實作</p>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-150 w-full sm:w-auto justify-center"
          >
            <span>🍿</span> 新增收藏電影
          </button>
        </div>
      </header>

      {/* 主體內容區域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* 提示訊息：告知 API 的支援度 */}
        <div className="bg-indigo-950/40 border border-indigo-800 text-indigo-300 px-4 py-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>📢 <strong>專題狀態：</strong>資料庫已完全與後端 API (GET, POST, PUT, DELETE) 串接，所有新增、修改與刪除均會永久儲存至 <code>data.json</code>。</span>
          <button onClick={fetchMovies} className="text-indigo-400 hover:text-indigo-200 font-bold underline whitespace-nowrap self-end sm:self-auto">
            🔄 重新整理資料
          </button>
        </div>

        {/* 頂部數據看板 Dashboard */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute right-4 bottom-2 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300">🎥</div>
            <p className="text-sm font-medium text-slate-400">總電影收藏量</p>
            <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">{stats.total} 部</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute right-4 bottom-2 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300">⭐</div>
            <p className="text-sm font-medium text-slate-400">平均喜愛星級</p>
            <h3 className="text-3xl font-extrabold text-yellow-400 mt-2">{stats.avgRating} / 5.0</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute right-4 bottom-2 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300">🎭</div>
            <p className="text-sm font-medium text-slate-400">最喜愛電影類型</p>
            <h3 className="text-3xl font-extrabold text-pink-400 mt-2">{stats.topGenre}</h3>
          </div>
        </section>

        {/* 搜尋、篩選與排序控制列 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto md:flex-1">
            {/* 搜尋輸入框 */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋電影片名或導演..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm outline-none transition-all placeholder:text-slate-500"
              />
            </div>
            {/* 類型篩選下拉選單 */}
            <div className="sm:w-48">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-300"
              >
                <option value="all">所有類型 (全部)</option>
                {allGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end">
            {/* 排序屬性選擇 */}
            <div className="w-36">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-300"
              >
                <option value="createdAt">新增時間</option>
                <option value="year">上映年份</option>
                <option value="rating">電影評分</option>
              </select>
            </div>
            {/* 升降冪切換按鈕 */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              title={sortOrder === "asc" ? "遞增排序" : "遞減排序"}
            >
              <span>{sortOrder === "asc" ? "⬆️" : "⬇️"}</span>
              <span className="hidden sm:inline">{sortOrder === "asc" ? "正序" : "倒序"}</span>
            </button>
          </div>
        </section>

        {/* 電影列表 Grid */}
        <section className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 mt-4">載入電影收藏中...</p>
            </div>
          ) : filteredAndSortedMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-900/30 border border-dashed border-slate-800/80 rounded-2xl text-center">
              <span className="text-5xl mb-4">🎬</span>
              <h3 className="text-xl font-semibold text-slate-300">目前沒有符合條件的電影</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                試著更換關鍵字或點擊上方「新增收藏電影」按鈕，建立你的第一部專屬電影收藏吧！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAndSortedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* 電影海報區 */}
                  <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-800/40">
                    {movie.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={movie.imageUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          // 圖片載入失敗時轉為預設海報圖樣式
                          (e.target as HTMLImageElement).style.display = "none";
                          const sibling = (e.target as HTMLImageElement).nextElementSibling;
                          if (sibling) sibling.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    {/* 預設海報（當沒有網址或載入失敗時顯示） */}
                    <div
                      className={`absolute inset-0 flex flex-col justify-between p-5 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 text-center ${
                        movie.imageUrl ? "hidden" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800/60 text-slate-300 backdrop-blur-sm">
                          {movie.year}
                        </span>
                        <span className="text-2xl">📽️</span>
                      </div>
                      <div className="my-auto px-2">
                        <h4 className="text-lg font-bold line-clamp-3 leading-snug text-indigo-200">
                          {movie.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-2">導演：{movie.director}</p>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">CINE COLLECTOR</div>
                    </div>

                    {/* 海報上方徽章（浮動顯示） */}
                    {movie.imageUrl && (
                      <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-start pointer-events-none">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-950/80 text-slate-200 backdrop-blur-sm">
                          {movie.year}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/80 text-white backdrop-blur-sm">
                          {movie.genre}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 電影資訊與說明 */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* 如果有海報，才在下方顯示標題；如果是無海報格式，標題已在海報區顯示 */}
                      {movie.imageUrl && (
                        <div className="mb-2">
                          <h4 className="text-lg font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {movie.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">導演：{movie.director}</p>
                        </div>
                      )}

                      {!movie.imageUrl && (
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {movie.genre}
                          </span>
                        </div>
                      )}

                      {/* 評分星星 */}
                      <div className="flex gap-0.5 my-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-base ${
                              i < movie.rating ? "text-yellow-400" : "text-slate-600"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      {/* 觀後心得 / 備註 */}
                      <p className="text-xs text-slate-400 leading-relaxed mt-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 min-h-[64px] line-clamp-3">
                        {movie.notes || "無填寫觀後感或備註。"}
                      </p>
                    </div>

                    {/* 操作按鈕（編輯/刪除） */}
                    <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleOpenEdit(movie)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-indigo-600 hover:text-white transition-all text-xs font-medium text-slate-300"
                      >
                        <span>✏️</span> 編輯
                      </button>
                      <button
                        onClick={() => setDeletingMovieId(movie.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-red-600 hover:text-white transition-all text-xs font-medium text-slate-300"
                      >
                        <span>🗑️</span> 刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 底部 Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto">
          <p>© {new Date().getFullYear()} CINE收藏庫 - 打造你最棒的影視筆記空間</p>
          <p className="mt-1.5 text-slate-600">本網站使用 Next.js App Router 與 Tailwind CSS 進行資料存取</p>
        </div>
      </footer>

      {/* 彈出式表單 Modal (新增/編輯電影) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal 標題區 */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">
                {editingMovie ? "✏️ 編輯收藏電影" : "🍿 新增收藏電影"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal 表單本體 */}
            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
              
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs font-medium">
                  ⚠️ {formError}
                </div>
              )}

              {/* 電影片名 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  電影片名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：全面啟動"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100"
                />
              </div>

              {/* 導演與年份二合一 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    導演 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDirector}
                    onChange={(e) => setFormDirector(e.target.value)}
                    placeholder="例如：Christopher Nolan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    上映年份 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    placeholder="例如：2010"
                    min="1888"
                    max="2100"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100"
                  />
                </div>
              </div>

              {/* 電影類型 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  電影類型 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="genreType"
                      checked={formGenreType === "preset"}
                      onChange={() => setFormGenreType("preset")}
                      className="accent-indigo-500"
                    />
                    選擇常用類型
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="genreType"
                      checked={formGenreType === "custom"}
                      onChange={() => setFormGenreType("custom")}
                      className="accent-indigo-500"
                    />
                    自訂類型名稱
                  </label>
                </div>

                {formGenreType === "preset" ? (
                  <select
                    value={formPresetGenre}
                    onChange={(e) => setFormPresetGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-300"
                  >
                    {PRESETS_GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formCustomGenre}
                    onChange={(e) => setFormCustomGenre(e.target.value)}
                    placeholder="自行輸入類型，例如：傳記、戰爭、歌舞"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100"
                  />
                )}
              </div>

              {/* 我的評分 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  個人喜愛評分 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormRating(i + 1)}
                        className="text-2xl transition-transform active:scale-90 hover:scale-110"
                      >
                        <span className={i < formRating ? "text-yellow-400" : "text-slate-600"}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold ml-2">
                    ({formRating} 星分)
                  </span>
                </div>
              </div>

              {/* 海報網址 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                  <span>海報圖片網址 (可空值)</span>
                  <span className="text-slate-500">建議使用 Unsplash 或 Imgur 圖片網址</span>
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... 或留空以使用預設海報"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100"
                />
              </div>

              {/* 觀後備註 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  觀後心得 / 備註資訊
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="寫下你的短評或觀後感..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm outline-none text-slate-100 resize-none"
                />
              </div>

              {/* 按鈕操作區 */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md transition-all"
                >
                  儲存收藏
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deletingMovieId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <span className="text-4xl block mb-3">⚠️</span>
            <h3 className="text-lg font-bold text-slate-100">確定要刪除這部電影嗎？</h3>
            <p className="text-xs text-slate-400 mt-2">
              《{movies.find((m) => m.id === deletingMovieId)?.title}》將會從你的收藏庫中永久移除，此動作無法復原。
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setDeletingMovieId(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-all"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
