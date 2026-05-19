"use client";

import dynamic from "next/dynamic";
import type { IAllProps } from "@tinymce/tinymce-react";

const TinyMCEEditor = dynamic<IAllProps>(
  () => import("@tinymce/tinymce-react").then((module) => module.Editor),
  { ssr: false },
);

interface Props {
  newDescription: string;
  setNewDescription: (desc: string) => void;
}

export default function TinyEditor({
  newDescription,
  setNewDescription,
}: Props) {
  const compressImage = (
    file: File,
    maxWidth = 1024,
    quality = 0.7,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // คำนวณอัตราส่วนเพื่อย่อขนาดไม่ให้เกิน maxWidth (แต่ยังรักษา Ratio เดิมไว้)
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context is null"));

          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };
  return (
    <TinyMCEEditor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={newDescription}
      onEditorChange={setNewDescription}
      init={{
        automatic_uploads: true,
        file_picker_types: "image",
        images_file_types: "jpg,jpeg,png,gif,webp",
        paste_data_images: true,
        plugins: [
          "anchor",
          "autolink",
          "charmap",
          "codesample",
          "emoticons",
          "link",
          "lists",
          "media",
          "searchreplace",
          "table",
          "visualblocks",
          "wordcount",
          "image",
          "code",
          "directionality",
        ],
        toolbar:
          "undo redo | formatselect fontfamily fontsize | " +
          "bold italic forecolor backcolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "removeformat | code | image | ltr rtl",
        menubar: false,
        font_size_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 30pt 36pt 48pt",
        height: "70vh",
        max_height: "70vh",
        content_style:
          "body { font-family: Arial, sans-serif; font-size: 14px; }",
        file_picker_callback: (
          callback: (url: string, meta: any) => void,
          _value: string,
          meta: any,
        ) => {
          if (meta.filetype !== "image") return;

          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
              const compressedBase64 = await compressImage(file);
              callback(compressedBase64, { title: file.name });
            } catch (error) {
              console.error("Image compression failed:", error);
              const reader = new FileReader();
              reader.onload = () =>
                callback(reader.result as string, { title: file.name });
              reader.readAsDataURL(file);
            }
          };

          input.click();
        },

        images_upload_handler: async (blobInfo: any) => {
          try {
            const file = blobInfo.blob() as File;
            const compressedBase64 = await compressImage(file);
            return compressedBase64;
          } catch (error) {
            console.error("Upload handler compression failed:", error);
            const mimeType = blobInfo.blob().type || "image/png";
            return `data:${mimeType};base64,${blobInfo.base64()}`;
          }
        },
      }}
    />
  );
}
