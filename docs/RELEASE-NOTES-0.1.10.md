## Safe update preview and apply

The Windows GUI now separates update checking from writing files. Check Updates reads remote material and shows a course-level summary before anything is written. Download Checked Updates applies that plan explicitly.

Each course reports new, unchanged, locally modified, and failed files. Existing files that differ locally are never overwritten; remote content is saved beside them with a SHA-256 suffix. The CLI provides the same read-only preview with `toledo-sync check`.

### SHA-256

- `Toledo.Sync.Setup.0.1.10.exe`: `dd72e46bb0e7a8465db1080fa3c9d43885a21a1e5a63f93399dc775ce195bce2`
- `Toledo.Sync.0.1.10.exe`: `3dd5752d3673824f89f2ec09da856a99f620b70efec4e7730eb10f5ac9357654`
