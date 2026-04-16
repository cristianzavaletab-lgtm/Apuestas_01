# 🚀 Guía de Despliegue en Render (BetPredict)

Sigue estos pasos para poner tu terminal online en menos de 5 minutos.

## 1. Preparación del Repositorio
Asegúrate de que tus archivos estén en un repositorio de **GitHub** o **GitLab**. Gracias al archivo `render.yaml` que he creado, Render detectará automáticamente la configuración.

## 2. Creación del Servicio en Render
1. Ve a [dashboard.render.com](https://dashboard.render.com).
2. Haz clic en **"New +"** y selecciona **"Blueprint"**.
3. Conecta tu repositorio de GitHub.
4. Render leerá el archivo `render.yaml` y configurará el servicio automáticamente.

## 3. Configuración de Variables de Entorno
**IMPORTANTE**: Debes ir a la sección **"Environment"** de tu servicio en Render y añadir las siguientes llaves (puedes copiarlas de tu `.env` actual):

*   `OPENAI_API_KEY`: Tu clave de OpenAI (obligatoria para análisis táctico).
*   `GEMINI_API_KEY`: Tu clave de Google Gemini (opcional, como respaldo).
*   `THE_ODDS_API_KEY`: Tu clave de The Odds API (para datos en vivo).
*   `MONGODB_URI`: El link de tu cluster de MongoDB Atlas (si quieres persistencia de datos).

## 4. Despliegue
- Una vez guardadas las variables, Render iniciará el **"Build"**.
- En un par de minutos, tendrás una URL pública (ej: `https://betpredict-xxxx.onrender.com`).

## Notas Adicionales
- He configurado `compression` para que la carga sea súper rápida.
- El sistema detectará automáticamente si estás en producción o desarrollo.
- Usa `npm start` como comando de inicio (ya está configurado).

¡Mucha suerte con el lanzamiento! 🏁
