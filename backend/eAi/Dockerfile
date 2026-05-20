FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl tesseract-ocr
WORKDIR /app
COPY target/docform-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
