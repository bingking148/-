FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_ENV=prod

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --timeout=100 -r /app/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . /app/

WORKDIR /app/easys_django

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "easys_django.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
