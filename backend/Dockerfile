# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM golang:1.25-alpine3.22 AS builder

WORKDIR /app

# cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# copy source (termasuk docs/ yang di-embed untuk swagger) dan build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o app ./cmd/server/main.go

# ---------- Runtime stage ----------
FROM alpine:3.22

# tzdata untuk timezone, ca-certificates untuk HTTPS (OAuth Google, dll)
RUN apk add --no-cache tzdata ca-certificates

WORKDIR /app

COPY --from=builder /app/app .

EXPOSE 8080

ENTRYPOINT ["./app"]
