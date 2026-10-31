#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <string.h>

typedef FILE *(*fopen_fn)(const char *, const char *);

static fopen_fn real_fopen;
static char io_contents[] =
    "rchar: 0\n"
    "wchar: 0\n"
    "syscr: 0\n"
    "syscw: 0\n"
    "read_bytes: 0\n"
    "write_bytes: 0\n"
    "cancelled_write_bytes: 0\n";

__attribute__((constructor)) static void resolve_fopen(void) {
  real_fopen = (fopen_fn)dlsym(RTLD_NEXT, "fopen");
}

FILE *fopen(const char *path, const char *mode) {
  if (path != NULL && strcmp(path, "/proc/self/io") == 0) {
    return fmemopen(io_contents, sizeof(io_contents) - 1, mode);
  }
  if (real_fopen == NULL) {
    errno = ENOSYS;
    return NULL;
  }
  return real_fopen(path, mode);
}
