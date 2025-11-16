# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal cybersecurity blog built with Jekyll using the Chirpy theme, hosted on GitHub Pages at https://gnutlam.github.io. The blog focuses on white hat hacking, security research, and learning experiences.

## Build and Development Commands

### Local Development
```bash
# Install dependencies
bundle install

# Build the site locally
bundle exec jekyll build

# Serve locally with live reload (default: http://localhost:4000)
bundle exec jekyll serve

# Build for production environment
JEKYLL_ENV=production bundle exec jekyll build
```

### Testing
```bash
# Run HTML validation tests
bundle exec htmlproofer ./_site
```

## Deployment

The site uses GitHub Actions for automated deployment:
- Workflow file: [.github/workflows/pages-deploy.yml](.github/workflows/pages-deploy.yml)
- Triggers on push to `main` or `master` branches
- Can be manually triggered via workflow_dispatch
- Ruby version: 3.3
- Build command: `bundle exec jekyll b` with JEKYLL_ENV=production

### Important Deployment Notes
- Gemfile.lock is tracked and includes Linux platform for GitHub Actions compatibility
- Bundle cache is disabled in CI to allow platform-specific lock file updates
- Full git history (`fetch-depth: 0`) is required for the last-modified hook

## Architecture

### Content Structure
- **Posts**: Place blog posts in `_posts/` directory (currently empty, ready for content)
  - Naming: `YYYY-MM-DD-title.md`
  - Front matter: layout (post), title, date, categories, tags
  - Default permalink: `/posts/:title/`
- **Pages/Tabs**: Navigation pages in `_tabs/` (About, Archives, Categories, Tags)
  - Use `icon` and `order` in front matter for sidebar positioning
- **Data Files**: `_data/` contains contact info (`contact.yml`) and sharing settings (`share.yml`)
- **Custom Layouts**: `_includes/` contains modified footer template

### Configuration
- Main config: [_config.yml](_config.yml)
- Theme: jekyll-theme-chirpy v7.4+
- Timezone: Asia/Ho_Chi_Minh
- Pagination: 10 posts per page
- Required plugins (defined in both Gemfile and _config.yml):
  - jekyll-archives
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-feed
  - jekyll-seo-tag

### Custom Features
- **Last Modified Hook**: [_plugins/posts-lastmod-hook.rb](_plugins/posts-lastmod-hook.rb)
  - Automatically sets `last_modified_at` for posts with multiple git commits
  - Uses git history to track when posts were last updated
  - Only applies to posts with more than 1 commit
- **PWA Support**: Enabled with offline caching
- **Footer Customization**: Modified copyright footer in [_includes/footer.html](_includes/footer.html)

### Asset Management
- Avatar: `/assets/img/avatar.png`
- Syntax highlighting: Rouge with custom options (line numbers enabled for blocks)
- Kramdown for Markdown processing

## Content Guidelines

When creating new blog posts in `_posts/`:
- Use YAML front matter with: title, date, categories, tags
- Categories and tags are auto-archived via jekyll-archives plugin
- Table of contents (TOC) is enabled by default
- Code blocks support line numbers and syntax highlighting
- Comments system can be configured (currently disabled)

## Site Metadata
- Author: GnutLam
- GitHub: gnutlam
- Twitter/X: @GnutTlam
- Email: trantunglamhsgs@gmail.com
- Tagline: "A Noob's Hacking Log"
