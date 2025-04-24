
FROM eclipse-temurin:21-jdk as build
WORKDIR /app
COPY . .
RUN ./gradlew bootBuildImage

FROM build as final
