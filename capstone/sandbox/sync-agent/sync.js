import "dotenv/config";
import chokidar from 'chokidar';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const s3Config = {
    region: process.env.AWS_REGION || "ap-southeast-1"
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

// The bucket can live in a different region than the workstation's default.
// Follow S3's region redirect so HeadBucket/List/Get/Put use the bucket region.
const s3Client = new S3Client({ ...s3Config, followRegionRedirects: true });

const projectId = process.env.PROJECT_ID;
const bucketName = process.env.BUCKET_NAME || "agentspace-688928000248-ap-south-1-an";
const localDirectory = '/workspace';

async function checkS3ForFiles() {
    console.log(`Checking S3 for existing files in project: ${projectId}`);
    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${projectId}/`
    });
    const listResponse = await s3Client.send(listCommand);
    return listResponse.Contents || [];
}

async function downloadFilesFromS3(s3Objects) {
    console.log("Found existing files in S3. Syncing to local directory...");
    for (const file of s3Objects) {
        // Skip if it is a directory placeholder
        if (file.Key.endsWith('/')) continue;

        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: file.Key
        });
        const getResponse = await s3Client.send(getCommand);

        const relativePath = file.Key.replace(`${projectId}/`, '');
        const localFilePath = path.join(localDirectory, relativePath);

        // Ensure the local directory structure exists
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

        const writeStream = fs.createWriteStream(localFilePath);
        await pipeline(getResponse.Body, writeStream);

        console.log(`Downloaded ${file.Key} to ${localFilePath}`);
    }
}

async function uploadFileToS3(filePath) {
    try {
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            return;
        }

        const relativePath = path.relative(localDirectory, filePath);

        if (filePath.includes('node_modules') || filePath.includes('.env') || filePath.includes('.git')) {
            return; // Skip syncing node_modules, git and .env files
        }

        const fileContent = fs.readFileSync(filePath);

        // Files will have the prefix of projectId
        const s3Key = `${projectId}/${relativePath}`.replace(/\\/g, '/');

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent
        });

        await s3Client.send(command);
        console.log(`Successfully synced ${filePath} to s3://${bucketName}/${s3Key}`);
    } catch (err) {
        console.error(`Error syncing ${filePath} to S3:`, err);
    }
}

function startWatcher(hasFiles) {
    console.log("Starting chokidar watch...");
    chokidar.watch(localDirectory, {
        ignored: [
            /(^|[\/\\])\../, // ignore dotfiles
            /node_modules/,  // ignore node_modules completely
             /\.env/          // ignore .env files
        ],
        persistent: true,
        ignoreInitial: hasFiles // if S3 is empty (hasFiles is false), upload all existing local files
    }).on('all', async (event, filePath) => {
        if (event === 'add' || event === 'change') {
            if (filePath.includes('node_modules') || filePath.includes('.env')) {
                return;
            }
            await uploadFileToS3(filePath);
        }
    });
}

async function init() {
    if (!projectId) {
        console.warn("PROJECT_ID environment variable is missing. Sync agent will not start.");
        return;
    }

    try {
        const s3Objects = await checkS3ForFiles();
        const hasFiles = s3Objects.length > 0;

        if (hasFiles) {
            await downloadFilesFromS3(s3Objects);
        } else {
            console.log("No files found in S3. Local files will be synced to S3 automatically.");
        }

        startWatcher(hasFiles);
    } catch (error) {
        console.error("Error during initialization:", error);
        // S3 is an optional persistence layer. Keep the shared workspace usable
        // and the pod healthy when credentials or the bucket are unavailable.
        startWatcher(false);
    }
}

init();
