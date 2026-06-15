"""Seed the ERP with the developments shown on the public marketing website.

Reads the same stands.json payloads the public site serves, so the dashboard's
inventory mirrors the website exactly — identical stand numbers and statuses,
which makes the public availability map fully ERP-driven (the CMS link).

Also seeds:
  * per-stand website inquiries (trackable against a specific stand), and
  * a few reservations (purchase agreements activated + a deposit paid),

so the dashboard, CRM and sales pages look populated for the demo.

Idempotent. Use --reset to wipe seeded developments first.
"""
import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction


# slug -> (name, location, project-status)
META = {
    'silverbrook': ('Silverbrook Estate', 'Ruwa · 18 km from Harare CBD', 'now_selling'),
    'halcyon-days': ('Halcyon Days', 'Harare', 'now_selling'),
    'sunbird-villas': ('Sunbird Villas', 'Harare', 'now_selling'),
    'arkenstone': ('Arkenstone', 'Borrowdale Brooke, Harare', 'now_selling'),
    'newport': ('Newport', 'SA Highway · 22 km from Harare CBD', 'now_selling'),
    'bridgewood': ('Bridgewood', 'Gweru', 'now_selling'),
    'northbrook': ('Northbrook Estate', 'Bulawayo North · 11 km from CBD', 'now_selling'),
    'peakwood-village': ('Peakwood Village', 'Greendale, Harare', 'now_selling'),
    '100-on-montgomery': ('100 on Montgomery', 'Highlands, Harare', 'now_selling'),
    'the-strand': ('The Strand Office Park', 'Borrowdale, Harare', 'now_selling'),
    'jetway': ('Jetway Industrial Park', 'Airport Road, Harare', 'now_selling'),
    'skyport': ('Skyport Industrial Park', 'Airport Road, Harare', 'now_selling'),
    'turnpike': ('Turnpike Industrial Park', 'Bulawayo Road · 29 km from CBD', 'now_selling'),
    'ironstone': ('Ironstone Industrial Park', 'Seke Road, Harare', 'now_selling'),
}

STATUS_MAP = {'available': 'available', 'reserved': 'reserved', 'sold': 'sold'}


def _public_dir():
    """Locate cardinal-demo/public/api/developments from the backend."""
    base = Path(settings.BASE_DIR)
    for cand in [
        base.parent.parent / 'public' / 'api' / 'developments',   # erp/backend -> cardinal-demo
        base.parent / 'public' / 'api' / 'developments',
        base.parent.parent.parent / 'public' / 'api' / 'developments',
    ]:
        if cand.exists():
            return cand
    return None


def _centroid(geometry):
    """Average of a GeoJSON-order [lng,lat] ring -> (lat, lng)."""
    if not geometry:
        return None, None
    lngs = [p[0] for p in geometry]
    lats = [p[1] for p in geometry]
    return round(sum(lats) / len(lats), 6), round(sum(lngs) / len(lngs), 6)


class Command(BaseCommand):
    help = "Seed developments, stands, inquiries and reservations from the public website data."

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete seeded developments first.')

    @transaction.atomic
    def handle(self, *args, **options):
        from decimal import Decimal
        from apps.developments.models import (
            Developer, DevelopmentProject, Stand, Buyer, PurchaseAgreement, Inquiry,
        )

        pub = _public_dir()
        if not pub:
            self.stderr.write(self.style.ERROR('Could not locate public/api/developments. Aborting.'))
            return

        developer, _ = Developer.objects.get_or_create(
            name='Cardinal Properties', defaults={'is_active': True}
        )

        if options['reset']:
            slugs = list(META.keys())
            PurchaseAgreement.all_objects.filter(project__slug__in=slugs).delete()
            Stand.all_objects.filter(project__slug__in=slugs).delete()
            DevelopmentProject.all_objects.filter(slug__in=slugs).delete()
            Inquiry.objects.filter(development_slug__in=slugs).delete()
            self.stdout.write(self.style.WARNING('Reset: seeded developments cleared.'))

        projects_created, stands_created = 0, 0
        seeded_projects = {}

        for slug, (name, location, status) in META.items():
            f = pub / slug / 'stands.json'
            if not f.exists():
                continue
            data = json.loads(f.read_text())
            stands = data.get('stands', [])

            project, was_new = DevelopmentProject.objects.get_or_create(
                slug=slug,
                defaults=dict(
                    name=name, location=location, developer=developer,
                    status=status, total_stands=len(stands), is_active=True,
                ),
            )
            if was_new:
                projects_created += 1
            seeded_projects[slug] = project

            # Seed stands only if the project has none yet (idempotent).
            if not project.stands.exists() and stands:
                rows = []
                for s in stands:
                    lat, lng = _centroid(s.get('geometry'))
                    rows.append(Stand(
                        project=project,
                        stand_number=str(s.get('id') or s.get('n')),
                        size_sqm=Decimal(str(s.get('area') or 0)),
                        selling_price=Decimal(str(s.get('price') or 0)),
                        currency='USD',
                        latitude=lat, longitude=lng,
                        status=STATUS_MAP.get(s.get('status'), 'available'),
                    ))
                Stand.objects.bulk_create(rows, batch_size=500)
                stands_created += len(rows)

        # ---- Per-stand website inquiries (trackable) -----------------------
        inquiries_created = 0
        sample_leads = [
            ('Tatenda Mlambo', 'tatenda@example.co.zw', '+263772100200', 'silverbrook', 'new'),
            ('Rufaro Sibanda', 'rufaro@example.co.zw', '+263773221144', 'silverbrook', 'contacted'),
            ('Brian Ncube', 'brian.ncube@example.co.zw', '+263712889900', 'newport', 'qualified'),
            ('Chiedza Dube', 'chiedza@example.co.zw', '+263774553311', 'northbrook', 'new'),
            ('Farai Gumbo', 'farai@example.co.zw', '+263778112233', 'jetway', 'contacted'),
        ]
        for full_name, email, phone, slug, st in sample_leads:
            proj = seeded_projects.get(slug)
            if not proj:
                continue
            # tie each lead to a specific available stand
            stand = proj.stands.filter(status='available').order_by('stand_number').first()
            obj, made = Inquiry.objects.get_or_create(
                email=email, development_slug=slug,
                defaults=dict(
                    full_name=full_name, phone=phone, kind=Inquiry.Kind.STAND if stand else Inquiry.Kind.DEVELOPMENT,
                    development=proj, development_name=proj.name,
                    stand_number=stand.stand_number if stand else '',
                    message=f"Interested in {('stand ' + stand.stand_number) if stand else proj.name}. Please send pricing and a payment plan.",
                    status=st, source='website',
                ),
            )
            if made:
                inquiries_created += 1

        # ---- A few reservations (agreements) on Silverbrook ---------------
        agreements_created = 0
        sb = seeded_projects.get('silverbrook')
        if sb:
            buyer_specs = [
                ('Nyasha Chiwara', '63-2011447X18', 25000, 5000),
                ('Tendai Marufu', '63-1882013Z42', 28000, 8000),
            ]
            free = list(sb.stands.filter(status='available').order_by('stand_number')[:len(buyer_specs)])
            for (bname, nid, price, dep), stand in zip(buyer_specs, free):
                if PurchaseAgreement.objects.filter(stand=stand).exists():
                    continue
                buyer, _ = Buyer.objects.get_or_create(full_name=bname, defaults={'national_id': nid})
                agr = PurchaseAgreement.objects.create(
                    developer=developer, project=sb, stand=stand, buyer=buyer,
                    sale_price=Decimal(str(price)), deposit_amount=Decimal(str(dep)),
                    installment_term_months=36,
                )
                agr.activate()          # reserves the stand + posts the sale to the GL
                agr.generate_schedule()  # builds the 36-month plan
                agreements_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {projects_created} developments, {stands_created} stands, "
            f"{inquiries_created} inquiries, {agreements_created} reservations."
        ))
