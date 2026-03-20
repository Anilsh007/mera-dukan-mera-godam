// lib/drive.service.ts
import { db } from "@/app/lib/db";

const FILE_NAME = "stock_data_backup.json";

export async function syncToDrive(accessToken: string) {
  if (!accessToken) {
    console.error("❌ No access token");
    return;
  }

  try {
    const allProducts = await db.products.toArray();
    const fileContent = JSON.stringify(allProducts);

    // ✅ FIX: encode query
    const query = encodeURIComponent(
      `name='${FILE_NAME}' and trashed=false`
    );

    const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error("❌ Drive search failed:", await searchResponse.text());
      return;
    }

    const { files } = await searchResponse.json();

    // ✅ UPDATE FILE
    if (files?.length > 0) {
      const fileId = files[0].id;

      const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: fileContent,
        }
      );

      if (!updateResponse.ok) {
        console.error("❌ Update failed:", await updateResponse.text());
        return;
      }

      console.log("✅ Drive backup updated");
    }

    // ✅ CREATE FILE
    else {
      const metadata = {
        name: FILE_NAME,
        mimeType: "application/json",
      };

      const formData = new FormData();

      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );

      formData.append(
        "file",
        new Blob([fileContent], { type: "application/json" })
      );

      const createResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!createResponse.ok) {
        console.error("❌ Create failed:", await createResponse.text());
        return;
      }

      console.log("✅ New backup created");
    }
  } catch (error) {
    console.error("❌ Sync error:", error);
  }
}