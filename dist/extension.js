"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("frontmatterStudio.openEditor", () => openEditor(context)), vscode.commands.registerCommand("frontmatterStudio.validate", () => validate()));
}
function currentDocument() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "markdown") {
        vscode.window.showWarningMessage("Open a Markdown file first.");
        return;
    }
    return editor.document;
}
/**
 * Parse Markdown frontmatter.
 *
 * JSON_SCHEMA prevents js-yaml from converting YAML dates
 * into JavaScript Date objects. Dates remain strings.
 */
function parseDocument(doc) {
    const text = doc.getText();
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
        return {
            metadata: {},
            body: text
        };
    }
    const loaded = yaml.load(match[1], {
        schema: yaml.JSON_SCHEMA
    });
    const metadata = loaded && typeof loaded === "object"
        ? loaded
        : {};
    // Markdown stores thumbnail paths with a leading slash.
    // The editor works with project-relative paths instead.
    if (typeof metadata.thumbnail === "string") {
        metadata.thumbnail = metadata.thumbnail.replace(/^\/+/, "");
    }
    return {
        metadata,
        body: match[2]
    };
}
/**
 * Serialize metadata back into Markdown frontmatter.
 *
 * Tags are deliberately written as:
 *
 * tags: ["اسلام","مذہب","دین"]
 */
function serialize(metadata, body) {
    const metadataWithoutTags = {
        ...metadata,
        // Markdown/web output requires a leading slash.
        ...(typeof metadata.thumbnail === "string" && metadata.thumbnail.trim()
            ? {
                thumbnail: `/${metadata.thumbnail.replace(/^\/+/, "")}`
            }
            : {})
    };
    const tags = Array.isArray(metadataWithoutTags.tags)
        ? metadataWithoutTags.tags
            .map(String)
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
    delete metadataWithoutTags.tags;
    let front = yaml
        .dump(metadataWithoutTags, {
        noRefs: true,
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false
    })
        .trimEnd();
    if (tags.length > 0) {
        const tagsYaml = `tags: ${JSON.stringify(tags)}`;
        front = front
            ? `${front}\n${tagsYaml}`
            : tagsYaml;
    }
    return `---\n${front}\n---\n${body.startsWith("\n")
        ? body.slice(1)
        : body}`;
}
/**
 * Convert a YAML date value to the format required
 * by <input type="date">.
 */
function dateInputValue(value) {
    if (!value) {
        return "";
    }
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}
/**
 * Escape HTML.
 */
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}
/**
 * Get the workspace containing the document.
 */
function workspaceRootForDocument(doc) {
    return vscode.workspace.getWorkspaceFolder(doc.uri)?.uri;
}
/**
 * Check whether a file is inside a workspace.
 */
function isInsideWorkspace(fileUri, workspaceRoot) {
    const relative = path.relative(workspaceRoot.fsPath, fileUri.fsPath);
    return (relative === "" ||
        (!relative.startsWith("..") &&
            !path.isAbsolute(relative)));
}
/**
 * Convert a stored thumbnail path to a webview URI.
 */
function thumbnailPreviewUri(doc, thumbnail, webview) {
    if (!thumbnail) {
        return "";
    }
    const value = String(thumbnail);
    try {
        let fileUri;
        if (value.startsWith("file://")) {
            fileUri = vscode.Uri.parse(value);
        }
        else {
            const workspaceRoot = workspaceRootForDocument(doc);
            if (workspaceRoot) {
                fileUri = vscode.Uri.file(path.resolve(workspaceRoot.fsPath, value));
            }
            else {
                fileUri = vscode.Uri.file(path.resolve(path.dirname(doc.uri.fsPath), value));
            }
        }
        return webview
            .asWebviewUri(fileUri)
            .toString();
    }
    catch {
        return "";
    }
}
/**
 * Open the Frontmatter Studio editor.
 *
 * IMPORTANT:
 * The document URI is captured here and is used for the
 * lifetime of the webview. We do NOT depend on the active
 * Markdown editor after this point.
 */
async function openEditor(context) {
    const sourceDocument = currentDocument();
    if (!sourceDocument) {
        return;
    }
    const documentUri = sourceDocument.uri;
    const workspaceRoot = workspaceRootForDocument(sourceDocument);
    const localResourceRoots = [];
    if (workspaceRoot) {
        localResourceRoots.push(workspaceRoot);
    }
    localResourceRoots.push(vscode.Uri.file(path.dirname(documentUri.fsPath)));
    const fileName = path.basename(documentUri.fsPath);
    const panel = vscode.window.createWebviewPanel("frontmatterStudio", `Frontmatter Studio — ${fileName}`, vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots
    });
    const { metadata } = parseDocument(sourceDocument);
    const previewUri = thumbnailPreviewUri(sourceDocument, metadata.thumbnail, panel.webview);
    panel.webview.html = html(panel.webview, metadata, previewUri, fileName);
    panel.webview.onDidReceiveMessage(async (message) => {
        /*
         * SAVE
         *
         * Reopen the original Markdown document
         * if it has been closed.
         */
        if (message.type === "save") {
            try {
                const doc = await vscode.workspace
                    .openTextDocument(documentUri);
                const parsed = parseDocument(doc);
                const text = serialize(message.metadata, parsed.body);
                const edit = new vscode.WorkspaceEdit();
                edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), text);
                const applied = await vscode.workspace.applyEdit(edit);
                if (!applied) {
                    throw new Error("VS Code could not apply the changes.");
                }
                await doc.save();
                vscode.window.showInformationMessage(`Frontmatter saved to ${fileName}.`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Unable to save ${fileName}: ${error instanceof Error
                    ? error.message
                    : String(error)}`);
            }
        }
        /*
         * VALIDATE
         *
         * Validate the specific Markdown document
         * associated with this panel.
         */
        if (message.type === "validateDocument") {
            await validateDocument(documentUri);
        }
        /*
         * THUMBNAIL PICKER
         */
        if (message.type === "pickThumbnail") {
            const defaultUri = workspaceRoot ??
                vscode.Uri.file(path.dirname(documentUri.fsPath));
            const result = await vscode.window.showOpenDialog({
                defaultUri,
                canSelectMany: false,
                canSelectFiles: true,
                canSelectFolders: false,
                openLabel: "Select Thumbnail",
                filters: {
                    Images: [
                        "png",
                        "jpg",
                        "jpeg",
                        "webp",
                        "gif",
                        "svg"
                    ]
                }
            });
            if (!result ||
                result.length === 0) {
                return;
            }
            const selected = result[0];
            /*
             * When a workspace exists, require
             * the thumbnail to live inside it.
             */
            if (workspaceRoot &&
                !isInsideWorkspace(selected, workspaceRoot)) {
                vscode.window.showWarningMessage("Please select an image inside the current workspace.");
                return;
            }
            let relativePath;
            if (workspaceRoot) {
                relativePath =
                    path.relative(workspaceRoot.fsPath, selected.fsPath);
            }
            else {
                relativePath =
                    path.relative(path.dirname(documentUri.fsPath), selected.fsPath);
            }
            relativePath = relativePath
                .replace(/\\/g, "/")
                .replace(/^\/+/, "");
            const preview = panel.webview
                .asWebviewUri(selected)
                .toString();
            panel.webview.postMessage({
                type: "thumbnailSelected",
                path: relativePath,
                preview
            });
        }
    }, undefined, context.subscriptions);
}
/**
 * Validate the currently active Markdown document.
 *
 * This remains available for the Command Palette.
 */
async function validate() {
    const doc = currentDocument();
    if (!doc) {
        return;
    }
    await validateDocument(doc.uri);
}
/**
 * Validate a specific Markdown document by URI.
 */
async function validateDocument(documentUri) {
    try {
        const doc = await vscode.workspace
            .openTextDocument(documentUri);
        const { metadata } = parseDocument(doc);
        if (!metadata.title) {
            throw new Error("Missing title");
        }
        if (metadata.tags &&
            !Array.isArray(metadata.tags)) {
            throw new Error("Tags must be an array");
        }
        if (metadata.date &&
            !/^\d{4}-\d{2}-\d{2}$/.test(String(metadata.date))) {
            throw new Error("Date must be YYYY-MM-DD");
        }
        vscode.window.showInformationMessage(`Frontmatter is valid: ${path.basename(documentUri.fsPath)}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Frontmatter error: ${error instanceof Error
            ? error.message
            : String(error)}`);
    }
}
/**
 * Generate the webview UI.
 */
function html(webview, metadata, initialThumbnailPreview, fileName) {
    const tags = Array.isArray(metadata.tags)
        ? metadata.tags.join(", ")
        : "";
    const fields = [
        ["site", "Site", "text"],
        ["title", "Title", "text"],
        ["date", "Date", "date"],
        [
            "description",
            "Description",
            "textarea"
        ],
        [
            "tags",
            "Tags (comma-separated)",
            "text"
        ],
        ["type", "Type", "text"],
        ["pdf", "PDF", "text"],
        [
            "thumbnail",
            "Thumbnail",
            "text"
        ],
        ["cover", "Cover", "text"],
        [
            "coverAlt",
            "Cover alt",
            "text"
        ]
    ];
    const controls = fields
        .map(([key, label, type]) => {
        /*
         * THUMBNAIL
         */
        if (key === "thumbnail") {
            return `
              <label>
                ${label}

                <div class="thumbnail-row">
                  <input
                    id="thumbnail"
                    type="text"
                    dir="ltr"
                    value="${escapeHtml(metadata.thumbnail)}"
                    placeholder="Select an image"
                  >

                  <button
                    type="button"
                    id="chooseThumbnail"
                    class="secondary"
                  >
                    Choose Image
                  </button>
                </div>

                <div
                  id="thumbnailPreview"
                  class="thumbnail-preview"
                >
                  ${initialThumbnailPreview
                ? `
                        <img
                          src="${escapeHtml(initialThumbnailPreview)}"
                          alt="Thumbnail preview"
                        >
                      `
                : `
                        <span>
                          No image selected
                        </span>
                      `}
                </div>
              </label>
            `;
        }
        /*
         * TEXTAREA
         */
        if (type === "textarea") {
            return `
              <label>
                ${label}

                <textarea
                  id="${key}"
                  dir="auto"
                  data-rtl
                >${escapeHtml(metadata[key])}</textarea>
              </label>
            `;
        }
        /*
         * NORMAL INPUT
         */
        const value = key === "tags"
            ? tags
            : key === "date"
                ? dateInputValue(metadata[key])
                : metadata[key];
        return `
            <label>
              ${label}

              <input
                id="${key}"
                type="${type}"
                dir="${type === "date"
            ? "ltr"
            : "auto"}"
                value="${escapeHtml(value)}"
                ${type !== "date"
            ? "data-rtl"
            : ""}
              >
            </label>
          `;
    })
        .join("");
    return `<!doctype html>
<html>

<head>
  <meta charset="UTF-8">

  <style>
    body {
      font-family:
        var(--vscode-font-family);

      padding: 24px;

      max-width: 760px;

      margin: auto;
    }

    h1 {
      font-size: 22px;

      margin-bottom: 4px;
    }

    .document-name {
      color:
        var(--vscode-descriptionForeground);

      font-size: 13px;

      margin-bottom: 28px;

      direction: ltr;

      text-align: left;
    }

    label {
      display: block;

      margin: 16px 0;

      font-weight: 600;
    }

    input,
    textarea {
      display: block;

      width: 100%;

      box-sizing: border-box;

      margin-top: 6px;

      padding: 9px 10px;

      background:
        var(--vscode-input-background);

      color:
        var(--vscode-input-foreground);

      border:
        1px solid
        var(--vscode-input-border);

      border-radius: 4px;

      font-family:
        var(--vscode-font-family);

      font-size: 14px;
    }

    input[type="date"] {
      direction: ltr;

      text-align: left;

      cursor: pointer;
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
    }

    textarea {
      min-height: 90px;

      resize: vertical;
    }

    /*
     * RTL support.
     */
    [data-rtl].rtl {
      direction: rtl;

      text-align: right;

      unicode-bidi: plaintext;
    }

    [data-rtl].ltr {
      direction: ltr;

      text-align: left;

      unicode-bidi: plaintext;
    }

    .row {
      display: flex;

      gap: 10px;

      align-items: center;
    }

    .thumbnail-row {
      display: flex;

      gap: 8px;

      align-items: stretch;
    }

    .thumbnail-row input {
      flex: 1;

      min-width: 0;
    }

    button {
      padding: 9px 16px;

      cursor: pointer;

      border:
        1px solid
        var(--vscode-button-border);

      border-radius: 4px;

      background:
        var(--vscode-button-background);

      color:
        var(--vscode-button-foreground);
    }

    button:hover {
      background:
        var(
          --vscode-button-hoverBackground
        );
    }

    button.secondary {
      white-space: nowrap;

      margin-top: 6px;
    }

    .actions {
      display: flex;

      gap: 10px;

      margin-top: 24px;
    }

    .thumbnail-preview {
      margin-top: 10px;

      min-height: 120px;

      display: flex;

      align-items: center;

      justify-content: center;

      background:
        var(
          --vscode-textCodeBlock-background
        );

      border:
        1px solid
        var(--vscode-input-border);

      border-radius: 4px;

      overflow: hidden;

      color:
        var(
          --vscode-descriptionForeground
        );
    }

    .thumbnail-preview img {
      display: block;

      max-width: 100%;

      max-height: 220px;

      object-fit: contain;
    }

    .thumbnail-preview span {
      padding: 20px;
    }
  </style>
</head>

<body>

  <h1>
    Frontmatter Studio
  </h1>

  <div class="document-name">
    ${escapeHtml(fileName)}
  </div>

  ${controls}

  <label class="row">
    Featured

    <input
      id="featured"
      type="checkbox"
      ${metadata.featured
        ? "checked"
        : ""}
    >
  </label>

  <div class="actions">

    <button id="save">
      Save
    </button>

    <button id="validate">
      Validate
    </button>

  </div>

  <script>

    const vscode =
      acquireVsCodeApi();

    const ids =
      ${JSON.stringify(fields
        .filter(([key]) => key !==
        "thumbnail")
        .map(([key]) => key))};

    /*
     * Detect Arabic, Urdu, Persian
     * and Hebrew characters.
     */
    function containsRTL(text) {
      return /[\\u0590-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFF]/.test(
        text
      );
    }

    function updateDirection(
      element
    ) {
      if (!element) {
        return;
      }

      if (
        containsRTL(
          element.value
        )
      ) {
        element.classList.add(
          "rtl"
        );

        element.classList.remove(
          "ltr"
        );
      } else {
        element.classList.add(
          "ltr"
        );

        element.classList.remove(
          "rtl"
        );
      }
    }

    document
      .querySelectorAll(
        "[data-rtl]"
      )
      .forEach(
        (element) => {

          updateDirection(
            element
          );

          element.addEventListener(
            "input",
            () => {
              updateDirection(
                element
              );
            }
          );
        }
      );

    /*
     * Thumbnail picker.
     */
    const thumbnailInput =
      document.getElementById(
        "thumbnail"
      );

    const thumbnailPreview =
      document.getElementById(
        "thumbnailPreview"
      );

    document
      .getElementById(
        "chooseThumbnail"
      )
      .addEventListener(
        "click",
        () => {

          vscode.postMessage({
            type:
              "pickThumbnail"
          });

        }
      );

    function showThumbnail(
      path,
      preview
    ) {

      thumbnailInput.value =
        path;

      thumbnailPreview.innerHTML =
        "";

      const image =
        document.createElement(
          "img"
        );

      image.src =
        preview;

      image.alt =
        "Thumbnail preview";

      image.onerror =
        () => {
          thumbnailPreview.innerHTML =
            "<span>Preview unavailable</span>";
        };

      thumbnailPreview.appendChild(
        image
      );
    }

    window.addEventListener(
      "message",
      (event) => {

        const message =
          event.data;

        if (
          message.type ===
          "thumbnailSelected"
        ) {

          showThumbnail(
            message.path,
            message.preview
          );

        }

      }
    );

    /*
     * SAVE
     */
    document
      .getElementById("save")
      .addEventListener(
        "click",
        () => {

          const metadata = {};

          ids.forEach(
            (id) => {

              let value =
                document
                  .getElementById(
                    id
                  )
                  .value;

              /*
               * Normalize both:
               *
               * ,
               *
               * and:
               *
               * ،
               *
               * before splitting tags.
               */
              if (
                id === "tags"
              ) {

                value =
                  value
                    .replace(
                      /،/g,
                      ","
                    )
                    .split(",")
                    .map(
                      (x) =>
                        x.trim()
                    )
                    .filter(
                      Boolean
                    );

              }

              metadata[id] =
                value;

            }
          );

          metadata.thumbnail =
            thumbnailInput.value
              .trim();

          metadata.featured =
            document
              .getElementById(
                "featured"
              )
              .checked;

          vscode.postMessage({
            type: "save",
            metadata
          });

        }
      );

    /*
     * VALIDATE THIS DOCUMENT
     */
    document
      .getElementById(
        "validate"
      )
      .addEventListener(
        "click",
        () => {

          vscode.postMessage({
            type:
              "validateDocument"
          });

        }
      );

  </script>

</body>

</html>`;
}
