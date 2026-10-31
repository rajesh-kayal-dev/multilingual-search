FROM ubuntu:22.04 AS shim-build

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY proc-io-shim.c /tmp/proc-io-shim.c
RUN gcc -shared -fPIC -O2 -Wall -Wextra -o /tmp/proc-io-shim.so /tmp/proc-io-shim.c -ldl

FROM typesense/typesense:30.2
COPY --from=shim-build /tmp/proc-io-shim.so /opt/proc-io-shim.so
ENV LD_PRELOAD=/opt/proc-io-shim.so
