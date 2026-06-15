"""Backfill category-specific subsidiary accounts for existing landlords.

For every landlord that already owns at least one property, create the full
slate of sub-accounts implied by the property's management_type
(rental: 12, levy: 10). Idempotent.
"""
from django.core.management.base import BaseCommand

from apps.masterfile.models import Landlord
from apps.accounting.models import SubsidiaryAccount


class Command(BaseCommand):
    help = 'Seed subsidiary accounts for all landlords in all tenant schemas.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schema', type=str, default=None,
            help='Only run in this tenant schema (defaults to all non-public tenants).'
        )

    def handle(self, *args, **opts):
        self.stdout.write('--- cardinal ---')
        self._seed_schema()

    def _seed_schema(self):
        landlords = Landlord.objects.prefetch_related('properties').all()
        total_created = 0
        for landlord in landlords:
            prop = landlord.properties.first()
            mgmt_type = prop.management_type if prop else 'rental'
            before = SubsidiaryAccount.objects.filter(landlord=landlord).count()
            SubsidiaryAccount.seed_for_landlord(landlord, management_type=mgmt_type)
            after = SubsidiaryAccount.objects.filter(landlord=landlord).count()
            created = after - before
            total_created += created
            self.stdout.write(
                f'  {landlord.code} {landlord.name}: {before} -> {after} '
                f'({mgmt_type}, +{created})'
            )
        self.stdout.write(self.style.SUCCESS(
            f'Total new sub-accounts: {total_created}'
        ))
