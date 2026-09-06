# Changelog

All notable changes to **Frontmatter Studio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows Semantic Versioning.

## [0.1.0] - 2026-09-07

### Added

* Visual editor for Markdown frontmatter.
* Support for common frontmatter fields including:

  * Title
  * Description
  * Author
  * Date
  * Thumbnail
  * Tags
* Calendar date picker for frontmatter dates.
* Automatic right-to-left text direction for Arabic and Urdu content.
* Support for inline YAML tag arrays.
* Normalization of Arabic/Urdu commas (`،`) to standard commas when editing tags.
* Thumbnail file picker for workspace images.
* Thumbnail image preview inside the editor.
* Validation of frontmatter before saving.
* Save changes directly back to the linked Markdown file.
* Remembers the linked Markdown document even when its editor tab is closed.
* YAML parsing that preserves frontmatter dates as text values.
* Commands for opening Frontmatter Studio and validating frontmatter.

### Fixed

* Frontmatter dates not appearing correctly in the editor.
* YAML dates being automatically converted to JavaScript `Date` objects.
* Editing issues when the linked Markdown document was closed.
* Tag formatting and Arabic/Urdu comma handling.

### Notes

This is the initial public release of Frontmatter Studio.

Frontmatter Studio is developed and maintained by **Generalsoft FZ-LLC**.

