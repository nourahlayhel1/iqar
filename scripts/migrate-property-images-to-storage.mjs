import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import process from "process";

const bucket = "property-images";
const rootDir = process.cwd();
const propertiesFile = path.join(rootDir, "data", "properties.json");
const dryRun = process.argv.includes("--dry-run");
const includeRemote = process.argv.includes("--include-remote");

const contentTypeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".avif", "image/avif"]
]);

function loadDotenv(filePath) {
  return fs
    .readFile(filePath, "utf8")
    .then((content) => {
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    })
    .catch(() => undefined);
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "property";
}

function normalizeLocalPath(imageUrl) {
  if (!imageUrl.startsWith("/assets/")) return undefined;
  return path.join(rootDir, "public", ...imageUrl.split("/").filter(Boolean));
}

function isStorageUrl(imageUrl, supabaseUrl) {
  return imageUrl.includes(`${supabaseUrl}/storage/v1/object/public/${bucket}/`);
}

function getExtensionFromUrl(imageUrl) {
  try {
    const parsed = new URL(imageUrl, "http://local.test");
    return path.extname(parsed.pathname).toLowerCase();
  } catch {
    return path.extname(imageUrl).toLowerCase();
  }
}

function storagePathFor(property, imageUrl, index, isCover) {
  const extension = getExtensionFromUrl(imageUrl) || ".jpg";
  const baseName = isCover ? "cover" : `photo-${index + 1}`;
  return `${slugify(property.title)}/${baseName}${extension}`;
}

async function readLocalProperties() {
  const content = await fs.readFile(propertiesFile, "utf8");
  return JSON.parse(content);
}

async function writeLocalProperties(properties) {
  if (dryRun) return;
  await fs.writeFile(propertiesFile, `${JSON.stringify(properties, null, 2)}\n`, "utf8");
}

async function fetchSupabaseProperties(supabase) {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, cover_image, property_images(image_url, sort_order)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function readImageBytes(imageUrl) {
  const localPath = normalizeLocalPath(imageUrl);
  if (localPath) {
    const bytes = await fs.readFile(localPath);
    return {
      bytes,
      contentType: contentTypeByExtension.get(path.extname(localPath).toLowerCase()) ?? "application/octet-stream"
    };
  }

  if (!includeRemote || !/^https?:\/\//i.test(imageUrl)) return undefined;

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download ${imageUrl}: ${response.status} ${response.statusText}`);

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type")?.split(";")[0] || "image/jpeg"
  };
}

async function uploadImage(supabase, property, imageUrl, index, isCover) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!imageUrl || isStorageUrl(imageUrl, supabaseUrl)) return imageUrl;

  const image = await readImageBytes(imageUrl);
  if (!image) return imageUrl;

  const targetPath = storagePathFor(property, imageUrl, index, isCover);
  if (!dryRun) {
    const { error } = await supabase.storage.from(bucket).upload(targetPath, image.bytes, {
      contentType: image.contentType,
      upsert: true
    });

    if (error) throw new Error(`Failed to upload ${imageUrl}: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(targetPath);
  return data.publicUrl;
}

async function migratePropertyImages(supabase, property) {
  const imageRows = (property.property_images ?? [])
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order);
  const originalImages = imageRows.map((row) => row.image_url);
  const originalCover = property.cover_image || originalImages[0] || "";
  const nextImages = [];
  const urlMap = new Map();

  for (let index = 0; index < originalImages.length; index += 1) {
    const imageUrl = originalImages[index];
    const nextUrl = await uploadImage(supabase, property, imageUrl, index, imageUrl === originalCover);
    nextImages.push(nextUrl);
    urlMap.set(imageUrl, nextUrl);
  }

  const nextCover = originalCover ? urlMap.get(originalCover) ?? await uploadImage(supabase, property, originalCover, 0, true) : "";

  const changed =
    nextCover !== originalCover ||
    nextImages.length !== originalImages.length ||
    nextImages.some((imageUrl, index) => imageUrl !== originalImages[index]);

  if (!changed) return { changed: false, nextImages, nextCover };

  if (!dryRun) {
    const { error: propertyError } = await supabase
      .from("properties")
      .update({ cover_image: nextCover || null, updated_at: new Date().toISOString() })
      .eq("id", property.id);

    if (propertyError) throw new Error(propertyError.message);

    const { error: deleteError } = await supabase.from("property_images").delete().eq("property_id", property.id);
    if (deleteError) throw new Error(deleteError.message);

    if (nextImages.length) {
      const { error: insertError } = await supabase.from("property_images").insert(
        nextImages.map((imageUrl, index) => ({
          property_id: property.id,
          image_url: imageUrl,
          sort_order: index
        }))
      );
      if (insertError) throw new Error(insertError.message);
    }
  }

  return { changed: true, nextImages, nextCover };
}

async function migrateLocalJson(supabase, properties) {
  let changedCount = 0;

  for (const property of properties) {
    const originalImages = property.images ?? [];
    const originalCover = property.coverImage || originalImages[0] || "";
    const nextImages = [];
    const urlMap = new Map();

    for (let index = 0; index < originalImages.length; index += 1) {
      const imageUrl = originalImages[index];
      const nextUrl = await uploadImage(supabase, property, imageUrl, index, imageUrl === originalCover);
      nextImages.push(nextUrl);
      urlMap.set(imageUrl, nextUrl);
    }

    const nextCover = originalCover ? urlMap.get(originalCover) ?? await uploadImage(supabase, property, originalCover, 0, true) : undefined;
    const changed =
      nextCover !== property.coverImage ||
      nextImages.length !== originalImages.length ||
      nextImages.some((imageUrl, index) => imageUrl !== originalImages[index]);

    if (changed) {
      property.images = nextImages;
      property.coverImage = nextCover;
      property.updatedAt = new Date().toISOString();
      changedCount += 1;
    }
  }

  await writeLocalProperties(properties);
  return changedCount;
}

async function main() {
  await loadDotenv(path.join(rootDir, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and Supabase key.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  if (!dryRun && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  }

  const localProperties = await readLocalProperties();
  const remoteProperties = await fetchSupabaseProperties(supabase);
  let remoteChanged = 0;

  for (const property of remoteProperties) {
    const result = await migratePropertyImages(supabase, property);
    if (result.changed) remoteChanged += 1;
  }

  const localChanged = await migrateLocalJson(supabase, localProperties);

  console.log(
    JSON.stringify(
      {
        dryRun,
        includeRemote,
        bucket,
        remotePropertiesChecked: remoteProperties.length,
        remotePropertiesChanged: remoteChanged,
        localPropertiesChecked: localProperties.length,
        localPropertiesChanged: localChanged
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
