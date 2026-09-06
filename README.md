# Frontmatter Studio

**A visual frontmatter editor for Markdown files in Visual Studio Code.**

Frontmatter Studio makes it easy to create, edit, and validate Markdown frontmatter without manually working with YAML syntax.

Built by **Generalsoft FZ-LLC**.

**English | [اردو](README-ur.md)**

---

## ✨ Features

### Visual Frontmatter Editor

Edit Markdown frontmatter through a clean visual interface instead of editing YAML manually.

Supported fields include:

* Title
* Description
* Author
* Date
* Thumbnail
* Tags

### 📅 Date Picker

Select frontmatter dates using a native calendar picker.

Dates are preserved correctly when reading and writing frontmatter.

### 🌐 Arabic & Urdu RTL Support

Frontmatter Studio automatically detects Arabic and Urdu text and switches the editor to **right-to-left (RTL)** text direction.

This makes editing multilingual content more natural and readable.

### 🏷️ Tags

Enter tags using a simple comma-separated format.

Arabic and Urdu commas (`،`) are automatically normalized to standard commas.

Tags are saved as an inline YAML array:

```yaml
tags: ["اسلام", "مذہب", "دین"]
```

### 🖼️ Thumbnail Picker

Select an image from your workspace using a file picker.

The selected thumbnail is stored as a workspace-relative path and displayed with an image preview.

### ✅ Frontmatter Validation

Validate the frontmatter of the currently linked Markdown document and identify invalid or malformed frontmatter before saving.

### 💾 Safe Editing

Changes are written back to the original Markdown document.

The editor keeps track of the linked Markdown file even if its editor tab is closed.

---

## 🚀 Getting Started

1. Open a Markdown (`.md`) file in Visual Studio Code.

2. Open the Command Palette:

   `Cmd + Shift + P` on macOS
   `Ctrl + Shift + P` on Windows/Linux

3. Run:

   **Frontmatter Studio: Open Editor**

4. Edit your frontmatter using the visual editor.

5. Save your changes.

---

## 📋 Example Frontmatter

Frontmatter Studio works with standard Markdown frontmatter such as:

```yaml
---
title: "My Article"
description: "An example Markdown document"
author: "Generalsoft"
date: "2026-09-07"
thumbnail: "images/example.jpg"
tags: ["اسلام", "مذہب", "دین"]
---
```

---

## 🛠️ Commands

Open the Command Palette and search for **Frontmatter Studio**.

Available commands:

* **Frontmatter Studio: Open Editor**
* **Frontmatter Studio: Validate Frontmatter**

---

## 🌍 Multilingual Content

Frontmatter Studio is designed to work with multilingual Markdown content.

Arabic and Urdu text is automatically detected and displayed using right-to-left text direction where appropriate.

For example:

```yaml
title: "اسلام اور معاشرہ"
description: "ایک مختصر تعارف"
tags: ["اسلام", "مذہب", "دین"]
```

---

## 📁 Thumbnail Paths

When selecting a thumbnail from the workspace, Frontmatter Studio stores the image using a workspace-relative path.

For example:

```yaml
thumbnail: "images/my-thumbnail.jpg"
```

This keeps Markdown documents portable within the workspace.

---

## 🔒 Privacy

Frontmatter Studio is designed to edit files locally within Visual Studio Code.

The extension does not require an external account or cloud service to edit frontmatter.

---

## 🐛 Issues & Feedback

If you encounter a problem or have a feature suggestion, please contact **Generalsoft FZ-LLC** through the support channel provided with the extension.

When reporting an issue, please include:

* Your Visual Studio Code version
* Your operating system
* A description of the problem
* A sample of the relevant frontmatter, if possible

Please avoid sharing private or sensitive content.

---

## 📄 License

Frontmatter Studio is distributed under the **MIT License**.

See the `LICENSE` file included with the extension for details.

---

## 🏢 About Generalsoft

**Generalsoft FZ-LLC** develops practical software and developer tools designed to simplify digital workflows and improve productivity.

**Frontmatter Studio** is developed and maintained by Generalsoft FZ-LLC.

