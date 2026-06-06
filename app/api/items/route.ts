import fs from "fs/promises";
import path from "path";
import { Movie } from "@/types";

// 定義儲存檔案的路徑 (處理為根目錄下的 data/data.json)
const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "data.json");

// 確保目錄與檔案存在，並寫入初始預設資料
async function ensureFileExists() {
  try {
    // 1. 確保 data 資料夾存在，若不存在則建立它
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // 2. 確保 data.json 檔案存在，若不存在則建立並寫入初始預設電影
    try {
      await fs.access(FILE_PATH);
    } catch {
      const initialMovies: Movie[] = [
        {
          id: "movie-1",
          title: "全面啟動",
          director: "克里斯多福·諾蘭",
          genre: "科幻",
          year: 2010,
          rating: 5,
          imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
          notes: "夢境與現實的交錯，經典的陀螺結局令人回味無窮，配樂與剪輯堪稱神級水準！",
          createdAt: new Date().toISOString(),
        },
        {
          id: "movie-2",
          title: "神隱少女",
          director: "宮崎駿",
          genre: "動畫",
          year: 2001,
          rating: 5,
          imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
          notes: "宮崎駿大師的巔峰之作，長大後再看才發現裡面隱喻了好多社會現實，千尋的成長非常動人。",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "movie-3",
          title: "星際效應",
          director: "克里斯多福·諾蘭",
          genre: "科幻",
          year: 2014,
          rating: 5,
          imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
          notes: "「愛能超越時空與維度。」不論是科學設定還是父女情感都非常震撼人心，淚水止不住。",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        }
      ];
      // 將初始電影清單序列化後寫入檔案
      await fs.writeFile(FILE_PATH, JSON.stringify(initialMovies, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("無法確保資料目錄或檔案存在:", error);
  }
}

// 1. GET 方法：讀取 data.json 中的所有電影
export async function GET() {
  await ensureFileExists();
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    const movies: Movie[] = JSON.parse(data);
    return Response.json(movies);
  } catch (error) {
    return Response.json(
      { error: "伺服器內部錯誤，讀取電影 JSON 資料失敗" },
      { status: 500 }
    );
  }
}

// 2. POST 方法：將新電影寫入 data.json 檔案
export async function POST(request: Request) {
  await ensureFileExists();
  try {
    const body = await request.json();
    
    // 基礎欄位驗證
    if (!body.title || !body.director || !body.genre || !body.year || !body.rating) {
      return Response.json(
        { error: "新增失敗，缺少必要的電影資訊 (例如：片名、導演、類型、年份、星等)" },
        { status: 400 }
      );
    }

    // 讀取現有電影資料
    const fileData = await fs.readFile(FILE_PATH, "utf-8");
    const movies: Movie[] = JSON.parse(fileData);

    // 建立新電影物件
    const newMovie: Movie = {
      id: `movie-${Date.now()}`,
      title: body.title.trim(),
      director: body.director.trim(),
      genre: body.genre.trim(),
      year: Number(body.year),
      rating: Number(body.rating),
      imageUrl: body.imageUrl?.trim() || "",
      notes: body.notes?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    // 將新電影插入到最前方
    movies.unshift(newMovie);

    // 寫入更新後的電影資料回 JSON 檔案
    await fs.writeFile(FILE_PATH, JSON.stringify(movies, null, 2), "utf-8");

    // 回傳成功狀態與新建立的電影
    return Response.json(newMovie, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "無法解析請求內容或寫入 JSON 檔案失敗" },
      { status: 400 }
    );
  }
}

// 3. PUT 方法：修改已存在的電影資料
export async function PUT(request: Request) {
  await ensureFileExists();
  try {
    const body = await request.json();
    
    if (!body.id || !body.title || !body.director || !body.genre || !body.year || !body.rating) {
      return Response.json(
        { error: "修改失敗，缺少必要的電影資訊" },
        { status: 400 }
      );
    }

    // 讀取現有資料
    const fileData = await fs.readFile(FILE_PATH, "utf-8");
    const movies: Movie[] = JSON.parse(fileData);

    // 尋找並更新對應的電影
    let movieFound = false;
    const updatedMovies = movies.map((m) => {
      if (m.id === body.id) {
        movieFound = true;
        return {
          ...m,
          title: body.title.trim(),
          director: body.director.trim(),
          genre: body.genre.trim(),
          year: Number(body.year),
          rating: Number(body.rating),
          imageUrl: body.imageUrl?.trim() || "",
          notes: body.notes?.trim() || "",
        };
      }
      return m;
    });

    if (!movieFound) {
      return Response.json({ error: "找不到該筆電影資料" }, { status: 404 });
    }

    // 寫入更新後的電影資料
    await fs.writeFile(FILE_PATH, JSON.stringify(updatedMovies, null, 2), "utf-8");

    const updatedMovie = updatedMovies.find((m) => m.id === body.id);
    return Response.json(updatedMovie);
  } catch (error) {
    return Response.json(
      { error: "修改電影失敗或寫入 JSON 檔案失敗" },
      { status: 500 }
    );
  }
}

// 4. DELETE 方法：刪除指定 ID 的電影
export async function DELETE(request: Request) {
  await ensureFileExists();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "缺少電影 ID 參數" }, { status: 400 });
    }

    // 讀取現有資料
    const fileData = await fs.readFile(FILE_PATH, "utf-8");
    const movies: Movie[] = JSON.parse(fileData);

    // 檢查電影是否存在
    const movieExists = movies.some((m) => m.id === id);
    if (!movieExists) {
      return Response.json({ error: "找不到該筆電影資料" }, { status: 404 });
    }

    // 過濾掉該 ID 的電影
    const updatedMovies = movies.filter((m) => m.id !== id);

    // 寫入更新後的電影資料
    await fs.writeFile(FILE_PATH, JSON.stringify(updatedMovies, null, 2), "utf-8");

    return Response.json({ success: true, message: "電影刪除成功" });
  } catch (error) {
    return Response.json(
      { error: "刪除電影失敗或寫入 JSON 檔案失敗" },
      { status: 500 }
    );
  }
}
