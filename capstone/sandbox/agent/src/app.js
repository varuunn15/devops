import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { Server } from "socket.io";
import http from 'http';
import pty from 'node-pty';
import os from 'os';
import cors from 'cors';

const WORKING_DIR = fs.existsSync('/workspace') ? '/workspace' : path.resolve(process.cwd(), 'workspace');
if (!fs.existsSync(WORKING_DIR)) {
    try {
        fs.mkdirSync(WORKING_DIR, { recursive: true });
    } catch {
        // ignore if cannot create
    }
}

const app = express();
const httpServer = http.createServer(app);

app.use(morgan('dev'));
app.use(cors({
    methods: [ "GET", "POST", "PATCH", "DELETE" ],
    origin: "*",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: [ "GET", "POST", "PATCH" ],
    }
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Hello from sandbox agent!',
        status: 'success',
    });
});

app.get("/_status/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/_status/readyz", (req, res) => {
    res.status(200).json({ status: "ready" });
});

const defaultShell = os.platform() === 'win32' ? (process.env.COMSPEC || 'powershell.exe') : 'bash';
const shell = process.env.SHELL || defaultShell;

let ptyProcess = null;
try {
    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: WORKING_DIR,
        env: process.env
    });

    ptyProcess.onData((data) => {
        io.emit('terminal-output', data);
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`PTY process exited with code: ${exitCode}, signal: ${signal}`);
    });
} catch (err) {
    console.error('PTY spawn failed:', err.message);
}

io.on("connection", (socket) => {
    console.log("Client connected: " + socket.id);

    socket.on("terminal-input", (data) => {
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected: " + socket.id);
    });
});

/**
 * @route GET /list-files
 * @description Lists all files in the working directory and its subdirectories. Returns a JSON object with the file paths relative to the working directory. exclude directories like node_modules, .git,dist, etc.
 * - eg. {
 *     "files": [
 *         "file1.txt",
 *         "src/file2.txt",
 *         "src/subdir/file3.txt"
 *     ]
 * }
 */
app.get("/list-files", async (req, res) => {

    const listFiles = async (dir, baseDir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            // Exclude certain directories
            if (entry.isDirectory() && [ 'node_modules', '.git', 'dist' ].includes(entry.name)) {
                continue;
            }

            if (entry.isDirectory()) {
                files.push(...await listFiles(fullPath, baseDir));
            } else {
                files.push(relativePath.replace(/\\/g, '/'));
            }
        }

        return files;
    }

    try {
        const files = await listFiles(WORKING_DIR, WORKING_DIR);
        res.status(200).json({
            message: 'Files listed successfully',
            files,
        });
    } catch (err) {
        res.status(500).json({
            message: `Error listing files: ${err.message}`,
            status: 'error',
        });
    }

});


/**
 * @route GET /read-files
 * @description Reads the content of all files requested in the query parameter 'files' and returns their content as a JSON object.
 * - eg. /read-files?files=file1.txt,/src/file2.txt
 */
app.get("/read-files", async (req, res) => {

    const files = req.query.files;

    if (!files) {
        return res.status(400).json({
            message: 'No files specified in query parameter',
            status: 'error',
        });
    }

    const fileList = files.split(',');

    const results = await Promise.all(fileList.map(async (file) => {
        const cleanFile = file.startsWith('/') ? file.slice(1) : file;
        const filePath = path.join(WORKING_DIR, cleanFile);
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: content,
            }
        } catch (err) {
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: `Error reading file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File contents',
        files: results,
    });

});


/**
 * @route PATCH /update-files
 * @description Updates the content of files specified in the request body. The request body should container a property 'updates' with a JSON Array of object, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the new content for the file.
 */
app.patch("/update-files", async (req, res) => {

    const updates = req.body.updates;

    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: 'Invalid request body. Expected a JSON object with an "updates" property containing an array of file updates.',
            status: 'error',
        });
    }

    const results = await Promise.all(updates.map(async (update) => {
        const { file, content } = update;
        const cleanFile = file.startsWith('/') ? file.slice(1) : file;
        const filePath = path.join(WORKING_DIR, cleanFile);
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: 'File updated successfully',
            }
        } catch (err) {
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: `Error updating file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File update results',
        results,
    });
});


/**
 * @route POST /create-files
 * @description Creates new files with the content specified in the request body. The request body should contain a property 'files' with a JSON Array of objects, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the content for the new file.
 */
app.post("/create-files", async (req, res) => {
    const files = req.body.files;

    if (!files || !Array.isArray(files)) {
        return res.status(400).json({
            message: 'Invalid request body. Expected a JSON object with a "files" property containing an array of file objects.',
            status: 'error',
        });
    }

    const results = await Promise.all(files.map(async (fileObj) => {
        const { file, content } = fileObj;
        const cleanFile = file.startsWith('/') ? file.slice(1) : file;
        const filePath = path.join(WORKING_DIR, cleanFile);
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: 'File created successfully',
            }
        } catch (err) {
            return {
                [ '/' + path.relative(WORKING_DIR, filePath).replace(/\\/g, '/') ]: `Error creating file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File creation results',
        results,
    });
});

export default httpServer;
