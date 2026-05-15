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

          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              callback(reader.result as string, { title: file.name });
            };
            reader.readAsDataURL(file);
          };

          input.click();
        },
        images_upload_handler: async (blobInfo: any) => {
          const mimeType = blobInfo.blob().type || "image/png";
          return `data:${mimeType};base64,${blobInfo.base64()}`;
        },
      }}
    />
  );
}
