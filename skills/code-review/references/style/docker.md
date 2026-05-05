# Style / Maintainability — Docker checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch Dockerfiles or compose files.

- [ ] Base images use specific version tags, not `latest`
- [ ] `COPY` preferred over `ADD` (unless extracting an archive or fetching a URL is the intent)
- [ ] `.dockerignore` excludes build artifacts, `.git`, secrets, and IDE files
