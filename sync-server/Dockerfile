# Imagen base ligera de Python 3.12
FROM python:3.12-slim

# Instalar cron y tzdata (para zona horaria de Paraguay)
RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    tzdata \
 && rm -rf /var/lib/apt/lists/*

# Zona horaria local (para que el cron y los logs estén en hora paraguaya)
ENV TZ=America/Asuncion
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Instalar dependencias Python primero (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el script y el cron schedule
COPY sync.py crontab entrypoint.sh ./
RUN chmod +x entrypoint.sh \
 && crontab crontab

# Arranque: corre sync inicial + cron en foreground
ENTRYPOINT ["./entrypoint.sh"]
