const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Hàm dọn dẹp tiến trình zombie đang chiếm cổng 3001
function killPort(port) {
  try {
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: "utf8" },
    );
    const lines = result.trim().split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0") {
        try {
          execSync(`taskkill /F /PID ${pid}`, { encoding: "utf8" });
          console.log(
            `[CLEANUP] Killed zombie process PID ${pid} on port ${port}`,
          );
        } catch (e) {
          // Tiến trình có thể đã tự tắt
        }
      }
    }
  } catch (e) {
    // Không có tiến trình nào đang chiếm cổng => Tốt!
    console.log(`[CLEANUP] Port ${port} is free.`);
  }
}

// Cấu hình Database cho môi trường đóng gói
if (!isDev) {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "foodiegen.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log("Production DB Path:", process.env.DATABASE_URL);

  // Khởi tạo DB nếu chưa có (Sử dụng đường dẫn đã giải nén từ ASAR)
  const baseDir = __dirname.replace("app.asar", "app.asar.unpacked");
  const templateDbPath = path.join(baseDir, "../src/api/prisma/dev.db");

  if (!fs.existsSync(dbPath) && fs.existsSync(templateDbPath)) {
    fs.copyFileSync(templateDbPath, dbPath);
    console.log("Database initialized from unpacked template:", templateDbPath);
  } else if (!fs.existsSync(dbPath)) {
    console.error("Database template NOT FOUND at:", templateDbPath);
  }
}

let mainWindow;
let apiProcess;

function startApiServer() {
  if (isDev) return Promise.resolve();

  return new Promise((resolve) => {
    console.log("[MAIN] Starting API server in standalone mode...");

    // Bước 0: Dọn dẹp tiến trình cũ đang chiếm cổng 3001
    killPort(3001);

    // ĐƯỜNG DẪN CHUẨN: Dùng process.resourcesPath cho các file đi kèm (extraResources)
    const resourcesPath = isDev ? path.join(__dirname, "..") : process.resourcesPath;
    
    // TỰ ĐỘNG KHỞI TẠO DATABASE NẾU CHƯA CÓ
    const dbPath = path.join(app.getPath("userData"), "foodiegen.db");
    const templateDbPath = path.join(resourcesPath, "prisma", "template.db");
    
    if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size < 20000) {
      console.log("[MAIN] Database missing or empty. Initializing from template...");
      if (fs.existsSync(templateDbPath)) {
        try {
          fs.copyFileSync(templateDbPath, dbPath);
          console.log("[MAIN] Database initialized successfully.");
        } catch (err) {
          console.error("[MAIN] Failed to initialize database:", err);
        }
      } else {
        console.warn("[MAIN] Template database NOT found at:", templateDbPath);
      }
    }
    
    // Thư mục gốc của API (standalone)
    const apiDir = isDev 
      ? path.join(resourcesPath, "src", "api")
      : path.join(resourcesPath, "api-server");

    // Đảm bảo thư mục public tồn tại (vì chúng ta đã loại bỏ nó khỏi bản build)
    const publicDir = path.join(apiDir, "public");
    const requiredSubDirs = ["audio", "videos", "uploads"];
    
    try {
      if (!fs.existsSync(publicDir)) {
        console.log("[MAIN] Creating missing public directory at:", publicDir);
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      requiredSubDirs.forEach(sub => {
        const subPath = path.join(publicDir, sub);
        if (!fs.existsSync(subPath)) {
          console.log(`[MAIN] Initializing subdirectory: ${sub}`);
          fs.mkdirSync(subPath, { recursive: true });
        }
      });
    } catch (err) {
      console.error("[MAIN] Failed to create public directories:", err);
    }

    // Tìm Engine Prisma
    const binEngineName = "query-engine-windows.exe";
    const resolvedPrismaEngine = path.join(resourcesPath, "prisma", binEngineName);
    const isBinary = resolvedPrismaEngine.endsWith(".exe");
    const engineType = isBinary ? "binary" : "library";

    // Tìm Sidecar (Next.js Standalone)
    const serverPath = isDev 
      ? path.join(resourcesPath, "src", "api", "node_modules", "next", "dist", "bin", "next")
      : path.join(apiDir, "server.js");

    const rootNodeModules = isDev 
      ? path.join(resourcesPath, "node_modules")
      : path.join(apiDir, "node_modules");

    const sanitizedEnv = {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3001",
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: `file:${path.join(app.getPath("userData"), "foodiegen.db")}`,
      PRISMA_CLIENT_ENGINE_TYPE: engineType,
      PRISMA_QUERY_ENGINE_BINARY: isBinary ? resolvedPrismaEngine : undefined,
      PRISMA_QUERY_ENGINE_LIBRARY: !isBinary ? resolvedPrismaEngine : undefined,
      NODE_PATH: rootNodeModules,
      ELECTRON_RUN_AS_NODE: "1",
    };

    console.log("[API STARTUP] Resources Path:", resourcesPath);
    console.log("[API STARTUP] Server Path:", serverPath);
    console.log("[API STARTUP] Engine Path:", resolvedPrismaEngine);
    console.log("[API STARTUP] Root NodeModules:", rootNodeModules);
    console.log("[API STARTUP] Database URL:", sanitizedEnv.DATABASE_URL);

    if (fs.existsSync(serverPath)) {
      apiProcess = spawn(process.execPath, [serverPath], {
        cwd: apiDir,
        env: sanitizedEnv,
        shell: false,
        windowsHide: true,
      });
    } else {
      const msg = `Không tìm thấy file server.js tại: ${serverPath}`;
      console.error("[API STARTUP]", msg);
      dialog.showErrorBox("Lỗi Khởi Động Backend", msg);
      resolve();
      return;
    }

    let apiErrorOutput = "";
    const userDataPath = app.getPath("userData");
    const apiLogPath = path.join(userDataPath, "api-server.log");

    apiProcess.on("error", (err) => {
      console.error("[API SPAWN ERROR]:", err);
      fs.appendFileSync(apiLogPath, `[SPAWN ERROR] ${new Date().toISOString()}: ${err.stack}\n`);
    });

    apiProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[API]: ${output}`);
      fs.appendFileSync(apiLogPath, `[STDOUT] ${output}`);
    });

    apiProcess.stderr.on("data", (data) => {
      const output = data.toString();
      console.error(`[API STDERR]: ${output}`);
      fs.appendFileSync(apiLogPath, `[STDERR] ${output}`);
    });
    apiProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      console.error(`[API ERROR]: ${msg}`);
      apiErrorOutput += msg;
      try { fs.appendFileSync(apiLogPath, `[${new Date().toISOString()}] ${msg}`); } catch (e) {}
    });

    apiProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[API] Exited with code ${code}`);
      }
    });

    // Vòng lặp kiểm tra cổng 3001 cho đến khi sẵn sàng
    let checkAttempts = 0;
    const maxAttempts = 30;

    const checkServer = () => {
      http
        .get("http://127.0.0.1:3001/api/projects/draft", (res) => {
          if (res.statusCode === 200 || res.statusCode === 405) { // 405 is fine for GET on POST endp
            console.log("[MAIN] API Server is ready!");
            resolve();
          } else {
            console.log(`[MAIN] API Server returned ${res.statusCode}, retrying...`);
            checkAttempts++;
            if (checkAttempts < maxAttempts) setTimeout(checkServer, 1000);
            else resolve();
          }
        })
        .on("error", () => {
          checkAttempts++;
          if (checkAttempts < maxAttempts) setTimeout(checkServer, 1000);
          else {
            console.error("[MAIN] API Server failed to start.");
            resolve();
          }
        });
    };

    setTimeout(checkServer, 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "..", "src", "web", "public", "logo.png"),
    title: "FoodieGen - AI Video Generator",
  });

  // Trong chế độ dev, đợi Next.js sẵn sàng rồi load
  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:3000");
    // mainWindow.webContents.openDevTools();
  } else {
    // Trong chế độ production, load file tĩnh (cần cấu hình next export)
    // Hoặc chạy một web server nhỏ bên trong Electron
    mainWindow.loadFile(path.join(__dirname, "../src/web/out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Mở DevTools bằng phím F12 để dễ dàng debug trong bản build
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyDown") {
      mainWindow.webContents.openDevTools();
    }
  });
}

app.on("ready", async () => {
  await startApiServer();
  createWindow();

  // --- IPC: Native Save As Download ---
  ipcMain.handle('download-file', async (event, url, defaultFileName) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Lưu video',
        defaultPath: defaultFileName || 'foodiegen_video.mp4',
        filters: [
          { name: 'Video', extensions: ['mp4'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (canceled || !filePath) return { success: false, reason: 'canceled' };

      // Fetch file từ API server
      const response = await new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? require('https') : require('http');
        lib.get(url, (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });

      fs.writeFileSync(filePath, response);
      return { success: true, filePath };
    } catch (err) {
      console.error('[IPC-DOWNLOAD] Error:', err.message);
      return { success: false, reason: err.message };
    }
  });

  // Menu tùy chỉnh
  const template = [
    {
      label: "Ứng dụng",
      submenu: [
        { label: "Làm mới", role: "reload" },
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Chỉnh sửa",
      submenu: [
        { label: "Hoàn tác", role: "undo" },
        { label: "Làm lại", role: "redo" },
        { type: "separator" },
        { label: "Cắt", role: "cut" },
        { label: "Sao chép", role: "copy" },
        { label: "Dán", role: "paste" },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

function cleanupAndQuit() {
  if (apiProcess) {
    apiProcess.kill("SIGTERM");
    apiProcess = null;
  }
  // Đảm bảo cổng 3001 được giải phóng hoàn toàn
  killPort(3001);
}

app.on("window-all-closed", () => {
  cleanupAndQuit();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  cleanupAndQuit();
});

process.on("exit", () => {
  cleanupAndQuit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
