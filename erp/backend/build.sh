#!/usr/bin/env bash
# Render build script — Cardinal Property Development ERP (single-tenant).
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Applying migrations..."
python manage.py migrate --no-input

echo "Seeding / aligning the development chart of accounts (idempotent)..."
python manage.py seed_development_coa || true

echo "Build completed successfully."
