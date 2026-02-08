FROM python:3
COPY . /usr/src/bioAI/backend
WORKDIR /usr/src/bioAI/backend
RUN pip install -r requirements.txt
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]