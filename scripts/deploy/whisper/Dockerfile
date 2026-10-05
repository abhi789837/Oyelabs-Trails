# v4.4: the speech-to-text server (whisper.cpp), rebuilt for portable CPUs.
#
# Why not use the upstream image as-is: `ghcr.io/ggml-org/whisper.cpp:main` is compiled with
# GGML_NATIVE=ON, i.e. `-march=native` of whatever CI runner built it. On a CPU without the same
# instruction set (measured: an Intel i5-12500H, AVX2 but no AVX-512) `whisper-server` dies with
# SIGILL (exit 132) the moment it loads the model. A VPS CPU is just as much of a lottery.
#
# Two stages: build from the source the upstream image already carries (same commit), on the same
# Ubuntu 22.04 base plus a C++ compiler, then copy the binaries back into the upstream image, which
# has ffmpeg (needed for --convert). GGML_NATIVE=OFF plus GGML_CPU_ALL_VARIANTS builds one CPU
# backend per instruction-set level, and ggml loads the best one the host supports at start-up
# (GGML_BACKEND_DL).
#
# Pinned by digest so a rebuild is reproducible; bump it deliberately.
FROM ghcr.io/ggml-org/whisper.cpp@sha256:8b87d9c2d946352145cb2624f1cea2127e0af298157547108e95ca3538aaced3 AS upstream

FROM ubuntu:22.04 AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=upstream /app /src
WORKDIR /src
RUN rm -rf build \
 && cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=OFF -DGGML_BACKEND_DL=ON -DGGML_CPU_ALL_VARIANTS=ON \
      -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=ON \
 && cmake --build build -j"$(nproc)" --config Release --target whisper-server whisper-bench

FROM upstream
RUN rm -rf /app/build
COPY --from=build /src/build/bin /app/build/bin

COPY download-model.sh /usr/local/bin/download-model.sh
RUN chmod 0755 /usr/local/bin/download-model.sh

ENV PATH=/app/build/bin:$PATH \
    LD_LIBRARY_PATH=/app/build/bin

# Runs as an unprivileged user: the upstream README warns against running the server (which
# shells out to ffmpeg on uploaded files) as root. /tmp is where --convert writes its WAVs.
RUN useradd --system --uid 10001 --home-dir /tmp whisper
USER whisper
WORKDIR /tmp

ENTRYPOINT ["bash", "-c"]
CMD ["exec whisper-server --host 0.0.0.0 --port 8080 -m /models/ggml-base.en.bin -t 3 --convert --inference-path /v1/audio/transcriptions"]
